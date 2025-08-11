import React from 'react'
import { Link } from 'react-router-dom';
// import { Button, button }  from './Button';
import {Button, button } from '../../assets/js/Button';
// import '../../assets/css/Navbar.css';
import '../css/component/navbar.css';

import Dropdown from '../../components/Dropdown';

function Navbar({ userEmail, org, role }) {
    const[click, setClick] = React.useState(false);
    const [dropdown, setDropdown] = React.useState(false);
    const handleClick = () => {
        setClick(!click);
    };
    const closeMobileMenu = () => {
        setClick(false);
    };

    const onMouseEnter = () => {
        if (window.innerWidth < 960) {
            setDropdown(false);
        } else {
            setDropdown(true);
        }
    }

    const onMouseLeave = () => {
        if (window.innerWidth < 960) {
            setDropdown(false);
        } else {
            setDropdown(false);
        }
    }
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
        <nav class="navbar">
            <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
                IoT Dashboard <i class='fab fa-firstdraft' />
            </Link>
            <div className="menu-icon" onClick={handleClick}>
                <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
            </div>

            {userEmail && (
                <>
                    <ul className={click ? 'nav-menu active' : 'nav-menu'}>
                        
                        <li className="nav-item">
                            <Link to="/dashboard" className="nav-links" onClick={closeMobileMenu}>
                                Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/tailwind" className="nav-links" onClick={closeMobileMenu}>
                                Tailwind
                            </Link>
                        </li>
                        {role === 'admin' && (
                            <>
                                <li className="nav-item" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} >
                                    <Link to="/admin/devices" className="nav-links" onClick={closeMobileMenu}>
                                        Admin <i className="fas fa-caret-down" />
                                    </Link>
                                    {dropdown && <Dropdown />}
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <Link to="/" className="nav-links" onClick={() => {
                                handleLogout();
                                window.location.href = "/";
                        }}>
                                Log Out
                            </Link>
                        </li>
                
                    </ul>

                    <Button onClick={handleLogout}/>
                    {/* <div className="navbar-user">{userEmail}</div> */}
                
                </>
                
            )}           
            

            
            

            {/* button working fine
            <button onClick={onLogout} className="navbar-logout-button">
                        Logout
            </button> */}
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