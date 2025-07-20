import React from "react";

export default function Layout({ userEmail, org, onLogout, children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="w-full bg-white shadow p-4 flex justify-between items-center">
        {/* <span className="text-sm text-gray-600">Logged in as: <strong>{userEmail}</strong></span>
        <span className="text-sm text-gray-600">Organisation:  <strong>{orgName}</strong></span> */}
        <div>
          <p className="text-lg font-semibold">{userEmail}</p>
          <p className="text-sm text-gray-500 italic">Org: {org}</p>
        </div>
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