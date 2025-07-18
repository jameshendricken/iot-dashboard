
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import psycopg2
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


app = FastAPI()

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv("POSTGRES_DB", "iot"),
    user=os.getenv("POSTGRES_USER", "postgres"),
    password=os.getenv("POSTGRES_PASSWORD", "secret"),
    host=os.getenv("POSTGRES_HOST", "db"),
    port="5432"
)
cursor = conn.cursor()

class VolumeData(BaseModel):
    device_id: str
    volume_ml: int
    timestamp: datetime

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://iot-dashboard-wine-alpha.vercel.app",
        "https://iot-dashboard-4soqvlp52-james-hendrickens-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.get("/data")
# def get_data(data: VolumeData):
#     try:
#         cursor.execute(
#             "SELECT * FROM device_data WHERE device_id, volume_ml, timestamp) VALUES (%s, %s, %s)",
#             (data.device_id, data.volume_ml, data.timestamp)
#         )
#         conn.commit()
#         return {"status": "ok"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



@app.get("/devices")
def get_devices():
    cursor.execute("SELECT device_id, name FROM devices")
    rows = cursor.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="No devices found")
    return [{"device_id": row[0], "name": row[1]} for row in rows]



# The following endpoint gets the values for the inputted device_id
# @app.get("/data/{device_id}")
# def get_device_data(device_id: str):
#         cursor.execute("SELECT volume_ml FROM device_data WHERE device_id = %s ORDER BY timestamp DESC", (device_id,))
#         rows = cursor.fetchall()
#         if not rows:
#             raise HTTPException(status_code=404, detail="No data found")
#         return rows

@app.get("/data/{device_id}")
def get_device_data(device_id: str):
    cursor.execute("""
        SELECT timestamp, volume_ml
        FROM device_data
        WHERE device_id = %s
        ORDER BY timestamp DESC
    """, (device_id,))
    rows = cursor.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="No data found")

    # Format rows as list of dicts
    result = [{"timestamp": row[0], "volume_ml": row[1]} for row in rows]
    return JSONResponse(content=result)


@app.post("/ingest")
def ingest_data(data: VolumeData):
    try:
        cursor.execute(
            "INSERT INTO device_data (device_id, volume_ml, timestamp) VALUES (%s, %s, %s)",
            (data.device_id, data.volume_ml, data.timestamp)
        )
        conn.commit()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DeviceSummary(BaseModel):
    device_id: str
    name: str
    total_volume: int

@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: int):
    cursor.execute("""
        SELECT d.device_id, d.name, COALESCE(SUM(dd.volume_ml), 0) AS total_volume
        FROM devices d
        LEFT JOIN device_data dd ON d.device_id = dd.device_id
        WHERE d.owner_id = %s
        GROUP BY d.device_id, d.name
    """, (user_id,))
