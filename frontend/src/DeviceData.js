import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DateRangePicker from "./DateRangePicker";

export default function DeviceData() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const bottlesSaved = totalVolume * 2;
  const plasticSaved = bottlesSaved * 0.02;
  const socialCost = plasticSaved * 0.022;

  useEffect(() => {
    const fetchData = async () => {
      const deviceId = searchParams.get("device_id") || "fountain-01";
      const userEmail = localStorage.getItem("userEmail") || "";
      try {
        const res = await fetch(
          `https://iot-backend-p66k.onrender.com/data/${deviceId}?user_email=${userEmail}`
        );
        const json = await res.json();
        setData(json);
        setFilteredData(json);
        setTotalVolume(
          json.reduce((sum, item) => sum + (item.volume || 0), 0)
        );
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const filtered = data.filter((item) => {
        const time = new Date(item.timestamp);
        return time >= start && time <= end;
      });
      setFilteredData(filtered);
      setTotalVolume(filtered.reduce((sum, item) => sum + (item.volume || 0), 0));
    } else {
      setFilteredData(data);
      setTotalVolume(data.reduce((sum, item) => sum + (item.volume || 0), 0));
    }
  }, [startDate, endDate, data]);

  const downloadCSV = () => {
    const headers = Object.keys(filteredData[0] || {}).join(",");
    const rows = filteredData.map(obj => Object.values(obj).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "device_data.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Device Data</h1>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Total Volume Dispensed</p>
          <p className="text-2xl font-bold text-green-600">{totalVolume.toFixed(2)} mL</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Bottles Saved</p>
          <p className="text-2xl font-bold text-blue-600">{bottlesSaved.toFixed(0)}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-gray-500 text-sm">Plastic Saved (kg)</p>
          <p className="text-2xl font-bold text-purple-600">{plasticSaved.toFixed(2)}</p>
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

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              {Object.keys(filteredData[0] || {}).map((key) => (
                <th key={key} className="text-left px-4 py-2 text-sm font-medium text-gray-700">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i} className="border-t">
                {Object.values(row).map((val, j) => (
                  <td key={j} className="px-4 py-2 text-sm text-gray-600">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
