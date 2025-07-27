from fastapi import FastAPI, HTTPException, Request, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime
import psycopg2
import os
from passlib.context import CryptContext
from typing import Optional


app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",              # ✅ For local dev
        "https://iot-dashboard-wine-alpha.vercel.app"  # ✅ For Vercel prod
    ],
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
        timestamp_str = data.timestamp.isoformat()
        print(f"Ingesting data: {data}")
        print(f"timestamp_str: {timestamp_str}")
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM devices WHERE device_id = %s", (data.device_id,))
        exists = cursor.fetchone()

        if not exists:
         cursor.execute("INSERT INTO devices (device_id) VALUES (%s)", (data.device_id,))


        cursor.execute(
            "INSERT INTO device_data (device_id, volume_ml, timestamp) VALUES (%s, %s, %s)",
            (data.device_id, data.volume_ml, timestamp_str)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "ok"}
    except Exception as e:
        print("🔥 ERROR:", repr(e))  # use repr to get full error details
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
# @app.get("/devices")
# def get_devices():
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()
#         cursor.execute("SELECT device_id, name, organisation_id FROM devices")
#         rows = cursor.fetchall()
#         cursor.close()
#         conn.close()

#         if not rows:
#             raise HTTPException(status_code=404, detail="No devices found")

#         return [{"device_id": row[0], "name": row[1], "organisation_id": row[2]} for row in rows]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices")
def get_devices(request: Request):
    try:
        # Ensure user info is available from auth middleware/session
        user = request.state.user
        print("Device route user:", user)  # ✅ Confirm user is being picked up

        if not user or "organisation_id" not in user:
            raise HTTPException(status_code=401, detail="Unauthenticated or organisation not set")

        org_id = user["organisation_id"]

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT device_id, name, organisation_id FROM devices WHERE organisation_id = %s",
            (org_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            raise HTTPException(status_code=404, detail="No devices found for this organisation")

        return [{"device_id": row[0], "name": row[1], "organisation_id": row[2]} for row in rows]

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


@app.get("/summary/{device_id}")
def get_summary(device_id: str, start: str = None, end: str = None, user_email: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
            SELECT SUM(dd.volume_ml) as total_volume
            FROM device_data dd
            JOIN device d ON dd.device_id = d.id
            JOIN "user" u ON d.user_id = u.id
            WHERE dd.device_id = %s
        """
        params = [device_id]

        if user_email:
            query += " AND u.email = %s"
            params.append(user_email)
        if start:
            query += " AND dd.timestamp >= %s"
            params.append(start)
        if end:
            query += " AND dd.timestamp <= %s"
            params.append(end)

        cursor.execute(query, tuple(params))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        return {"total_volume_ml": result[0] or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/histogram/{device_id}")
def get_histogram(device_id: str, start: str = None, end: str = None, user_email: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
            SELECT DATE_TRUNC('day', dd.timestamp) as day, SUM(dd.volume_ml)
            FROM device_data dd
            JOIN device d ON dd.device_id = d.id
            JOIN "user" u ON d.user_id = u.id
            WHERE dd.device_id = %s
        """
        params = [device_id]

        if user_email:
            query += " AND u.email = %s"
            params.append(user_email)
        if start:
            query += " AND dd.timestamp >= %s"
            params.append(start)
        if end:
            query += " AND dd.timestamp <= %s"
            params.append(end)

        query += " GROUP BY day ORDER BY day ASC"

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return [{"day": row[0].isoformat(), "total_volume_ml": row[1]} for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserAuth(BaseModel):
    email: str
    password: str

@app.post("/register")
def register_user(user: UserAuth):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User already exists")

        hashed_password = pwd_context.hash(user.password)
        cursor.execute("INSERT INTO users (email, password_hash) VALUES (%s, %s)", (user.email, hashed_password))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "User registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import JSONResponse

@app.post("/login")
def login_user(user: UserAuth):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash, organisation_id, roles_id FROM users WHERE email = %s", (user.email,))
        row = cursor.fetchone()

        # Step 1: Verify user credentials
        if not row or not pwd_context.verify(user.password, row[1]):
            cursor.close()
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id, _, org_id, role_id = row

        # Step 2: Get organisation name
        cursor.execute("SELECT name FROM organisations WHERE id = %s", (org_id,))
        org_row = cursor.fetchone()
        if not org_row:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Organisation not found")
        org_name = org_row[0]

        # Step 3: Get user roles
        cursor.execute("SELECT name FROM roles WHERE id = %s", (role_id,))
        role_row = cursor.fetchone()
        if not role_row:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="User Role not found")
        role_name = role_row[0]

        cursor.close()
        conn.close()

        # Step 4: Return response with auth cookie
        response = JSONResponse(content={
            "email": user.email,
            "org": org_name,
            "role": role_name
        })

        # 🔐 Set secure cookie with email
        response.set_cookie(key="email", value=user.email, httponly=True, secure=True, samesite="Lax")

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# @app.post("/login")
# def login_user(user: UserAuth):
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()
#         cursor.execute("SELECT id, password_hash, organisation_id, roles_id FROM users WHERE email = %s", (user.email,))
#         row = cursor.fetchone()

#         # Step 1: Verify user credentials
#         if not row or not pwd_context.verify(user.password, row[1]):
#             cursor.close()
#             conn.close()
#             raise HTTPException(status_code=401, detail="Invalid credentials")
        
#         user_id, _, org_id, role_id = row

#         # Step 2: Get organisation name
#         cursor.execute("SELECT name FROM organisations WHERE id = %s", (org_id,))
#         org_row = cursor.fetchone()

#         if not org_row:
#             cursor.close()
#             conn.close()
#             raise HTTPException(status_code=404, detail="Organisation not found")

#         org_name = org_row[0]

#         # Step 3: Get user roles
#         cursor.execute("SELECT name FROM roles WHERE id = %s", (role_id,))
#         role_row = cursor.fetchone()

#         cursor.close()
#         conn.close()

#         if not role_row:
#             raise HTTPException(status_code=404, detail="User Role not found")

#         role_name = role_row[0]

#         # Step 3: Return required info
#         return {
#             "email": user.email,
#             "org": org_name,  # this is what frontend will store
#             "role": role_name,  # this is what frontend will store
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
    
@app.middleware("http")
async def load_user(request: Request, call_next):
    try:
        user_email = request.cookies.get("email")  # You can use a token or session ID instead
        if user_email:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, organisation_id FROM users WHERE email = %s", (user_email,))
            row = cursor.fetchone()
            cursor.close()
            conn.close()

            if row:
                request.state.user = {
                    "id": row[0],
                    "email": row[1],
                    "organisation_id": row[2]
                }
            else:
                request.state.user = None
        else:
            request.state.user = None

    except Exception as e:
        print("Middleware error:", str(e))
        request.state.user = None

    response = await call_next(request)
    return response
    
@app.get("/organisations")
def get_organisations():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM organisations")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        organisations = [{"id": row[0], "name": row[1]} for row in rows]
        return organisations

    except Exception as e: 
        raise HTTPException(status_code=500, detail=str(e))
    
@app.put("/devices/{device_id}")
def update_device(device_id: str, payload: dict = Body(...)):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Only update known valid fields
        allowed_keys = {"name", "organisation_id"}  # use organisation_id instead of organisation

        for key, value in payload.items():
            if key in allowed_keys:
                query = f"UPDATE devices SET {key} = %s WHERE device_id = %s"
                cursor.execute(query, (value, device_id))

        conn.commit()

#       This is where the eror was happening when trying to update a device and reselcting the device returns all values associated with the device_id
        cursor.execute("SELECT device_id, name, organisation_id FROM devices WHERE device_id = %s", (device_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Device not found")

        columns = [desc[0] for desc in cursor.description]
        cursor.close()
        conn.close()

        return dict(zip(columns, row))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users")
def get_users():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, organisation_id, roles_id FROM users")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            raise HTTPException(status_code=404, detail="No users found")

        return [{"id": row[0], "email": row[1], "organisation_id": row[2], "roles_id": row[3]} for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/users/{user_id}")
def get_user(user_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, organisation_id, roles_id FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        return {"id": row[0], "email": row[1], "organisation_id": row[2], "roles_id": row[3]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.put("/users/{user_id}")
def update_user(user_id: int, payload: dict = Body(...)):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Only update known valid fields
        allowed_keys = {"email", "organisation_id", "roles_id"}

        for key, value in payload.items():
            if key in allowed_keys:
                query = f"UPDATE users SET {key} = %s WHERE id = %s"
                cursor.execute(query, (value, user_id))

        conn.commit()

        cursor.execute("SELECT id, email, organisation_id, roles_id FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        columns = [desc[0] for desc in cursor.description]
        cursor.close()
        conn.close()

        return dict(zip(columns, row))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))