import React from "react";

export default function Layout({ userEmail, onLogout, children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="w-full bg-white shadow p-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">Logged in as: <strong>{userEmail}</strong></span>
        <button onClick={onLogout} className="text-indigo-600 hover:underline">Logout</button>
      </header>
      <main className="max-w-6xl mx-auto py-8 px-4">{children}</main>
    </div>
  );
}