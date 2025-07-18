from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
import psycopg2
import os

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your Vercel frontend URL for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to database on demand
def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "iot"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "secret"),
        host=os.getenv("POSTGRES_HOST", "db"),
        port="5432",
        sslmode="require"
    )

# Device data model for ingestion
class VolumeData(BaseModel):
    device_id: str
    volume_ml: int
    timestamp: datetime

# Ingest endpoint
@app.post("/ingest")
def ingest_data(data: VolumeData):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO device_data (device_id, volume_ml, timestamp) VALUES (%s, %s, %s)",
            (data.device_id, data.volume_ml, data.timestamp)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get data for a specific device
@app.get("/data/{device_id}")
def get_device_data(device_id: str, start: str = None, end: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT timestamp, volume_ml FROM device_data WHERE device_id = %s"
        params = [device_id]
        if start:
            query += " AND timestamp >= %s"
            params.append(start)
        if end:
            query += " AND timestamp <= %s"
            params.append(end)
        query += " ORDER BY timestamp DESC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            raise HTTPException(status_code=404, detail="No data found")

        return JSONResponse(content=[
            {
        "timestamp": row[0].isoformat() if isinstance(row[0], datetime) else row[0],
        "volume_ml": row[1]
    } for row in rows
        ])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get list of devices
@app.get("/devices")
def get_devices():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT device_id, name FROM devices")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            raise HTTPException(status_code=404, detail="No devices found")

        return [{"device_id": row[0], "name": row[1]} for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard summary model
class DeviceSummary(BaseModel):
    device_id: str
    name: str
    total_volume: int

# Dashboard endpoint per user
@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT d.device_id, d.name, COALESCE(SUM(dd.volume_ml), 0) AS total_volume
            FROM devices d
            LEFT JOIN device_data dd ON d.device_id = dd.device_id
            WHERE d.owner_id = %s
            GROUP BY d.device_id, d.name
        """, (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return [
            {"device_id": row[0], "name": row[1], "total_volume": row[2]}
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import Query
from typing import Optional

@app.get("/data/{device_id}/summary")
def get_volume_summary(device_id: str, start: Optional[str] = Query(None), end: Optional[str] = Query(None)):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        sql = "SELECT SUM(volume_ml) FROM device_data WHERE device_id = %s"
        params = [device_id]

        if start:
            sql += " AND timestamp >= %s"
            params.append(start)
        if end:
            sql += " AND timestamp <= %s"
            params.append(end)

        cursor.execute(sql, tuple(params))
        total_volume = cursor.fetchone()[0] or 0

        cursor.close()
        conn.close()

        return {"total_volume": total_volume}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/data/{device_id}/histogram")
def get_volume_histogram(device_id: str, start: str, end: str, interval: str = "day"):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        if interval == "hour":
            date_trunc = "hour"
        else:
            date_trunc = "day"

        cursor.execute(f"""
            SELECT date_trunc(%s, timestamp) AS period, SUM(volume_ml)
            FROM device_data
            WHERE device_id = %s AND timestamp BETWEEN %s AND %s
            GROUP BY period
            ORDER BY period
        """, (date_trunc, device_id, start, end))

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return [
            {"timestamp": row[0].isoformat(), "total_volume": row[1]}
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
