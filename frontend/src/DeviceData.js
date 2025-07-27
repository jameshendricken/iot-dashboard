import React, { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfToday, startOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

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
  const [totalVolume, setTotalVolume] = useState(0);
  const [histogramData, setHistogramData] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [customStart, setCustomStart] = useState(new Date("2020-01-01"));
  const [customEnd, setCustomEnd] = useState(new Date("2099-12-31"));

  const bottlesSaved = (totalVolume/1000) * 2;
  const plasticSaved = bottlesSaved * 0.02;
  const socialCost = plasticSaved * 0.022;

  useEffect(() => {
  fetch(`${API_URL}/devices`, {
    method: "GET",
    credentials: "include"  // ✅ This ensures cookies are sent
  })
    .then((res) => res.json())
    .then((devices) => {
      if (!Array.isArray(devices)) {
        throw new Error(devices.detail || "Unexpected response");
      }
      console.log("Fetched devices:", devices);
      const allDevicesOption = [{ device_id: "ALL", name: "All Devices" }, ...devices];
      setDeviceIds(allDevicesOption);
      if (devices.length > 0) setSelectedDevice("ALL");
    })
    .catch((err) => {
      console.error("Error fetching devices:", err);
      setError("Failed to fetch device list.");
    });
}, []);


  useEffect(() => {
    if (!selectedDevice) return;
    const { start, end } = getDateRange(dateRange);
    if (dateRange === "custom" && (!customStart || !customEnd)) return;

    setLoading(true);
    setError("");

    const startParam = dateRange === "custom" ? customStart.toISOString() : start.toISOString();
    const endParam = dateRange === "custom" ? customEnd.toISOString() : end.toISOString();

    const fetchData = async () => {
      try {
        let deviceList = selectedDevice === "ALL" ? deviceIds.filter(d => d.device_id !== "ALL").map(d => d.device_id) : [selectedDevice];

        const allData = await Promise.all(
          deviceList.map((deviceId) =>
            Promise.all([
              fetch(`${API_URL}/data/${deviceId}?start=${startParam}&end=${endParam}`),
              fetch(`${API_URL}/data/${deviceId}/summary?start=${startParam}&end=${endParam}`),
              fetch(`${API_URL}/data/${deviceId}/histogram?start=${startParam}&end=${endParam}&interval=day`)
            ])
          )
        );

        let combinedData = [];
        let combinedHistogram = {};
        let total = 0;

        for (let responses of allData) {
          const [dRes, sRes, hRes] = responses;

          const d = await dRes.json();
          const s = await sRes.json();
          const h = await hRes.json();

          if (Array.isArray(d)) combinedData.push(...d);
          if (s.total_volume) total += s.total_volume;
          if (Array.isArray(h)) {
            h.forEach(({ timestamp, total_volume }) => {
              if (!combinedHistogram[timestamp]) combinedHistogram[timestamp] = 0;
              combinedHistogram[timestamp] += Number(total_volume);
            });
          }
        }

        setData(combinedData);
        setTotalVolume(total);
        setHistogramData(
          Object.entries(combinedHistogram).map(([timestamp, total_volume]) => ({
            timestamp,
            total_volume,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError("Failed to fetch device data.");
      }
    };

    fetchData();
  }, [selectedDevice, dateRange, customStart, customEnd, deviceIds]);

  const getDateRange = (range) => {
    const today = startOfToday();
    switch (range) {
      case "today": return { start: today, end: new Date() };
      case "thisWeek": return { start: startOfWeek(today, { weekStartsOn: 1 }), end: new Date() };
      case "thisMonth": return { start: startOfMonth(today), end: new Date() };
      case "lastMonth":
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        return { start: lastMonthStart, end: endOfMonth(lastMonthStart) };
      case "custom": return { start: customStart, end: customEnd };
      case "all":
      default: return { start: new Date("2020-01-01"), end: new Date("2099-12-31") };
    }
  };

  const downloadCSV = () => {
    const headers = ["Timestamp", "Volume (mL)"];
    const rows = data.map(entry => [entry.timestamp, entry.volume_ml]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedDevice}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    
    <div className="p-4 max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-lg">

      {/* <div className="flex gap-4 items-center">
        <label htmlFor="device-select" className="font-medium">Select Device:</label>
        <select
          id="device-select"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="px-3 py-2 border rounded-md shadow-sm"
        >
          {deviceIds.map((device) => (
            <option key={device.device_id} value={device.device_id}>
              {device.name || device.device_id}
            </option>
          ))}
        </select>
      </div> */}

      {/* You can continue rendering totalVolume, bottlesSaved, charts, etc. here */}

      <h2 className="text-3xl font-bold text-center mb-6 text-gray-700">Device Data Dashboard</h2>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="device-select" className="block mb-2 text-sm font-semibold text-gray-600">
            Select a device:
          </label>
          <select
            id="device-select"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            {deviceIds.map((d) => (
            <option key={d.device_id} value={d.device_id}>
              {d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-600">Select time range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="all">All Data</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {dateRange === "custom" && (
        <div className="flex gap-4 mb-6">
          <DatePicker
            selected={customStart}
            onChange={(date) => setCustomStart(date)}
            selectsStart
            startDate={customStart}
            endDate={customEnd}
            placeholderText="Start Date"
            className="border p-2 rounded w-full"
          />
          <DatePicker
            selected={customEnd}
            onChange={(date) => setCustomEnd(date)}
            selectsEnd
            startDate={customStart}
            endDate={customEnd}
            minDate={customStart}
            placeholderText="End Date"
            className="border p-2 rounded w-full"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Total Volume Dispensed</p>
          <p className="text-2xl font-bold text-green-600">{(totalVolume.toFixed(2)/1000)} Liters</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Bottles Saved</p>
          <p className="text-2xl font-bold text-blue-600">{bottlesSaved.toFixed(0)}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Plastic Saved (kg)</p>
          <p className="text-2xl font-bold text-purple-600">{plasticSaved.toFixed(2)} Kg</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Social Cost of Carbon (€)</p>
          <p className="text-2xl font-bold text-red-600">€{socialCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={downloadCSV}
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded shadow"
        >
          ⬇ Download CSV
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500">Loading data...</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500">No data available for this device.</p>
      ) : (
        <>
          <div className="h-80 bg-white rounded shadow p-4">
            {histogramData.length === 0 ? (
              <p className="text-gray-500 italic text-center">No usage data to display for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(tick) => tick.split("T")[0]} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_volume" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <table className="min-w-full divide-y divide-gray-200 shadow rounded overflow-hidden mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Volume (mL)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((entry, idx) => {
                const date = new Date(entry.timestamp);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString()}</td>
                    <td className="px-4 py-2">{entry.volume_ml}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          
        </>
      )}
    </div>
  );
}
