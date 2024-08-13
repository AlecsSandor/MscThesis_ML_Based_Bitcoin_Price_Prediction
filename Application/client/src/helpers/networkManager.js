// const BASE_URL = 'http://localhost:8000';
// const TICKS_URL = 'https://api.pro.coinbase.com/products/BTC-USD/ticker';

// Function to handle POST requests
export const post = async (endpoint, data) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('POST request failed', error);
        throw error; 
    }
};

export const get = async (endpoint) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                
            },
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('GET request failed', error);
        throw error;
    }
};

export const secondTicks = async () => {
    try {
        const response = await fetch(process.env.REACT_APP_TICKS_URL);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
      } catch (error) {
        throw error;
      }
}