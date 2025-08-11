// src/pages/DeviceData.js
import React, { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  startOfToday,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

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

  // Derived metrics (liters, bottles, plastic, social cost)
  const liters = useMemo(() => totalVolume / 1000, [totalVolume]);
  const bottlesSaved = useMemo(() => (totalVolume / 1000) * 2, [totalVolume]);
  const plasticSaved = useMemo(() => bottlesSaved * 0.02, [bottlesSaved]);
  const socialCost = useMemo(() => plasticSaved * 0.022, [plasticSaved]);

  useEffect(() => {
    fetch(`${API_URL}/devices`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((devices) => {
        if (!Array.isArray(devices)) {
          throw new Error(devices.detail || "Unexpected response");
        }
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

    const startParam = (dateRange === "custom" ? customStart : start).toISOString();
    const endParam = (dateRange === "custom" ? customEnd : end).toISOString();

    const fetchData = async () => {
      try {
        const deviceList =
          selectedDevice === "ALL"
            ? deviceIds.filter((d) => d.device_id !== "ALL").map((d) => d.device_id)
            : [selectedDevice];

        const allData = await Promise.all(
          deviceList.map((deviceId) =>
            Promise.all([
              fetch(`${API_URL}/data/${deviceId}?start=${startParam}&end=${endParam}`),
              fetch(`${API_URL}/data/${deviceId}/summary?start=${startParam}&end=${endParam}`),
              fetch(
                `${API_URL}/data/${deviceId}/histogram?start=${startParam}&end=${endParam}&interval=day`
              ),
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
      case "today":
        return { start: today, end: new Date() };
      case "thisWeek":
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: new Date() };
      case "thisMonth":
        return { start: startOfMonth(today), end: new Date() };
      case "lastMonth": {
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        return { start: lastMonthStart, end: endOfMonth(lastMonthStart) };
      }
      case "custom":
        return { start: customStart, end: customEnd };
      case "all":
      default:
        return { start: new Date("2020-01-01"), end: new Date("2099-12-31") };
    }
  };

  const downloadCSV = () => {
    const headers = ["Timestamp", "Volume (mL)"];
    const rows = data.map((entry) => [entry.timestamp, entry.volume_ml]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
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
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Device Data Dashboard
        </h1>
        <button
          onClick={downloadCSV}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          <span className="text-lg">⬇</span>
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="device-select" className="block text-sm font-medium text-gray-600 dark:text-gray-300">
            Select a device
          </label>
          <select
            id="device-select"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-4 focus:outline-indigo-600 dark:border-gray-700 dark:text-gray-100"
          >
            {deviceIds.map((d) => (
              <option key={d.device_id} value={d.device_id} className="bg-white dark:bg-gray-900">
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
            Select time range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-4 focus:outline-indigo-600 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="today" className="bg-white dark:bg-gray-900">Today</option>
            <option value="thisWeek" className="bg-white dark:bg-gray-900">This Week</option>
            <option value="thisMonth" className="bg-white dark:bg-gray-900">This Month</option>
            <option value="lastMonth" className="bg-white dark:bg-gray-900">Last Month</option>
            <option value="all" className="bg-white dark:bg-gray-900">All Data</option>
            <option value="custom" className="bg-white dark:bg-gray-900">Custom Range</option>
          </select>
        </div>

        {/* Custom range */}
        {dateRange === "custom" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
              Custom range
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <DatePicker
                selected={customStart}
                onChange={(date) => setCustomStart(date)}
                selectsStart
                startDate={customStart}
                endDate={customEnd}
                placeholderText="Start"
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-4 focus:outline-indigo-600 dark:border-gray-700 dark:text-gray-100"
              />
              <DatePicker
                selected={customEnd}
                onChange={(date) => setCustomEnd(date)}
                selectsEnd
                startDate={customStart}
                endDate={customEnd}
                minDate={customStart}
                placeholderText="End"
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-4 focus:outline-indigo-600 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Volume Dispensed" value={`${liters.toFixed(2)} L`} />
        <KpiCard label="Bottles Saved" value={Intl.NumberFormat().format(bottlesSaved.toFixed(0))} />
        <KpiCard label="Plastic Saved (kg)" value={plasticSaved.toFixed(2)} />
        <KpiCard label="Social Cost of Carbon (€)" value={`€${socialCost.toFixed(2)}`} />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Dispense Volume (by day)</h2>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading data…</span>
          </div>
        ) : histogramData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No usage data to display for this period.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(tick) => tick.split("T")[0]} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_volume" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small presentational KPI card */
function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
