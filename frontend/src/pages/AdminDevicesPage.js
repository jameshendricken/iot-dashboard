import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_BASE;

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [formState, setFormState] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/devices`)
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch((err) => console.error("Failed to fetch devices", err));
  }, []);

  const handleEditClick = (device) => {
    setEditingDeviceId(device.device_id);
    setFormState({ ...device });
  };

  const handleCancel = () => {
    setEditingDeviceId(null);
    setFormState({});
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/devices/${editingDeviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      if (!res.ok) throw new Error("Update failed");
      const updatedDevice = await res.json();
      setDevices(devices.map((d) => (d.device_id === updatedDevice.device_id ? updatedDevice : d)));
      setEditingDeviceId(null);
      setFormState({});
    } catch (err) {
      console.error("Error updating device", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Device Management</h2>
      <div className="space-y-4">
        {devices.map((device) => (
          <div key={device.device_id} className="p-4 border rounded bg-white shadow">
            {editingDeviceId === device.device_id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  name="device_name"
                  value={formState.device_name || ""}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded w-full"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Save
                  </button>
                  <button onClick={handleCancel} className="px-4 py-2 bg-gray-300 rounded">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">{device.device_name}</p>
                  <p className="text-sm text-gray-600">ID: {device.device_id}</p>
                </div>
                <button
                  onClick={() => handleEditClick(device)}
                  className="px-4 py-2 bg-yellow-400 rounded text-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
