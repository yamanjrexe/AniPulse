import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminOverview from "./components/AdminOverview.jsx";
import AdminUsers from "./components/AdminUsers.jsx";
import AdminDiscussions from "./components/AdminDiscussions.jsx";
import AdminAnnouncements from "./components/AdminAnnouncements.jsx";
import AdminLogs from "./components/AdminLogs.jsx";
import AdminReports from "./components/AdminReports.jsx";

const TABS = [
  { k: "overview", l: "Overview", icon: "fa-chart-pie" },
  { k: "users", l: "Users", icon: "fa-users" },
  { k: "discussions", l: "Discussions", icon: "fa-comments" },
  { k: "reports", l: "Reports", icon: "fa-flag" },
  { k: "announce", l: "Announcements", icon: "fa-bullhorn" },
  { k: "logs", l: "Audit Logs", icon: "fa-clipboard-list" },
];

const VALID_TABS = TABS.map((t) => t.k);

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTab = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(paramTab) ? paramTab : "overview";

  const changeTab = (newTab) => {
    if (!VALID_TABS.includes(newTab)) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="dashboard-section admin-page">
      <h2 className="section-title">
        <i className="fas fa-shield-halved" /> Admin Control Panel
      </h2>

      <div className="community-tabs" style={{ marginBottom: "20px" }}>
        {TABS.map((t) => (
          <button
            key={t.k}
            className={`community-tab ${activeTab === t.k ? "active" : ""}`}
            onClick={() => changeTab(t.k)}
          >
            <i className={`fas ${t.icon}`} /> <span>{t.l}</span>
          </button>
        ))}
      </div>

      {activeTab === "overview" && <AdminOverview onNavigate={changeTab} />}
      {activeTab === "users" && <AdminUsers />}
      {activeTab === "discussions" && <AdminDiscussions />}
      {activeTab === "reports" && <AdminReports />}
      {activeTab === "announce" && <AdminAnnouncements />}
      {activeTab === "logs" && <AdminLogs />}
    </div>
  );
}
