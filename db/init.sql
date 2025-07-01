
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    owner_id INTEGER REFERENCES users(id),
    location TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE device_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) REFERENCES devices(device_id),
    volume_ml INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
