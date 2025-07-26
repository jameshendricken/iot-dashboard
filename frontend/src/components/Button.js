import React from "react"; 
import './Button.css';
import {Link} from 'react-router-dom';

export function Button() {
    const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userOrg");
    localStorage.removeItem("userRole");
    // setUser(null);
    // setOrg(null);
    // setRole(null);
    console.log("User logged out");
  };
  return (
    <>
      <button className="btn" onClick={handleLogout}>
        Sign Out
      </button>
      {/* <Navigate to="/" replace /> */}
    </>
  );
}