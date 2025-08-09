// src/pages/AdminOrganisationsPage.js
import React, { useEffect, useMemo, useState } from "react";

const API_URL = process.env.REACT_APP_API_BASE;

export default function AdminOrganisationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create new org state
  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", notes: "" });

  const selectedOrgName = useMemo(() => {
    if (!detail) return "";
    return detail.name || "(No name)";
  }, [detail]);

  // Load all organisations
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/organisations`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load organisations");
        setOrgs(data);
        if (data.length && !selectedId) setSelectedId(String(data[0].id));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedId]);

  // Load single organisation details when selection changes
  useEffect(() => {
    if (!selectedId) return;
    const loadOne = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/organisations/${selectedId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load organisation");
        setDetail(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadOne();
  }, [selectedId]);

  const handleFieldChange = (key, value) => {
    setDetail((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async () => {
    if (!detail || !selectedId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/organisations/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: detail.name, notes: detail.notes ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save organisation");
      setSuccess("Saved changes");
      // refresh list name in dropdown
      setOrgs((prev) => prev.map((o) => (String(o.id) === String(selectedId) ? { ...o, name: detail.name } : o)));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(""), 1500);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/organisations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newOrg.name, notes: newOrg.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create organisation");
      setSuccess("Organisation created");
      setShowCreate(false);
      setNewOrg({ name: "", notes: "" });
      // append and select the new org
      setOrgs((prev) => [{ id: data.id, name: data.name }, ...prev]);
      setSelectedId(String(data.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(""), 1500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Organisations</h1>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showCreate ? "Close" : "New Organisation"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 text-red-700 px-4 py-2 border border-red-200">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded bg-green-50 text-green-700 px-4 py-2 border border-green-200">{success}</div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 grid gap-3 bg-white p-4 rounded shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={newOrg.name}
              onChange={(e) => setNewOrg((o) => ({ ...o, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="Organisation name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={newOrg.notes}
              onChange={(e) => setNewOrg((o) => ({ ...o, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="Optional notes (e.g. billing info, contact)"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List + editor */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Left: selector */}
        <div className="bg-white rounded shadow-sm p-4 h-fit">
          <label className="block text-sm font-medium mb-2">Select organisation</label>
          {loading && !orgs.length ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Right: details */}
        <div className="md:col-span-2 bg-white rounded shadow-sm p-4">
          {detail ? (
            <>
              <h2 className="text-lg font-semibold mb-3">Edit: {selectedOrgName}</h2>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={detail.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={detail.notes || ""}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={4}
                    placeholder="Any internal notes about this organisation"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={() => {
                    // reload selected org to discard changes
                    setSelectedId(String(selectedId));
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Select an organisation to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
