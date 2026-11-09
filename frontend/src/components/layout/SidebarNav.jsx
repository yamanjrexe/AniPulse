import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { navigationItems } from "../../routes/routeConfig.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function SidebarNav({ onNavigate }) {
  const { logout, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    showToast("Logging out...", "info");
    await logout();
    navigate("/login");
  };

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <nav className="sidebar-menu" aria-label="Main navigation">
      {visibleItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          data-page={item.id}
          onClick={(e) => {
            if (onNavigate) onNavigate(e);
          }}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <i className={`fas ${item.icon}`} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div className="menu-item" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt" aria-hidden="true" />
        <span>Logout</span>
      </div>
    </nav>
  );
}
