import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "../css/component/navbar2.css";           // <-- your Tailwind @apply file
import UserMenu from "./UserMenu"; // <-- adjust path if needed

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {{to:string,label:string}[]} props.navItems
 * @param {string} props.userEmail
 * @param {Function} props.onLogout
 */
export default function Navbar({
  title = "IoT Dashboard",
  navItems = [
    // sensible fallback if nothing is passed
    { to: "/dashboard", label: "Dashboard" },
    { to: "/units", label: "Unit Data" },
  ],
  userEmail,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close mobile menu on route change
  useEffect(() => setOpen(false), [location.pathname]);

  // close mobile menu on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const linkBase = "nav-link";
  const linkActive = "nav-link-active";
  const linkInactive = "nav-link-inactive";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-top">
          {/* Brand */}
          <Link to="/" className="navbar-title">
            {title}
          </Link>

          {/* Desktop: links + user */}
          <div className="hidden md:flex md:items-center md:gap-2">
            {navItems?.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}

            {/* User menu (avatar + dropdown) */}
            <UserMenu email={userEmail} onLogout={onLogout} />
          </div>

          {/* Mobile: user + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <UserMenu email={userEmail} onLogout={onLogout} />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="hamburger-btn"
              aria-controls="mobile-menu"
              aria-expanded={open}
              aria-label="Toggle navigation menu"
            >
              {!open ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu: links only */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-[max-height,opacity] duration-200 ease-out ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="mobile-menu">
          {navItems?.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              end
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
