import React, { useEffect, useRef } from "react";

/**
 * A11y-friendly search bar with optional "/" shortcut focus.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  autoFocusShortcut = true,
  className = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!autoFocusShortcut) return;
    const handler = (e) => {
      // focus on "/" unless typing in an input/textarea/select
      const tag = (e.target.tagName || "").toLowerCase();
      if (e.key === "/" && !["input", "textarea", "select"].includes(tag)) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [autoFocusShortcut]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 z-0"
        aria-label="Search"
      />
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
      </svg>
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-gray-300 px-1 text-[10px] text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:block">/</kbd>
    </div>
  );
}
