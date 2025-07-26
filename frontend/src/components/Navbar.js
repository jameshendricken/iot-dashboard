import React from 'react'
import { Link } from 'react-router-dom';
import { button }  from './Button';
import './Navbar.css';
import Dropdown from './Dropdown';

function Navbar({ userEmail, org, role, onLogout }) {
    const[click, setClick] = React.useState(false);
    const [dropdown, setDropdown] = React.useState(false);
    const handleClick = () => {
        setClick(!click);
    };
    const closeMobileMenu = () => {
        setClick(false);
    };



  return (
    <>
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                IoT Dashboard
            </Link>
            <div className="menu-icon" onClick={handleClick}>
                <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
            </div>
            <div className="navbar-user-info">
                <span className="navbar-user-email">{userEmail}</span>
                <span className="navbar-user-org">Org: {org}</span>
                <span className="navbar-user-role">Role: {role}</span>
            </div>
            <div>
                <ul className={click ? 'navbar-menu active' : 'navbar-menu'}>
                    <li className="navbar-item">
                        <Link to="/dashboard" className="navbar-links" onClick={closeMobileMenu}>
                            Dashboard
                        </Link>
                    </li>
                    {role === 'admin' && (
                        <>
                            <li className="navbar-item">
                                <Link to="/admin/devices" className="navbar-links" onClick={closeMobileMenu}>
                                    Admin <i className="fas fa-caret-down" />
                                </Link>
                                {dropdown && <Dropdown />}
                            </li>
                        </>
                    )}
                    
                </ul>
            </div>

            {/* button working fine */}
            <button onClick={onLogout} className="navbar-logout-button">
                        Logout
            </button>
        </nav>
    </>
  );
}

export default Navbar;


// <nav className="navbar">
    //   <div className="navbar-container">
    //     <Link to="/dashboard" className="navbar-logo">
    //       IoT Dashboard
    //     </Link>
    //     <div className="navbar-links">
    //       <span className="navbar-user">{userEmail}</span>
    //       <span className="navbar-org">Org: {org}</span>
    //       <span className="navbar-role">Role: {role}</span>
    //       {role === 'admin' && (
    //         <>
    //           <Link to="/admin/devices" className="navbar-link">
    //             Admin Panel
    //           </Link>
    //           <Link to="/admin/users" className="navbar-link">
    //             Admin Users
    //           </Link>
    //         </>
    //       )}
    //         <Link to="/dashboard" className="navbar-link">
    //             Dashboard
    //         </Link>
    //       <button onClick={onLogout} className="navbar-logout-button">
    //         Logout
    //       </button>
    //     </div>
    //   </div>
    // </nav>