import React, { useState } from "react";
import CommunityTabs from "./components/CommunityTabs.jsx";
import FriendsTab from "./components/FriendsTab.jsx";
import FeedTab from "./components/FeedTab.jsx";
import DiscussionsTab from "./components/DiscussionsTab.jsx";
import LeaderboardTab from "./components/LeaderboardTab.jsx";
import UserProfileModal from "./components/UserProfileModal.jsx";

export default function Community() {
    const [tab, setTab] = useState("friends");
    const [profileUserId, setProfileUserId] = useState(null);

    React.useEffect(() => {
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
