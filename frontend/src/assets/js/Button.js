import React from "react"; 
// import './Button.css';
// import '../assets/css/Button.css';
import {Link} from 'react-router-dom';
import '../css/component/button.css';

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
        <button
            className="btn"
            onClick={() => {
                handleLogout();
                window.location.href = "/";
            }}
        >
            Sign Out
        </button>
    </>
);
}