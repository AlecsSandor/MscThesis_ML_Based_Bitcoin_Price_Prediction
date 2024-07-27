import asyncio
import os
import threading
import json
from fastapi import FastAPI, WebSocket, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import time

from data_handler import DataHandler

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

fetching = False  # Flag to indicate if data fetching is ongoing

data_handler_manager = DataHandler()

app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tracked_variable = None
websocket_connections: List[WebSocket] = []
fetching = False

class UpdateVariableRequest(BaseModel):
    variable: str

@app.post("/start_fetch")
async def start_fetch(request: Request):
    global fetching
    payload = await request.json()  # Read the request body as JSON
    frequency = payload.get("frequency")
    if not fetching:
        fetching = True
        loop = asyncio.get_event_loop()
        threading.Thread(target=fetch_data, args=(loop,frequency)).start()
        #await notify_clients(message="Data fetching started")
        return JSONResponse(content={"message": "Data fetching started"}, status_code=200)
    else:
        return JSONResponse(content={"message": "Data fetching is already in progress"}, status_code=400)

@app.post("/stop_fetch")
async def stop_fetch():
    global fetching
    if fetching:
        fetching = False
        data_handler_manager.data_array = []
        data_handler_manager.prediction_data = []
        # await notify_clients(message="Data fetching stopped")
        return JSONResponse(content={"message": "Data fetching stopped"}, status_code=200)
    else:
        return JSONResponse(content={"message": "Data fetching is not in progress"}, status_code=400)

@app.post("/is_running")
async def is_running():
    return JSONResponse(content={"message": fetching}, status_code=200)

@app.get("/signals")
async def get_signals():
    if len(data_handler_manager.prediction_data):
        return JSONResponse(content={"signal_data": data_handler_manager.prediction_data}, status_code=200)
    else:
        return JSONResponse(content={"signal_data": "No Signals."}, status_code=200)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages from the client if needed
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        websocket_connections.remove(websocket)

async def notify_clients(message: str = None, signal_data: str = None):
    global tracked_variable
    message_data = {}
    if message:
        message_data["message"] = message
    elif signal_data:
        message_data["signal_data"] = signal_data
    to_remove = []
    for connection in websocket_connections:
        try:
            await connection.send_json(message_data)
        except Exception as e:
            print(f"Error sending message to WebSocket client: {e}")
            to_remove.append(connection)
    for connection in to_remove:
        websocket_connections.remove(connection)

def fetch_data(loop, frequency):
    asyncio.set_event_loop(loop)
    while fetching:
        # Simulate fetching data
        print("Fetching data...")
        data_handler_manager.populate_array(frequency)
        print(len(data_handler_manager.data_array))
        # Notify WebSocket clients about the fetched data
        if len(data_handler_manager.data_array) == 1 and data_handler_manager.prediction_data:
            asyncio.run_coroutine_threadsafe(notify_clients(signal_data=data_handler_manager.prediction_data), loop)
        if frequency == 'minute':
            time.sleep(1)
        elif frequency == 'hour':
            time.sleep(3600)
        elif frequency == 'day':
            time.sleep(86400)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv('HOST'), port=int(os.getenv('PORT')))
