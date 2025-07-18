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

  useEffect(() => {
    if (!selectedDevice) return;
    const { start, end } = getDateRange(dateRange);
    if (dateRange === "custom" && (!customStart || !customEnd)) return;

    setLoading(true);
    setError("");

    const fetchData = async () => {
      try {
        const startParam = dateRange === "custom" ? customStart.toISOString() : start.toISOString();
        const endParam = dateRange === "custom" ? customEnd.toISOString() : end.toISOString();

        const [dataRes, summaryRes, histogramRes] = await Promise.all([
          fetch(`${API_URL}/data/${selectedDevice}?start=${startParam}&end=${endParam}`),
          fetch(`${API_URL}/data/${selectedDevice}/summary?start=${startParam}&end=${endParam}`),
          fetch(`${API_URL}/data/${selectedDevice}/histogram?start=${startParam}&end=${endParam}&interval=day`)
        ]);

        const dataJson = await dataRes.json();
        const summaryJson = await summaryRes.json();
        const histogramJson = await histogramRes.json();

        if (Array.isArray(dataJson)) {
          setData(dataJson);
        } else {
          console.error("Expected array but got:", dataJson);
          setData([]);
          setError("Unexpected data format received.");
        }

        setTotalVolume(summaryJson.total_volume || 0);
        setHistogramData(histogramJson || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError("Failed to fetch device data.");
      }
    };

    fetchData();
  }, [selectedDevice, dateRange, customStart, customEnd]);

  const getDateRange = (range) => {
    const today = startOfToday();
    switch (range) {
      case "today":
        return { start: today, end: new Date() };
      case "thisWeek":
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: new Date() };
      case "thisMonth":
        return { start: startOfMonth(today), end: new Date() };
      case "lastMonth":
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        return { start: lastMonthStart, end: endOfMonth(lastMonthStart) };
      case "custom":
        return { start: customStart, end: customEnd };
      case "all":
      default:
        return { start: new Date("2020-01-01"), end: new Date("2099-12-31") };
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
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Device Data Viewer</h2>

      <label htmlFor="device-select" className="block mb-2 font-medium">
        Select a device:
      </label>
      <select
        id="device-select"
        value={selectedDevice}
        onChange={(e) => setSelectedDevice(e.target.value)}
        className="mb-4 border border-gray-300 p-2 rounded w-full"
      >
        {deviceIds.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      <div className="mb-4">
        <label className="block font-medium mb-1">Select time range:</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full mb-2"
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="all">All Data</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateRange === "custom" && (
          <div className="flex gap-4">
            <DatePicker
              selected={customStart}
              onChange={(date) => setCustomStart(date)}
              selectsStart
              startDate={customStart}
              endDate={customEnd}
              placeholderText="Start Date"
              className="border p-2 rounded"
            />
            <DatePicker
              selected={customEnd}
              onChange={(date) => setCustomEnd(date)}
              selectsEnd
              startDate={customStart}
              endDate={customEnd}
              minDate={customStart}
              placeholderText="End Date"
              className="border p-2 rounded"
            />
          </div>
        )}
      </div>

      <button
        onClick={downloadCSV}
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Download CSV
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-blue-100 p-4 rounded mb-4">
        Total Dispensed Volume: <strong>{totalVolume} mL</strong>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : data.length === 0 ? (
        <p>No data available for this device.</p>
      ) : (
        <>
          <table className="w-full border mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Timestamp</th>
                <th className="p-2 border">Volume (mL)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, idx) => {
                const date = new Date(entry.timestamp);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString()}
                    </td>
                    <td className="p-2 border">{entry.volume_ml}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(tick) => tick.split("T")[0]} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_volume" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
