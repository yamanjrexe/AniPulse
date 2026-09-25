import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CommunityTabs from "./components/CommunityTabs.jsx";
import FriendsTab from "./components/FriendsTab.jsx";
import FeedTab from "./components/FeedTab.jsx";
import DiscussionsTab from "./components/DiscussionsTab.jsx";
import LeaderboardTab from "./components/LeaderboardTab.jsx";
import UserProfileModal from "./components/UserProfileModal.jsx";

const VALID_TABS = ["friends", "feed", "discussions", "leaderboard"];

export default function Community() {
  const [params, setParams] = useSearchParams();
  const paramTab = params.get("tab");
  const tab = VALID_TABS.includes(paramTab) ? paramTab : "friends";

  const [profileUserId, setProfileUserId] = useState(null);

  const setTab = (next) => {
    if (!VALID_TABS.includes(next)) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  };

  useEffect(() => {
    window.openUserProfile = (uid) => setProfileUserId(uid);
    return () => {
      delete window.openUserProfile;
    };
  }, []);

  return (
    <div className="dashboard-section">
      <h2 className="section-title">
        <i className="fas fa-users" aria-hidden="true" /> Community
      </h2>

      <CommunityTabs active={tab} onChange={setTab} />

      {tab === "friends" && <FriendsTab />}
      {tab === "feed" && <FeedTab />}
      {tab === "discussions" && <DiscussionsTab />}
      {tab === "leaderboard" && <LeaderboardTab />}

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </div>
  );
}
