import pandas as pd

from data_fetching import DataFetching
import predict


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

            # Display the DataFrame
            return_obj = predict.predict_next_trend(df)
            #print(return_obj)
            if len(self.prediction_data) >= 10:
                self.prediction_data.pop(0)
            self.prediction_data.append(return_obj)
            self.data_array = []  # Reset the array or handle it as needed

    def populate_for_5_minutes(self):
        pass

    def populate_for_days(self):
        pass

    def populate_array(self, frequency):
        print(frequency)
        # Fetch the latest bitcoin price data
        latest_data = self.data_fetch_manager.get_latest_bitcoin_price()
        
        if frequency == 'minute':
            self.populate_for_seconds(latest_data)
        else:
            print('Not minute')

    
