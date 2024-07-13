import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

# Load the pre-trained LSTM model
model = load_model('lstm_model.h5')  # Replace with your model path

# Load data from CSV
df = pd.read_csv('BTC-USD_24H.csv')

# Convert 'Date' column to datetime and set as index
df['Date'] = pd.to_datetime(df['Date'])
df.set_index('Date', inplace=True)

df_full = df
df = df.iloc[:-301]

# Extract 'Close' prices
close_prices = df['Close'].values.reshape(-1, 1)

# Normalize data
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(close_prices)

# Prepare sequences for LSTM model
def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data)-seq_length):
        x = data[i:i+seq_length]
        y = data[i+seq_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

# Sequence length for LSTM input
sequence_length = 60  # Adjust as needed based on your model's input size

# Create sequences
X, y = create_sequences(scaled_data, sequence_length)

# Reshape data for LSTM (samples, time steps, features)
X = np.reshape(X, (X.shape[0], X.shape[1], 1))

# Predict future values
predictions = []
current_sequence = X[-1]  # Start with the last sequence in X

for _ in range(300):
    next_value = model.predict(current_sequence.reshape(1, sequence_length, 1))[0, 0]
    predictions.append(next_value)
    
    # Update current sequence to include predicted value and drop the first value
    current_sequence = np.roll(current_sequence, -1, axis=0)
    current_sequence[-1] = next_value

# Inverse transform predictions to get actual prices
predicted_prices = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))

# Plotting
plt.figure(figsize=(14, 7))
plt.plot(df.index, df['Close'], label='Historical Close Prices', color='blue')
plt.plot(pd.date_range(start=df.index[-1], periods=301, freq='T')[1:], predicted_prices, label='Predicted Close Prices', linestyle='--', color='red')
plt.title('Historical and Predicted Close Prices')
plt.xlabel('Date')
plt.ylabel('Close Price')
plt.legend()
plt.grid(True)
plt.show()
