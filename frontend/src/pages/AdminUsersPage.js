import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_BASE;
if (!API_URL) {
  console.error("REACT_APP_API_BASE is not defined. Please set it in your .env file.");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [organisations, setOrganisations] = useState([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching users:", err));

    fetch(`${API_URL}/organisations`)
      .then((res) => res.json())
      .then((data) => setOrganisations(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching organisations:", err));
  }, []);

  const handleSelectUser = (user) => {
    const enrichedUser = {
      ...user,
      organisation_id: user.organisation_id ? String(user.organisation_id) : "",
    };
    setSelectedUser(enrichedUser);
    setFormData(enrichedUser);
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
      if (key !== "id" && !value.toString().trim()) {
        newErrors[key] = "This field is required.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    fetch(`${API_URL}/users/${formData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((updatedUser) => {
        setUsers((prev) =>
          prev.map((usr) => (usr.id === updatedUser.id ? updatedUser : usr))
        );
        alert("User updated successfully.");
        setEditMode(false);
      })
      .catch((err) => console.error("Update failed:", err));
  };

  const handleCancel = () => {
    setFormData(selectedUser);
    setErrors({});
    setEditMode(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Admin Users Page</h2>
      <div className="flex gap-6">
        <div className="w-1/3">
          <h3 className="font-semibold mb-2">Users</h3>
          <ul className="bg-white rounded shadow p-2 divide-y">
            {users.map((user) => (
              <li
                key={user.id}
                className="py-2 px-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectUser(user)}
              >
                {user.email || user.id}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3">
          {selectedUser && (
            <div className="bg-white rounded shadow p-4">
              <h3 className="font-semibold text-lg mb-4">User Details</h3>
              <form className="space-y-4">
                {Object.entries(formData)
                  .filter(([key]) => key !== "password_hash")
                  .map(([key, value]) => (
                    <div key={key}>
                      <label className="block font-medium capitalize mb-1">
                        {key.replace("_", " ")}
                      </label>
                      {key === "organisation_id" ? (
                        editMode ? (
                          <select
                            name="organisation_id"
                            value={formData.organisation_id || ""}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors[key]
                                ? "border-red-500 focus:ring-red-400"
                                : "border-gray-300 focus:ring-indigo-500"
                            }`}
                          >
                            <option value="">
                              {editMode ? "Select organisation" : "Not assigned"}
                            </option>
                            {organisations.map((org) => (
                              <option key={org.id} value={String(org.id)}>
                                {org.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="organisation_id"
                            value={
                              organisations.find(
                                (org) => String(org.id) === String(formData.organisation_id)
                              )?.name || "Not assigned"
                            }
                            disabled
                            className="w-full px-3 py-2 border rounded-md bg-gray-200 border-gray-300"
                          />
                        )
                      ) : (
                        <input
                          type="text"
                          name={key}
                          value={value}
                          onChange={handleChange}
                          disabled={key === "id" || !editMode}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            key === "id" || !editMode
                              ? "bg-gray-200 border-gray-300"
                              : errors[key]
                              ? "border-red-500 focus:ring-red-400"
                              : "border-gray-300 focus:ring-indigo-500"
                          }`}
                        />
                      )}
                      {errors[key] && (
                        <p className="text-red-500 text-sm mt-1">{errors[key]}</p>
                      )}
                    </div>
                  ))}
              </form>
              <div className="mt-4 flex gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
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
