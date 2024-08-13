# Numpy library helps with numerical operation
import numpy as np

# Pandas library is used for data manipulation
import pandas as pd

# A very popular library for plotting graphs
import matplotlib.pyplot as plt

# Using the TensorFlow library for machine learning
import tensorflow as tf

# Importing model importing function from Keras
from tensorflow.keras.models import load_model

# A sklearn MinMaxScaler for normalization of our dataset
from sklearn.preprocessing import MinMaxScaler

#
from datetime import datetime, timedelta

import global_var

# Loading the pre-trained model
model = load_model('models/long_shot.h5')

# Thresholds for determining the strength of the trend
# Short - Shot
# up & down = 0.0015
#
# Long - Shot
# up = 0.05
# down = 0.005
upward_threshold = 0.01
downward_threshold = -0.01

# Prepare sequences for LSTM model - the exact same func like in the testing script
def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data[i:i + seq_length]
        y = data[i + seq_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

def create_timestamp():
    time_now = datetime.now().isoformat()

    # Parse the raw datetime string to a datetime object
    dt_object = datetime.fromisoformat(time_now)

    # Format the datetime object to the desired string format
    beautified_datetime = dt_object.strftime("%Y-%m-%d %H:%M:%S")

    return str(beautified_datetime)

def compute_percentage_differene(last_price, future_prices_mean):
    # Calculate the increase
    increase = future_prices_mean - last_price
    
    # Calculate the percentage increase
    percentage_increase = round((increase / last_price) * 100, 2)

    return percentage_increase

def predict_next_trend(data_frame):

    # Loading the data from CSV
    df = data_frame

    # Convert 'Date' column to datetime and set as index - same as in the training and testing scripts
    df['time'] = pd.to_datetime(df['time'])
    df.set_index('time', inplace=True)

    # Extract 'Close' prices
    close_prices = df['price'].values.reshape(-1, 1)

    # Normalizing data
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(close_prices)

    # Setting the sequence length for the LSTM input
    sequence_length = 60

    # Calling the create sequences func
    X, y = create_sequences(scaled_data, sequence_length)

    # Printing shapes to understand the dimensions
    print(f"Shape of X before reshaping: {X.shape}")
    print(f"Shape of y: {y.shape}")

    # Ensure X has the right shape before reshaping
    # The array X must be 3-dimensional.
    # The second dimension of X (which corresponds to the sequence length) must match the expected sequence_length.
    if X.ndim == 3 and X.shape[1] == sequence_length:
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    else:
        print("Error: X does not have the expected number of dimensions or sequence length.")

    # Debugging: Print shape after reshaping
    print(f"Shape of X after reshaping: {X.shape}")

    # Reshape this sequence to match the model's expected input shape: (1, sequence_length, 1)
    current_sequence = scaled_data[60 - sequence_length:60].reshape(1, sequence_length, 1)

    # Retrieve the current price by inversely transforming the current point in scaled_data to the original scale
    current_price = scaler.inverse_transform(scaled_data[60].reshape(-1, 1))[0, 0]
    
    # Initializijg  an empty list to store the predicted future prices.
    future_prices = []

    for j in range(60):

        # Predict the next value using the current sequence and add this value to future_prices
        next_value = model.predict(current_sequence)[0, 0]
        next_price = scaler.inverse_transform([[next_value]])[0, 0]
        future_prices.append(next_price)
        
        # Update the current sequence by appending the new predicted value and dropping the oldest value
        new_value_scaled = scaler.transform([[next_price]])
        current_sequence = np.append(current_sequence[:, 1:, :], new_value_scaled.reshape(1, 1, 1), axis=1)

    # Inverse transform predictions to get actual prices - similar to what was done in the training script
    predicted_prices = scaler.inverse_transform(np.array(current_sequence).reshape(-1, 1))
    
    # Calculate the average predicted price change percentage using the mean of future_prices
    predicted_change_percentage = (np.mean(future_prices) - current_price) / current_price * 100
    mean_of_future_prices = float(np.mean(future_prices))
    print(mean_of_future_prices)
    print(current_price)
    print(predicted_change_percentage)

    return_signal = ''

    # Strong upward trend detected, decide to buy
    if predicted_change_percentage > upward_threshold:
        return_signal = 'Buy'
        global_var.last_BTC_buy_price = df['price'].iloc[-1]
        print('Strong Buy signal with a predicted increase percentage of: ' + str(predicted_change_percentage))
    # Strong downward trend detected, decide to sell
    elif predicted_change_percentage < downward_threshold:
        return_signal = 'Sell'
        print('Strong Sell signal with a predicted decrease percentage of: ' + str(predicted_change_percentage))
    # Weak trend detected, hold position
    else:
        print('Weak Sell/Buy signal - Holding')
        return_signal = 'Hold'
        pass   


    data_frame.index.name = 'time'
    # Reset the index to convert 'time' into a column
    df_reset = data_frame.reset_index()
    # Convert 'time' column to string
    df_reset['time'] = df_reset['time'].astype(str)
    # Convert DataFrame to array of objects
    array_of_historical_price = df_reset.to_dict(orient='records')

    # Convert the data to the desired format
    array_of_future_price_before = [{'price': f'{price[0]:.2f}'} for price in predicted_prices]
    # Get the last time item from the first array
    last_time_str = array_of_historical_price[-1]['time']
    # Convert the last time string to a datetime object
    last_time = datetime.fromisoformat(last_time_str.replace("Z", "+00:00"))
    # Add the time property to each item in the second array, increasing by one second
    array_of_future_price = []
    for i, item in enumerate(array_of_future_price_before):
        new_time = last_time + timedelta(seconds=i + 1)
        new_item = {
            'time': new_time.isoformat(),
            'price': item['price']
        }
        
        array_of_future_price.append(new_item)

    if return_signal == 'Sell' and global_var.last_BTC_buy_price != 0:
        return_obj = {
            'historical_prices': array_of_historical_price,
            'future_prices': array_of_future_price,
            'signal': return_signal,
            'time': create_timestamp(),
            'profit': compute_percentage_differene(float(mean_of_future_prices), float(global_var.last_BTC_buy_price))
        } 
    else:
        return_obj = {
            'historical_prices': array_of_historical_price,
            'future_prices': array_of_future_price,
            'signal': return_signal,
            'time': create_timestamp(),
            'profit': 0
        }
    return return_obj