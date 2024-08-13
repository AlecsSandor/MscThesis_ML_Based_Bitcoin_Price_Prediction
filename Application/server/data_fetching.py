import requests

# Coingecko link for daily prices for the past 60 days (daily granulation):
last_60_days_API = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=60&interval=daily'

# Coingecko link for minute prices for the past 24 hours (5 minutes granulation):
last_24_minutes_API = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'

# Coinbase link for current price
current_API = 'https://api.pro.coinbase.com/products/BTC-USD/ticker'

class DataFetching:

    def get_latest_bitcoin_price(self):
        url = current_API
        params = {
            'ids': 'bitcoin',
            'vs_currencies': 'usd'
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return None
    
    def get_5_minutes_bitcoin_prices(self):
        url = last_24_minutes_API
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return None

    def get_daily_bitcoin_prices(self):
        url = last_60_days_API
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return None