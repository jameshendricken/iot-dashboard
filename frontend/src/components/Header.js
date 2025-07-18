import React from "react";

export default function Header({ userEmail, onLogout }) {
  return (
    <header className="w-full bg-white shadow p-4 flex justify-between items-center">
      <span className="text-sm text-gray-600">Logged in as: <strong>{userEmail}</strong></span>
      <button onClick={onLogout} className="text-indigo-600 hover:underline">Logout</button>
    </header>
  );
}