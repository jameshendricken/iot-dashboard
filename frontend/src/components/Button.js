import React from "react"; 
import './Button.css';
import {Link} from 'react-router-dom';

export function Button(onLogout) {
  return (
    <Link to="sign-out">
        <button className="btn" onClick={onLogout}>
            Sign Out
        </button>
    </Link>
  );
}