import pandas as pd

from data_fetching import DataFetching
import predict
import predict_long


class DataHandler:

    def __init__(self):
        self.data_fetch_manager = DataFetching()
        self.data_array = []
        self.prediction_data = []

    def populate_for_seconds(self, latest_data):
        # Append the fetched data to the data_array
        self.data_array.append(latest_data)
        if len(self.data_array) == 61:

            # Create a DataFrame from the JSON data
            df = pd.DataFrame(self.data_array)

            # Columns to drop
            columns_to_drop = ['ask', 'bid', 'volume', 'trade_id', 'size', 'rfq_volume']

            # Drop the columns
            df = df.drop(columns=columns_to_drop)

            # Predict next prices
            return_obj = predict.predict_next_trend(df)
            #print(return_obj)
            if len(self.prediction_data) >= 10:
                self.prediction_data.pop(0)
            self.prediction_data.append(return_obj)
            self.data_array = []  # Reset the array

    def populate_for_5_minutes(self, latest_data):
        # Convert the data to a DataFrame
        df = pd.DataFrame(latest_data["prices"], columns=["time", "price"])

        # Converting prices to strings
        df['price'] = df['price'].astype(str)

        # Keep only the last 61 points
        df_last_61 = df.tail(61)

        # Predict next prices
        return_obj = predict.predict_next_trend(df_last_61)
    
        if len(self.prediction_data) >= 10:
            self.prediction_data.pop(0)
        self.prediction_data.append(return_obj)

    def populate_for_days(self, latest_data):
        # Convert the data to a DataFrame
        df = pd.DataFrame(latest_data["prices"], columns=["time", "price"])
        
        # Converting prices to strings
        df['price'] = df['price'].astype(str)

        # Predict next prices
        return_obj = predict_long.predict_next_trend(df)
    
        if len(self.prediction_data) >= 10:
            self.prediction_data.pop(0)
        self.prediction_data.append(return_obj)

    def populate_array(self, frequency):
        print(frequency)
        
        if frequency == 'minute':
            # Fetch the latest bitcoin price data
            latest_data = self.data_fetch_manager.get_latest_bitcoin_price()
            self.populate_for_seconds(latest_data)
        elif frequency == 'hour':
            # Fetch the latest bitcoin price data
            latest_data = self.data_fetch_manager.get_5_minutes_bitcoin_prices()
            self.populate_for_5_minutes(latest_data)
        elif frequency == 'day':
            # Fetch the latest bitcoin price data
            latest_data = self.data_fetch_manager.get_daily_bitcoin_prices()
            self.populate_for_days(latest_data)
    
