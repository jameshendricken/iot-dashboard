import React, { useEffect, useMemo, useState } from "react";
import SearchBar from "../assets/js/SearchBar"; // Adjust path if needed

const API_URL = process.env.REACT_APP_API_BASE;
if (!API_URL) {
  console.error("REACT_APP_API_BASE is not defined. Please set it in your .env file.");
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [devRes, orgRes] = await Promise.all([
          fetch(`${API_URL}/admindevices`, { credentials: "include" }),
          fetch(`${API_URL}/organisations`, { credentials: "include" }),
        ]);
        const [devData, orgData] = await Promise.all([devRes.json(), orgRes.json()]);
        setDevices(Array.isArray(devData) ? devData : []);
        setOrganisations(Array.isArray(orgData) ? orgData : []);
      } catch (err) {
        console.error("Error loading admin devices/orgs:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      const name = (d.name || "").toLowerCase();
      const id = String(d.device_id || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [devices, query]);

  const handleSelectDevice = (device) => {
    const enriched = {
      ...device,
      organisation_id: device.organisation_id ? String(device.organisation_id) : "",
    };
    setSelectedDevice(enriched);
    setFormData(enriched);
    setErrors({});
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "device_id" && (value === undefined || String(value).trim() === "")) {
        newErrors[key] = "This field is required.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      const res = await fetch(`${API_URL}/devices/${formData.device_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.detail || "Failed to update device");
      setDevices((prev) => prev.map((d) => (d.device_id === updated.device_id ? updated : d)));
      setSelectedDevice(updated);
      setFormData(updated);
      setEditMode(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleCancel = () => {
    setFormData(selectedDevice);
    setErrors({});
    setEditMode(false);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Devices</h1>
        {loading && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading…
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* List */}
        <div className="card h-fit md:sticky md:top-4">
          <div className="mb-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search devices by name or ID…" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {filteredDevices.length} result{filteredDevices.length === 1 ? "" : "s"}
            </p>
          </div>

          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredDevices.map((device) => {
              const active = selectedDevice?.device_id === device.device_id;
              return (
                <li key={device.device_id}>
                  <button
                    type="button"
                    onClick={() => handleSelectDevice(device)}
                    className={`w-full text-left px-3 py-2 transition rounded-md
                      ${active
                        ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100"}`}
                  >
                    <div className="font-medium">{device.name || "(Unnamed device)"}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{device.device_id}</div>
                  </button>
                </li>
              );
            })}
            {filteredDevices.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No matching devices.</li>
            )}
          </ul>
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          {selectedDevice ? (
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Device details
                </h2>
                {!editMode && (
                  <button type="button" onClick={() => setEditMode(true)} className="btn-primary">
                    Edit
                  </button>
                )}
              </div>

              <form className="grid gap-4">
                {Object.entries(formData).map(([key, value]) => {
                  const label = key.replaceAll("_", " ");
                  const isId = key === "device_id";
                  const isOrg = key === "organisation_id";
                  return (
                    <div key={key}>
                      <label className="form-label capitalize" htmlFor={key}>
                        {label}
                      </label>

                      {isOrg ? (
                        editMode ? (
                          <select
                            id={key}
                            name="organisation_id"
                            value={formData.organisation_id || ""}
                            onChange={handleChange}
                            className={`input ${errors[key] ? "input-error" : ""}`}
                          >
                            <option value="" className="bg-white dark:bg-gray-900">
                              Select organisation
                            </option>
                            {organisations.map((org) => (
                              <option key={org.id} value={String(org.id)} className="bg-white dark:bg-gray-900">
                                {org.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={key}
                            type="text"
                            name="organisation_id"
                            value={
                              organisations.find((o) => String(o.id) === String(formData.organisation_id))?.name ||
                              "Not assigned"
                            }
                            disabled
                            className="input bg-gray-100 dark:bg-gray-800"
                          />
                        )
                      ) : (
                        <input
                          id={key}
                          type="text"
                          name={key}
                          value={value ?? ""}
                          onChange={handleChange}
                          disabled={isId || !editMode}
                          className={`input ${isId || !editMode ? "bg-gray-100 dark:bg-gray-800" : ""} ${
                            errors[key] ? "input-error" : ""
                          }`}
                        />
                      )}

                      {errors[key] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[key]}</p>
                      )}
                    </div>
                  );
                })}
              </form>

              <div className="mt-5 flex items-center gap-2">
                {editMode && (
                  <>
                    <button type="button" onClick={handleSave} className="btn-primary">
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-300">Select a device from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
