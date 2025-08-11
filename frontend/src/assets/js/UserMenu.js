import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.tsx"; // from the earlier setup

export default function UserMenu({ email = "", onLogout }) {
  const [open, setOpen] = useState(false);
  const { resolved, toggle, setTheme, theme } = useTheme();
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = email?.trim()?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className="user-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        <span className="user-avatar">{initials}</span>
        <svg
          className="user-chevron"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User menu"
          className="user-dropdown"
        >
          <div className="user-dropdown-header">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Signed in as
            </div>
            <div className="user-email">{email || "user@example.com"}</div>
          </div>

          <div className="user-dropdown-list">
            {/* Theme toggle (simple light/dark switch) */}
            <div className="user-item">
              <span>Theme</span>
              <div
                role="switch"
                aria-checked={resolved === "dark"}
                tabIndex={0}
                onClick={toggle}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
                className={`toggle ${resolved === "dark" ? "toggle-checked" : "toggle-unchecked"}`}
              >
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </div>
            </div>

            {/* Optional: choose system/light/dark via select */}
            {/* <div className="user-item">
              <span className="text-gray-600 dark:text-gray-300">Mode</span>
              <select
                className="rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm
                           dark:border-gray-700"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div> */}

            <div className="user-divider" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="user-item"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
