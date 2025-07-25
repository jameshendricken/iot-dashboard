import React, { useEffect, useState } from "react";

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetch("https://iot-backend-p66k.onrender.com/admin/devices")
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch((err) => console.error("Error fetching devices:", err));
  }, []);

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    setFormData(device);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    fetch(`https://iot-backend-p66k.onrender.com/devices/${formData.device_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((updatedDevice) => {
        setDevices((prev) =>
          prev.map((dev) =>
            dev.device_id === updatedDevice.device_id ? updatedDevice : dev
          )
        );
        alert("Device updated successfully.");
      })
      .catch((err) => console.error("Update failed:", err));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Admin Devices Page</h2>
      <div className="flex gap-6">
        <div className="w-1/3">
          <h3 className="font-semibold mb-2">Devices</h3>
          <ul className="bg-white rounded shadow p-2 divide-y">
            {devices.map((device) => (
              <li
                key={device.device_id}
                className="py-2 px-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectDevice(device)}
              >
                {device.device_name || device.device_id}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3">
          {selectedDevice && (
            <div className="bg-white rounded shadow p-4">
              <h3 className="font-semibold text-lg mb-4">Edit Device</h3>
              <form className="space-y-4">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block font-medium capitalize mb-1">
                      {key.replace("_", " ")}
                    </label>
                    <input
                      type="text"
                      name={key}
                      value={value}
                      onChange={handleChange}
                      disabled={key === "device_id"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200"
                    />
                  </div>
                ))}
              </form>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
