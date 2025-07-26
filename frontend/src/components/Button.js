import React from "react"; 
import './Button.css';
import {Link} from 'react-router-dom';

export function Button() {
  return (
    <Link to="sign-out">
        <button className="btn">
            Sign Out
        </button>
    </Link>
  );
}