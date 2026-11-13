import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { navigationItems } from "../../routes/routeConfig.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function SidebarNav({ onNavigate }) {
  const { logout, isAdmin, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({});

  useEffect(() => {
    const loadProfile = () => {
      try {
        setProfile(JSON.parse(localStorage.getItem("userProfile") || "{}"));
      } catch {
        setProfile({});
      }
    };

    loadProfile();
    window.addEventListener("uiRefresh", loadProfile);
    return () => window.removeEventListener("uiRefresh", loadProfile);
  }, []);

  const handleLogout = async () => {
    showToast("Logging out...", "info");
    await logout();
    navigate("/login");
  };

  const publicSlug = profile.publicUsername || profile.usernameLower;
  const hasAdminAccess =
    isAdmin ||
    user?.role === "admin" ||
    user?.isAdmin === true ||
    profile.role === "admin";

  const visibleItems = navigationItems.filter((item) => {
    if (item.adminOnly && !hasAdminAccess) return false;
    if (item.isDynamic && !publicSlug) return false;
    return true;
  });

  return (
    <>
      <nav className="sidebar-menu" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const itemPath =
            item.isDynamic && publicSlug
              ? item.path.replace(":username", publicSlug)
              : item.path;

          return (
            <NavLink
              key={item.id}
              to={itemPath}
              data-page={item.id}
              onClick={(e) => {
                if (onNavigate) onNavigate(e);
              }}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <i className={`fas ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="menu-item" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt" aria-hidden="true" />
          <span>Logout</span>
        </div>
      </div>
    </>
  );
}
