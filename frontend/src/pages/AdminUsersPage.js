// src/pages/AdminUsersPage.js
import React, { useEffect, useMemo, useState } from "react";
import SearchBar from "../assets/js/SearchBar";

const API_URL = process.env.REACT_APP_API_BASE;
if (!API_URL) {
  console.error("REACT_APP_API_BASE is not defined. Please set it in your .env file.");
}

export default function AdminUsersPage() {
  // Data lists
  const [users, setUsers] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [roles, setRoles] = useState([]);

  // Fast lookup map for roles: id -> name
  const [rolesMap, setRolesMap] = useState(new Map());

  // Selection + edit
  const [selectedUser, setSelectedUser] = useState(null); // canonical (read-only)
  const [formData, setFormData] = useState(null);         // draft while editing
  const [editMode, setEditMode] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Helpers
  const orgNameFor = (orgId) =>
    organisations.find((o) => String(o.id) === String(orgId))?.name || "Not assigned";

  // roles_id aware getter
  const getRoleId = (u) => u?.roles_id ?? u?.role_id ?? u?.roleId ?? u?.roleid ?? null;

  const roleNameFor = (u) => {
    // If backend ever sends a string role too, prefer it for instant render
    if (u && typeof u.role === "string" && u.role.trim()) return u.role;
    if (u && typeof u.role_name === "string" && u.role_name.trim()) return u.role_name;

    const rid = getRoleId(u);
    if (rid == null || rid === "") return "Not assigned";
    return rolesMap.get(String(rid)) || "Not assigned";
  };

  // Build roles map whenever roles change
  useEffect(() => {
    setRolesMap(new Map(roles.map((r) => [String(r.id), r.name])));
  }, [roles]);

  // Load users, orgs, roles
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [usrRes, orgRes, roleRes] = await Promise.all([
          fetch(`${API_URL}/users`, { credentials: "include" }),
          fetch(`${API_URL}/organisations`, { credentials: "include" }),
          fetch(`${API_URL}/roles`, { credentials: "include" }),
        ]);
        const [usrData, orgData, roleData] = await Promise.all([
          usrRes.json(),
          orgRes.json(),
          roleRes.json(),
        ]);
        if (!usrRes.ok) throw new Error(usrData?.detail || "Failed to load users");
        if (!orgRes.ok) throw new Error(orgData?.detail || "Failed to load organisations");
        if (!roleRes.ok) throw new Error(roleData?.detail || "Failed to load roles");

        setUsers(Array.isArray(usrData) ? usrData : []);
        setOrganisations(Array.isArray(orgData) ? orgData : []);
        setRoles(Array.isArray(roleData) ? roleData : []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // When picking a user, clear edit mode
  const handleSelectUser = (user) => {
    const enriched = {
      ...user,
      organisation_id: user.organisation_id ? String(user.organisation_id) : "",
      // normalize roles_id to string for select
      roles_id: getRoleId(user) ? String(getRoleId(user)) : "",
    };
    setSelectedUser(enriched);
    setEditMode(false);
    setFormData(null);
    setError("");
    setSuccess("");
  };

  // Search (email, name, org name, role name, id)
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      const org = orgNameFor(u.organisation_id).toLowerCase();
      const role = roleNameFor(u).toLowerCase();
      const id = String(u.id || "").toLowerCase();
      return email.includes(q) || name.includes(q) || org.includes(q) || role.includes(q) || id.includes(q);
    });
    
  }, [users, query, organisations, rolesMap]);

  // Enter edit mode
  const beginEdit = () => {
    if (!selectedUser) return;
    setFormData({
      id: selectedUser.id,
      email: selectedUser.email || "",
      name: selectedUser.name || "",
      organisation_id: selectedUser.organisation_id || "",
      roles_id: selectedUser.roles_id || "", // keep as string for the <select>
    });
    setEditMode(true);
  };

  const onField = (e) => {
    const { name, value } = e.target;
    setFormData((d) => ({ ...(d || {}), [name]: value }));
  };

  const cancelEdit = () => {
    setFormData(null);
    setEditMode(false);
  };

  // Save changes (includes roles_id)
  const handleSave = async () => {
    if (!formData || !formData.id) return;

    const payload = {
      ...formData,
      organisation_id: formData.organisation_id ? Number(formData.organisation_id) : null,
      roles_id: formData.roles_id ? Number(formData.roles_id) : null,
    };

    if (!payload.email?.trim()) return setError("Email is required.");
    if (!payload.name?.trim()) return setError("Name is required.");

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/users/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.detail || "Failed to update user");

      // Normalize the returned user object into canonical state
      const canonical = {
        ...updated,
        organisation_id: updated.organisation_id ? String(updated.organisation_id) : "",
        roles_id: getRoleId(updated) ? String(getRoleId(updated)) : "", // handles roles_id or role_id
      };

      setSelectedUser(canonical);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

      setSuccess("Saved changes");
      setEditMode(false);
      setFormData(null);
      setTimeout(() => setSuccess(""), 1500);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Users</h1>
        {loading && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading…
          </div>
        )}
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
            <SearchBar value={query} onChange={setQuery} placeholder="Search users by email, name, role…" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
            </p>
          </div>

          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredUsers.map((user) => {
              const active = selectedUser?.id === user.id;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left px-3 py-2 transition rounded-md
                      ${active
                        ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100"}`}
                  >
                    <div className="font-medium">{user.email || "(No email)"}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.name || "Unnamed"} • {roleNameFor(user)}
                      {user.organisation_id ? ` • ${orgNameFor(user.organisation_id)}` : ""}
                    </div>
                  </button>
                </li>
              );
            })}
            {filteredUsers.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No matching users.</li>
            )}
          </ul>
        </div>

        {/* Right details pane — view first; edit on demand */}
        <div className="md:col-span-2">
          {!selectedUser ? (
            <div className="card">
              <p className="text-sm text-gray-600 dark:text-gray-300">Select a user to view details.</p>
            </div>
          ) : (
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedUser.email || "(No email)"}
                </h2>
                {!editMode && (
                  <button type="button" onClick={beginEdit} className="btn-primary">
                    Edit
                  </button>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="form-label" htmlFor="name">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={editMode ? (formData?.name ?? "") : (selectedUser.name ?? "")}
                    onChange={onField}
                    disabled={!editMode}
                    className={`input ${!editMode ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={editMode ? (formData?.email ?? "") : (selectedUser.email ?? "")}
                    onChange={onField}
                    disabled={!editMode}
                    className={`input ${!editMode ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="roles_id">Role</label>
                  {!editMode ? (
                    <input
                      id="roles_id"
                      type="text"
                      value={roleNameFor(selectedUser)}
                      disabled
                      className="input bg-gray-100 dark:bg-gray-800"
                    />
                  ) : (
                    <select
                      id="roles_id"
                      name="roles_id"
                      value={formData?.roles_id || ""}
                      onChange={onField}
                      className="input"
                    >
                      <option value="" className="bg-white dark:bg-gray-900">Not assigned</option>
                      {roles.map((r) => (
                        <option key={r.id} value={String(r.id)} className="bg-white dark:bg-gray-900">
                          {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="form-label" htmlFor="organisation_id">Organisation</label>
                  {!editMode ? (
                    <input
                      id="organisation_id"
                      type="text"
                      value={orgNameFor(selectedUser.organisation_id)}
                      disabled
                      className="input bg-gray-100 dark:bg-gray-800"
                    />
                  ) : (
                    <select
                      id="organisation_id"
                      name="organisation_id"
                      value={formData?.organisation_id || ""}
                      onChange={onField}
                      className="input"
                    >
                      <option value="" className="bg-white dark:bg-gray-900">Not assigned</option>
                      {organisations.map((org) => (
                        <option key={org.id} value={String(org.id)} className="bg-white dark:bg-gray-900">
                          {org.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`btn-primary ${saving ? "btn-disabled" : ""}`}
                    >
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
                    onClick={() => setSelectedUser(null)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
