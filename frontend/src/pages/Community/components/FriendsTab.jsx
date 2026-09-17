import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import FriendRequests from "./FriendRequests.jsx";
import SearchUsers from "./SearchUsers.jsx";
import FriendsList from "./FriendsList.jsx";

export default function FriendsTab() {
    const { showToast } = useToast();
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);

    const load = useCallback(async () => {
        try {
            const [f, r] = await Promise.allSettled([
                api.get("/friends/list"),
                api.get("/friends/requests"),
            ]);
            setFriends(f.status === "fulfilled" ? f.value || [] : []);
            setRequests(r.status === "fulfilled" ? r.value || [] : []);
        } catch (e) {
            showToast("Failed to load friends", "error");
        }
    }, [showToast]);

    useEffect(() => {
        load();
    }, [load]);

    const accept = async (id) => {
        try {
            await api.post(`/friends/accept/${id}`, {});
            showToast("Friend added!", "success");
            load();
        } catch {
            showToast("Failed", "error");
        }
    };
    const decline = async (id) => {
        try {
            await api.post(`/friends/decline/${id}`, {});
            load();
        } catch {}
    };
    const remove = async (uid) => {
        if (!window.confirm("Remove this friend?")) return;
        try {
            await api.del(`/friends/remove/${uid}`);
            showToast("Removed", "info");
            load();
        } catch {}
    };
    const sendRequest = async (uid) => {
        try {
            await api.post(`/friends/request/${uid}`, {});
            showToast("Request sent!", "success");
        } catch (e) {
            showToast(e.message, "error");
        }
    };

    return (
        <div className="community-tab-content active">
            <FriendRequests
                requests={requests}
                onAccept={accept}
                onDecline={decline}
            />
            <SearchUsers onSendRequest={sendRequest} />
            <FriendsList friends={friends} onRemove={remove} />
        </div>
    );
}
