import React from "react";
import { Link } from "react-router-dom";

export default function Layout({ userEmail, org, role, onLogout, children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="w-full bg-white shadow p-4 flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold">{userEmail}</p>
          <p className="text-sm text-gray-500 italic">Org: {org}</p>
          {role === "admin" && (
            <Link
              to="/admin/devices"
              className="mt-2 inline-block text-sm text-indigo-600 hover:underline"
            >
              Admin Panel
            </Link>
          )}
        </div>
        <Link
              to="/dashboard"
              className="mt-2 inline-block text-sm text-indigo-600 hover:underline"
            >
              Dashboard
            </Link>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Logout
        </button>
      </header>
      <main className="max-w-6xl mx-auto py-8 px-4">{children}</main>
    </div>
  );
}
