import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
from sklearn.model_selection import train_test_split

def create_sequences(data, seq_length):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length):
        sequences.append(data[i:i+seq_length])
        labels.append(data[i+seq_length])
    return np.array(sequences), np.array(labels)

def predict_future_prices(model, data, n_steps, seq_length):
    predictions = []
    current_input = data[-seq_length:]  # Start with the last sequence in the data

    for _ in range(n_steps):
        # Reshape the input to be (1, seq_length, 1)
        current_input = current_input.reshape(1, seq_length, 1)
        # Make the prediction
        next_pred = model.predict(current_input)
        # Append the prediction to the list
        predictions.append(next_pred[0, 0])
        # Update the input with the new prediction
        current_input = np.append(current_input[:, 1:, :], next_pred.reshape(1, 1, 1), axis=1)
    
    return predictions

def main():
    # Load the new dataset
    new_file_path = 'BTC-USD_6M.csv'  # Replace with the path to your new dataset
    new_data = pd.read_csv(new_file_path)

    # Convert the 'Date' column to datetime and set it as index
    new_data['Date'] = pd.to_datetime(new_data['Date'])
    new_data.set_index('Date', inplace=True)

    # Extract the 'Close' prices
    new_close_prices = new_data['Close'].values

    # Normalize the 'Close' prices
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_new_close_prices = scaler.fit_transform(new_close_prices.reshape(-1, 1))

    # Create sequences for the new data
    seq_length = 60  # Sequence length
    X_new, _ = create_sequences(scaled_new_close_prices, seq_length)

    # Split data into training and test sets (using 60% for training)
    train_size = int(len(new_close_prices) * 0.6)
    train_data = scaled_new_close_prices[:train_size]
    test_data = scaled_new_close_prices[train_size:]

    # Load the model
    model = load_model('lstm_model.h5')

    # Predict the next n steps using only the test data
    n_steps = len(test_data)  # Number of future steps to predict (using test data size)
    future_predictions = predict_future_prices(model, test_data, n_steps, seq_length)

    # Inverse transform the predictions to get the actual price values
    future_predictions = scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1))

    # Create a DataFrame to store the predictions with dates
    future_dates = pd.date_range(start=new_data.index[train_size], periods=n_steps)
    future_df = pd.DataFrame(data=future_predictions, index=future_dates, columns=['Predicted Close'])

    # Plot the results
    plt.figure(figsize=(16,8))
    plt.title('Future Price Predictions')
    plt.xlabel('Date')
    plt.ylabel('Close Price USD ($)')
    plt.plot(new_data['Close'], label='Actual Prices')
    plt.plot(future_df, label='Future Predictions', linestyle='--')
    plt.legend(['Actual Prices', 'Future Predictions'], loc='lower right')
    plt.show()

if __name__ == "__main__":
    main()
