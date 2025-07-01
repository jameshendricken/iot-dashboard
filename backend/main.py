
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import psycopg2

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
    rows = cursor.fetchall()
    return [DeviceSummary(device_id=row[0], name=row[1], total_volume=row[2]) for row in rows]
