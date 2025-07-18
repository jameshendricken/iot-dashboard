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
      ...
    </div>
  );
}
