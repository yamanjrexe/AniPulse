import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { firebase } from "../../firebaseClient.js";
import CommunityTabs from "./components/CommunityTabs.jsx";
import FriendsTab from "./components/FriendsTab.jsx";
import SpotlightTab from "./components/SpotlightTab.jsx";
import DiscussionsTab from "./components/DiscussionsTab.jsx";
import LeaderboardTab from "./components/LeaderboardTab.jsx";
import UserProfileModal from "./components/UserProfileModal.jsx";

const VALID_TABS = ["friends", "spotlight", "discussions", "leaderboard"];

export default function Community() {
  const [params, setParams] = useSearchParams();
  const paramTab = params.get("tab");
  const tab = VALID_TABS.includes(paramTab) ? paramTab : "friends";

  const [profileUserId, setProfileUserId] = useState(null);
  const [hasUnreadDiscussions, setHasUnreadDiscussions] = useState(false);

  const setTab = (next) => {
    if (!VALID_TABS.includes(next)) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", next);
    setParams(nextParams, { replace: true });

    if (next === "discussions") {
      setHasUnreadDiscussions(false);
      localStorage.setItem("lastReadDiscussions", new Date().toISOString());
    }
  };

  useEffect(() => {
    window.openUserProfile = (uid) => setProfileUserId(uid);
    return () => {
      delete window.openUserProfile;
    };
  }, []);

  useEffect(() => {
    const checkUnread = async () => {
      if (tab === "discussions") {
        localStorage.setItem("lastReadDiscussions", new Date().toISOString());
        setHasUnreadDiscussions(false);
        return;
      }

      try {
        const snapshot = await firebase
          .firestore()
          .collection("discussions")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const latestPost = snapshot.docs[0].data();
          const lastRead = localStorage.getItem("lastReadDiscussions");

          if (
            !lastRead ||
            new Date(latestPost.createdAt) > new Date(lastRead)
          ) {
            setHasUnreadDiscussions(true);
          }
        }
      } catch (err) {
        console.error("Failed to check unread status", err);
      }
    };

    checkUnread();
  }, [tab]);

  return (
    <div className="dashboard-section">
      <h2 className="section-title">
        <i className="fas fa-users" aria-hidden="true" /> Community
      </h2>

      <CommunityTabs
        active={tab}
        onChange={setTab}
        hasUnreadDiscussions={hasUnreadDiscussions}
      />

      {tab === "friends" && <FriendsTab />}
      {tab === "spotlight" && <SpotlightTab />}
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
