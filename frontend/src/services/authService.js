import { api } from "./api.js";
import { firebase } from "../firebaseClient.js";

export const authService = {
    onAuthStateChanged(cb) {
        if (!firebase || !firebase.apps || firebase.apps.length === 0) {
            return () => { };
        }
        return firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const token = await user.getIdToken();
                localStorage.setItem("authToken", token);

                const stored = JSON.parse(localStorage.getItem("user") || "{}");
                if (!stored.uid || stored.uid !== user.uid) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            {
                                uid: user.uid,
                                email: user.email,
                                name:
                                    stored.name ||
                                    user.displayName ||
                                    user.email.split("@")[0],
                                username:
                                    stored.username ||
                                    user.displayName ||
                                    user.email.split("@")[0],
                                avatar: stored.avatar || user.photoURL || null,
                            },
                            null,
                            2,
                        ),
                    );
                } else {
                    stored.email = user.email || stored.email;
                    stored.avatar = stored.avatar || user.photoURL || null;
                    localStorage.setItem(
                        "user",
                        JSON.stringify(stored, null, 2),
                    );
                }
            } else {
                const hadToken = !!localStorage.getItem("authToken");
                if (hadToken) {
                    await new Promise((r) => setTimeout(r, 500));
                    const stillNull = !firebase?.auth?.().currentUser;
                    if (!stillNull) return;
                }

                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
            }
            cb(user);
        });
    },

    async login(email, password) {
        const cred = await firebase
            .auth()
            .signInWithEmailAndPassword(email, password);

        if (!cred.user.emailVerified) {
            await cred.user.sendEmailVerification();
            throw new Error("Please verify your email. A new link was sent.");
        }

        const idToken = await cred.user.getIdToken();
        const data = await api.post("/auth/login", { token: idToken });

        localStorage.setItem("authToken", idToken);
        localStorage.setItem("user", JSON.stringify(data.user, null, 2));
        return data.user;
    },

    async register(email, password, username) {
        const cred = await firebase
            .auth()
            .createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: username });
        await cred.user.sendEmailVerification();

        const idToken = await cred.user.getIdToken();
        await api.post("/auth/register", { token: idToken, email, username });

        return { needsVerification: true };
    },

    async loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const idToken = await result.user.getIdToken();
        const data = await api.post("/auth/google", { token: idToken });

        localStorage.setItem("authToken", idToken);
        localStorage.setItem("user", JSON.stringify(data.user, null, 2));
        return data.user;
    },

    async fetchProfile(fbUser) {
        try {
            const data = await api.get("/auth/profile");
            const cloudUser = data?.user || {};
            const stored = JSON.parse(localStorage.getItem("user") || "{}");

            const merged = {
                ...stored,
                ...cloudUser,
                uid: fbUser.uid,
                email: fbUser.email || stored.email,
                name:
                    cloudUser.name ||
                    stored.name ||
                    fbUser.displayName ||
                    fbUser.email.split("@")[0],
                username:
                    cloudUser.username ||
                    cloudUser.name ||
                    stored.username ||
                    stored.name ||
                    fbUser.email.split("@")[0],
            };

            localStorage.setItem("user", JSON.stringify(merged, null, 2));
            return merged;
        } catch (err) {
            console.warn(
                "fetchProfile failed, using local cache:",
                err.message,
            );
            return JSON.parse(localStorage.getItem("user") || "{}");
        }
    },

    async updateDisplayName(newName) {
        const clean = (newName || "").trim();
        if (!clean) throw new Error("Name cannot be empty");

        const fbUser = firebase?.auth?.().currentUser;
        if (fbUser && fbUser.displayName !== clean) {
            try {
                await fbUser.updateProfile({ displayName: clean });
            } catch (e) {
                console.warn("Firebase displayName update failed:", e.message);
            }
        }

        try {
            await api.put("/auth/profile", { name: clean, username: clean });
        } catch (e) {
            console.warn(
                "Backend name update failed, will retry on sync:",
                e.message,
            );
        }

        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored.name = clean;
        stored.username = clean;
        localStorage.setItem("user", JSON.stringify(stored, null, 2));

        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        profile.name = clean;
        profile.username = clean;
        localStorage.setItem("userProfile", JSON.stringify(profile, null, 2));

        return stored;
    },

    async logout() {
        try {
            await firebase.auth().signOut();
        } catch (_) { }

        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("xpPendingQueue");

        sessionStorage.removeItem("cloudLoadedToastShown");
        sessionStorage.removeItem("nameModalShown");

        window.__levelBootDone = false;
        window.__syncBootstrapped = false;
        window.__cloudToastShown = false;
        window.__recapAutoFired = false;

        window.dispatchEvent(new CustomEvent("userLogout"));
    },
};