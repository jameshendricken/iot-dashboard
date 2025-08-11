// src/pages/AdminOrgPage.js
import React, { useEffect, useMemo, useState } from "react";
import SearchBar from "../assets/js/SearchBar"; // Adjust path if needed

const API_URL = process.env.REACT_APP_API_BASE;

export default function AdminOrganisationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);     // canonical, read-only view data
  const [formData, setFormData] = useState(null); // draft while editing
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", notes: "" });

  const [query, setQuery] = useState("");

  // Load org list (once)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/organisations`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load organisations");
        const list = Array.isArray(data) ? data : [];
        setOrgs(list);
        // if (list.length && !selectedId) setSelectedId(String(list[0].id));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load selected organisation details
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setEditMode(false);
      setFormData(null);
      return;
    }
    const loadOne = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/organisations/${selectedId}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load organisation");
        setDetail(data);
        setEditMode(false);
        setFormData(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadOne();
  }, [selectedId]);

  // Search filter (name/notes)
  const filteredOrgs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((o) => {
      const name = (o.name || "").toLowerCase();
      const notes = (o.notes || "").toLowerCase();
      const id = String(o.id || "").toLowerCase();
      return name.includes(q) || notes.includes(q) || id.includes(q);
    });
  }, [orgs, query]);

  // Enter edit mode: create a draft from current detail
  const beginEdit = () => {
    if (!detail) return;
    setFormData({ name: detail.name || "", notes: detail.notes || "" });
    setEditMode(true);
  };

  // Cancel edit: discard draft and exit edit mode
  const cancelEdit = () => {
    setFormData(null);
    setEditMode(false);
  };

  // Save changes from draft -> API, then update state
  const handleSave = async () => {
    if (!formData || !selectedId) return;
    const name = (formData.name || "").trim();
    const notes = (formData.notes || "").trim();

    if (!name) {
      setError("Please enter an organisation name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/organisations/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save organisation");

      // Update canonical detail & list
      const updated = { ...detail, name, notes: notes || null };
      setDetail(updated);
      setOrgs((prev) => prev.map((o) => (String(o.id) === String(selectedId) ? { ...o, name } : o)));

      setSuccess("Saved changes");
      setEditMode(false);
      setFormData(null);
      setTimeout(() => setSuccess(""), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Create a new org (create-only screen)
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newOrg.name.trim();
    const notes = (newOrg.notes || "").trim();
    if (!name) {
      setError("Please enter an organisation name.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/organisations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create organisation");

      // Add to list, select it, exit create-only view
      setOrgs((prev) => [{ id: data.id, name: data.name }, ...prev]);
      setSelectedId(String(data.id));
      setNewOrg({ name: "", notes: "" });
      setShowCreate(false);
      setSuccess("Organisation created");
      setTimeout(() => setSuccess(""), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Create-only view (hides everything else)
     ========================= */
  if (showCreate) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Organisations</h1>
          <button onClick={() => setShowCreate(false)} className="btn-primary">Close</button>
        </div>

        <form onSubmit={handleCreate} className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Create new organisation</h2>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="form-label" htmlFor="org-name">Name</label>
              <input
                id="org-name"
                type="text"
                value={newOrg.name}
                onChange={(e) => setNewOrg((o) => ({ ...o, name: e.target.value }))}
                className="input"
                placeholder="Organisation name"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="org-notes">Notes</label>
              <textarea
                id="org-notes"
                value={newOrg.notes}
                onChange={(e) => setNewOrg((o) => ({ ...o, notes: e.target.value }))}
                className="input"
                rows={3}
                placeholder="Optional notes (e.g. billing info, contacts)"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className={`btn-primary ${saving ? "btn-disabled" : ""}`}>
              {saving ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* =========================
     Normal list / detail (view first; click Edit to modify)
     ========================= */
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Organisations</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">New Organisation</button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left list */}
        <div className="card h-fit md:sticky md:top-4">
          <div className="mb-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search organisations by name or notes…" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {filteredOrgs.length} result{filteredOrgs.length === 1 ? "" : "s"}
            </p>
          </div>

          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredOrgs.map((o) => {
              const active = String(selectedId) === String(o.id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(String(o.id))}
                    className={`w-full text-left px-3 py-2 transition rounded-md
                      ${active
                        ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100"}`}
                  >
                    <div className="font-medium">{o.name || "(No name)"}</div>
                  </button>
                </li>
              );
            })}
            {filteredOrgs.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No matching organisations.</li>
            )}
          </ul>
        </div>

        {/* Right details pane — view first; edit on demand */}
        <div className="md:col-span-2">
          {!selectedId ? (
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Select an organisation to view details.
              </p>
            </div>
          ) : (
            <div className="card">
              {!detail ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">Loading organisation details…</p>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {detail.name || "(No name)"}
                    </h2>
                    {!editMode && (
                      <button type="button" onClick={beginEdit} className="btn-primary">
                        Edit
                      </button>
                    )}
                  </div>

                  {/* FORM: read-only when !editMode, editable when editMode */}
                  <div className="grid gap-4">
                    <div>
                      <label className="form-label" htmlFor="edit-name">Name</label>
                      <input
                        id="edit-name"
                        type="text"
                        value={editMode ? (formData?.name ?? "") : (detail.name ?? "")}
                        onChange={(e) => editMode && setFormData((d) => ({ ...(d || {}), name: e.target.value }))}
                        disabled={!editMode}
                        className={`input ${!editMode ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="edit-notes">Notes</label>
                      <textarea
                        id="edit-notes"
                        rows={4}
                        value={editMode ? (formData?.notes ?? "") : (detail.notes ?? "")}
                        onChange={(e) => editMode && setFormData((d) => ({ ...(d || {}), notes: e.target.value }))}
                        disabled={!editMode}
                        className={`input ${!editMode ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                        placeholder="Any internal notes about this organisation"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center gap-2">
                    {editMode ? (
                      <>
                        <button onClick={handleSave} disabled={saving} className={`btn-primary ${saving ? "btn-disabled" : ""}`}>
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedId("")} // clear selection
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
