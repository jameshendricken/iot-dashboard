// This file is part of the IoT Dashboard project.
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

const API_URL = process.env.REACT_APP_API_BASE || "";

// function getDateRange(range) {
//   const now = new Date();
//   switch (range) {
//     case "today":
//       return { start: startOfToday(), end: now };
//     case "thisWeek": {
//       const start = startOfWeek(now, { weekStartsOn: 1 });
//       const end = endOfWeek(now, { weekStartsOn: 1 });
//       return { start, end };
//     }
//     case "thisMonth":
//       return { start: startOfMonth(now), end: endOfMonth(now) };
//     case "lastMonth": {
//       const prev = subMonths(now, 1);
//       return { start: startOfMonth(prev), end: endOfMonth(prev) };
//     }
//     case "all":
//       return { start: new Date(0), end: now };
//     default:
//       return { start: new Date("2020-01-01"), end: new Date("2099-12-31") };
//   }
// }

// function getDateRange(range)  {
//     const today = startOfToday();
//     switch (range) {
//     case "today":
//         return { start: today, end: new Date() };
//     case "thisWeek":
//         return { start: startOfWeek(today, { weekStartsOn: 1 }), end: new Date() };
//     case "thisMonth":
//         return { start: startOfMonth(today), end: new Date() };
//     case "lastMonth": {
//         const lastMonthStart = startOfMonth(subMonths(today, 1));
//         return { start: lastMonthStart, end: endOfMonth(lastMonthStart) };
//     }
//     case "custom":
//         return { start: customStart, end: customEnd };
//     case "all":
//     default:
//         return { start: new Date("2020-01-01"), end: new Date("2099-12-31") };
//     }
// }

export default function DeviceData() {
  const [deviceIds, setDeviceIds] = useState([]); // kept name to minimize UI changes; now holds UNITS [{id,name,...}]
  const [selectedDevice, setSelectedDevice] = useState(""); // unit id or "ALL"
  const [dateRange, setDateRange] = useState("all");
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  const [data, setData] = useState([]);
  const [histogramData, setHistogramData] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derived metrics (liters, bottles, plastic, social cost)
    const liters = useMemo(() => totalVolume / 1000, [totalVolume]);
    const bottlesSaved = useMemo(() => (totalVolume / 1000) * 2, [totalVolume]);
    const plasticSaved = useMemo(() => bottlesSaved * 0.02, [bottlesSaved]);
    const socialCost = useMemo(() => plasticSaved * 0.022, [plasticSaved]);

  // --- Initial list fetch: /devices -> /units ---
  useEffect(() => {
    fetch(`${API_URL}/units`, { method: "GET", credentials: "include" })
      .then((res) => res.json())
      .then((devices) => {
        if (!Array.isArray(devices)) {
          throw new Error(devices.detail || "Unexpected response");
        }
        const allDevicesOption = [{ id: "ALL", name: "All Units" }, ...devices];
        setDeviceIds(allDevicesOption);
        if (devices.length > 0) setSelectedDevice("ALL");
      })
      .catch((err) => {
        console.error("Error fetching units:", err);
        setError("Failed to fetch unit list.");
      });
  }, []);

  // --- Data loader: replaced 3-request flow with /unit/data/all loop ---
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
        const unitIds =
          selectedDevice === "ALL"
            ? deviceIds.filter((u) => (u.id ?? u.device_id) !== "ALL").map((u) => (u.id ?? u.device_id))
            : [Number(selectedDevice)];

        let combinedData = [];
        let combinedHistogram = {};
        let total = 0;

        for (let unitId of unitIds) {
          const res = await fetch(
            `${API_URL}/unit/data/raw?unitId=${unitId}&from=${startParam}&to=${endParam}&limit=500000`,
            { credentials: "include" }
          );
          const payload = await res.json();
          if (Array.isArray(payload?.data)) {
            combinedData.push(...payload.data);
            for (const r of payload.data) {
              const dayKey = String(r.timestamp).split("T")[0] + "T00:00:00.000Z";
              combinedHistogram[dayKey] = (combinedHistogram[dayKey] || 0) + Number(r.volume_ml || 0);
              total += Number(r.volume_ml || 0);
            }
          }
        }

        combinedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
        setError("Failed to fetch unit data.");
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

  

  // CSV export stays unchanged
  const csvContent = useMemo(() => {
    if (!data.length) return "";
    const header = ["timestamp", "volume_ml", "device_id", "device_pk"];
    const lines = [header.join(",")];
    for (const r of data) {
      lines.push([r.timestamp, r.volume_ml, r.device_id, r.device_pk].join(","));
    }
    return lines.join("\n");
  }, [data]);

  const downloadCSV = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `unit_${selectedDevice}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- UI below is unchanged from your original ---
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

function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
