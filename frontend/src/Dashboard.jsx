
import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard({ userId }) {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    axios.get(`https://iot-backend-p66k.onrender.com/data`).then((res) => {
      setDevices(res.data);
    });
  }, [userId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Devices</h1>
      <div className="grid gap-4">
        {devices.map((device) => (
          <div key={device.device_id} className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">{device.name}</h2>
            <p>Device ID: {device.device_id}</p>
            <p>Total Volume: {device.total_volume} ml</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
