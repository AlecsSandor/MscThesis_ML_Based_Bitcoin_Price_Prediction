import numpy as np  # Importing numpy library for numerical operations
import pandas as pd  # Importing pandas library for data manipulation
from sklearn.preprocessing import MinMaxScaler  # Importing MinMaxScaler for normalization
import matplotlib.pyplot as plt  # Importing matplotlib for plotting
import tensorflow as tf  # Importing TensorFlow library for machine learning
from tensorflow.keras.models import Sequential  # Importing Sequential model from Keras
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization  # Importing LSTM, Dense, and Dropout layers from Keras
from sklearn.metrics import mean_squared_error, mean_absolute_error  # Importing evaluation metrics from sklearn
from tensorflow.keras.regularizers import L2

# Load the dataset
file_path = 'BTC-USD_24H.csv'  # File path for the dataset (replace with your file path)
df = pd.read_csv(file_path)  # Reading the CSV file into a pandas DataFrame

# Convert the 'Date' column to datetime and set it as index
df['Date'] = pd.to_datetime(df['Date'])  # Converting 'Date' column to datetime format
df.set_index('Date', inplace=True)  # Setting 'Date' column as the index of the DataFrame

# Extract the 'Close' prices
close_prices = df['Close'].values  # Extracting 'Close' prices as numpy array

# Normalize the 'Close' prices using MinMaxScaler
scaler = MinMaxScaler(feature_range=(0, 1))  # Creating MinMaxScaler object
scaled_close_prices = scaler.fit_transform(close_prices.reshape(-1, 1))  # Normalizing 'Close' prices

# Function to create sequences for LSTM
def create_sequences(data, seq_length):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length):
        sequences.append(data[i:i+seq_length])  # Creating sequences of length seq_length
        labels.append(data[i+seq_length])  # Creating labels for each sequence
    return np.array(sequences), np.array(labels)

# Create sequences for training
seq_length = 60  # Length of each sequence
X, y = create_sequences(scaled_close_prices, seq_length)  # Creating sequences and labels

# Split the data into training and test sets
split_ratio = 0.8  # Ratio of training data
train_size = int(len(X) * split_ratio)  # Size of training data
X_train, X_test = X[:train_size], X[train_size:]  # Splitting sequences into training and test sets
y_train, y_test = y[:train_size], y[train_size:]  # Splitting labels into training and test sets

# Define the LSTM model architecture
model = Sequential([
    LSTM(50, return_sequences=False, input_shape=(seq_length, 1), kernel_regularizer=L2(0.01)),
    Dropout(0.2),
    #BatchNormalization(),
    Dense(1)
])

# Compile the LSTM model
model.compile(optimizer='adam', loss='mean_squared_error')  
# Compiling the model with Adam optimizer, which is effective for training neural networks, and using Mean Squared Error as the loss function

# Train the LSTM model
history = model.fit(X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test), verbose=1)  
# Training the model with 20 epochs (iterations over the entire dataset), batch size of 32 (number of samples per gradient update), and using validation data for monitoring performance

# Evaluate the LSTM model
train_loss = model.evaluate(X_train, y_train, verbose=0)  
# Evaluating training loss

test_loss = model.evaluate(X_test, y_test, verbose=0)  
# Evaluating test loss

print(f'Train Loss: {train_loss:.4f}, Test Loss: {test_loss:.4f}')  
# Printing training and test loss

# Make predictions with the LSTM model
train_predictions = model.predict(X_train)  
# Making predictions on training data

test_predictions = model.predict(X_test)  
# Making predictions on test data

train_predictions = scaler.inverse_transform(train_predictions)  
# Inverse transforming training predictions to get actual 'Close' prices

test_predictions = scaler.inverse_transform(test_predictions)  
# Inverse transforming test predictions to get actual 'Close' prices

y_train_scaled = scaler.inverse_transform(y_train.reshape(-1, 1))  
# Inverse transforming training labels to get actual 'Close' prices

y_test_scaled = scaler.inverse_transform(y_test.reshape(-1, 1))  
# Inverse transforming test labels to get actual 'Close' prices

# Calculate evaluation metrics
mse = mean_squared_error(y_test_scaled, test_predictions)  
# Calculating Mean Squared Error between actual test prices and predicted test prices

mae = mean_absolute_error(y_test_scaled, test_predictions)  
# Calculating Mean Absolute Error between actual test prices and predicted test prices

print(f'Mean Squared Error: {mse:.4f}')  
# Printing Mean Squared Error

print(f'Mean Absolute Error: {mae:.4f}')  
# Printing Mean Absolute Error

# Plot the results
train = df[:train_size+seq_length]  
# Selecting training data for plotting

valid = df[train_size+seq_length:]  
# Selecting validation (test) data for plotting

valid['Predictions'] = test_predictions  
# Adding predicted 'Close' prices to validation DataFrame

train_indices = df.index[seq_length:train_size+seq_length]  
# Indices for training predictions

valid_indices = df.index[train_size+seq_length:]  
# Indices for validation predictions

# Plotting actual prices, training predictions, and test predictions
plt.figure(figsize=(16,8))
plt.title('Model')
plt.xlabel('Date')
plt.ylabel('Close Price USD ($)')
plt.plot(df['Close'], label='Actual Prices')  
# Plotting actual 'Close' prices

plt.plot(train_indices, train_predictions, label='Train Predictions', linestyle='--')  
# Plotting training predictions

plt.plot(valid_indices, valid['Predictions'], label='Test Predictions', linestyle='--')  
# Plotting test predictions

plt.legend(['Actual Prices', 'Train Predictions', 'Test Predictions'], loc='lower right')  
# Adding legend

plt.show()  
# Displaying the plot

# Save the trained model
model.save('lstm_model.h5')  
# Saving the LSTM model to a file

