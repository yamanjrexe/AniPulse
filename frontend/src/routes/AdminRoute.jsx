import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  Link,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminRoute() {
  const { user, initialized, isAdmin, isAdminChecked, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!initialized || !isAdminChecked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          width: "100%",
        }}
      >
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: "2rem", color: "var(--brand-yellow)" }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    const handleAdminLogin = async () => {
      await logout();
      navigate("/login", { state: { from: location } });
    };

    return (
      <div className="admin-access-denied">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <i className="fas fa-shield-halved"></i>
          </div>
          <h2>Restricted Area</h2>
          <p>
            You do not have administrator privileges to view this page. If you
            believe this is a mistake, please contact the site owner or log in
            with an admin account.
          </p>
          <div className="access-denied-actions">
            <Link to="/dashboard" className="admin-btn-secondary">
              <i className="fas fa-arrow-left"></i> Return to Dashboard
            </Link>
            <button className="admin-btn-primary" onClick={handleAdminLogin}>
              <i className="fas fa-user-shield"></i> Login as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
