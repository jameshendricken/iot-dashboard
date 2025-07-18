import React, { useEffect, useState } from "react";

// Ensure the API URL is defined, otherwise log an error
const API_URL = process.env.REACT_APP_API_BASE;
if (!API_URL) {
  console.error("REACT_APP_API_BASE is not defined. Please set it in your .env file.");
}

export default function DeviceData() {
  const [deviceIds, setDeviceIds] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch device IDs on load
  useEffect(() => {
    fetch(`${API_URL}/devices`)
      .then((res) => res.json())
      .then((devices) => {
        setDeviceIds(devices.map((d) => d.device_id));
        if (devices.length > 0) setSelectedDevice(devices[0].device_id);
      })
      .catch((err) => {
        console.error("Error fetching devices:", err);
        setError("Failed to fetch device list.");
      });
  }, []);

  // Fetch data when a device is selected
  useEffect(() => {
    if (!selectedDevice) return;
    setLoading(true);
    setError("");
    fetch(`${API_URL}/data/${selectedDevice}`)
      .then((res) => res.json())
      .then((json) => {
        console.log("Fetched data:", json);
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.error("Expected array but got:", json);
          setData([]);
          setError("Unexpected data format received.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setError("Failed to fetch device data.");
      });
  }, [selectedDevice]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Device Data Viewer</h2>

      <label htmlFor="device-select" className="block mb-2 font-medium">
        Select a device:
      </label>
      <select
        id="device-select"
        value={selectedDevice}
        onChange={(e) => setSelectedDevice(e.target.value)}
        className="mb-6 border border-gray-300 p-2 rounded w-full"
      >
        {deviceIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {loading ? (
        <p>Loading data...</p>
      ) : data.length === 0 ? (
        <p>No data available for this device.</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Timestamp</th>
              <th className="p-2 border">Volume (mL)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, idx) => {
              console.log("entry:", entry);
              const date = new Date(entry.timestamp);
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {isNaN(date.getTime())
                      ? "Invalid date"
                      : date.toLocaleString()}
                  </td>
                  <td className="p-2 border">{entry.volume_ml}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
