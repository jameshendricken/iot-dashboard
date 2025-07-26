import React from 'react'
import { Link } from 'react-router-dom';
import { button }  from './Button';
import './Navbar.css';
import Dropdown from './Dropdown';

function Navbar({ userEmail, org, role, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          IoT Dashboard
        </Link>
        <div className="navbar-links">
          <span className="navbar-user">{userEmail}</span>
          <span className="navbar-org">Org: {org}</span>
          <span className="navbar-role">Role: {role}</span>
          {role === 'admin' && (
            <>
              <Link to="/admin/devices" className="navbar-link">
                Admin Panel
              </Link>
              <Link to="/admin/users" className="navbar-link">
                Admin Users
              </Link>
            </>
          )}
            <Link to="/dashboard" className="navbar-link">
                Dashboard
            </Link>
          <button onClick={onLogout} className="navbar-logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;