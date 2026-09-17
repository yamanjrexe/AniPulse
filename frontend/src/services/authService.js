// ============================================
// AUTH SERVICE — Firebase + backend
// ============================================
import { api } from './api.js';

export const authService = {
    // ─── Firebase auth state listener ──────────────────
    onAuthStateChanged(cb) {
        if (typeof window === 'undefined' || !window.firebase) return () => { };
        return window.firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const token = await user.getIdToken();
                localStorage.setItem('authToken', token);

                // ⚠️ Do NOT overwrite name from Firebase Auth's displayName.
                //    Only fill in missing fields — never clobber a cloud-synced name.
                const stored = JSON.parse(localStorage.getItem('user') || '{}');
                if (!stored.uid || stored.uid !== user.uid) {
                    localStorage.setItem('user', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        // Only use displayName as a *fallback* if no name was ever synced
                        name: stored.name || user.displayName || user.email.split('@')[0],
                        username: stored.username || user.displayName || user.email.split('@')[0],
                        avatar: stored.avatar || user.photoURL || null,
                    }));
                } else {
                    // Same user, refresh only the non-name fields
                    stored.email = user.email || stored.email;
                    stored.avatar = stored.avatar || user.photoURL || null;
                    localStorage.setItem('user', JSON.stringify(stored));
                }
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
            cb(user);
        });
    },

    // ─── Login ─────────────────────────────────────────
    async login(email, password) {
        const cred = await window.firebase.auth()
            .signInWithEmailAndPassword(email, password);

        if (!cred.user.emailVerified) {
            await cred.user.sendEmailVerification();
            throw new Error('Please verify your email. A new link was sent.');
        }

        const idToken = await cred.user.getIdToken();
        const data = await api.post('/auth/login', { token: idToken });

        // Backend returns the *cloud* name from Firestore
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
    },

    // ─── Register ──────────────────────────────────────
    async register(email, password, username) {
        const cred = await window.firebase.auth()
            .createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: username });
        await cred.user.sendEmailVerification();

        const idToken = await cred.user.getIdToken();
        await api.post('/auth/register', { token: idToken, email, username });

        return { needsVerification: true };
    },

    // ─── Google ────────────────────────────────────────
    async loginWithGoogle() {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        const result = await window.firebase.auth().signInWithPopup(provider);
        const idToken = await result.user.getIdToken();
        const data = await api.post('/auth/google', { token: idToken });

        localStorage.setItem('authToken', idToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
    },

    // ─── Fetch profile from backend (cloud name) ───────
    // Always fetch fresh — cloud is source of truth.
    async fetchProfile(fbUser) {
        try {
            const data = await api.get('/auth/profile');
            const cloudUser = data?.user || {};
            const stored = JSON.parse(localStorage.getItem('user') || '{}');

            // Merge — cloud wins for name/username, keep any local-only fields
            const merged = {
                ...stored,
                ...cloudUser,
                uid: fbUser.uid,
                email: fbUser.email || stored.email,
                // Name priority: cloud name → stored name → displayName → email prefix
                name: cloudUser.name || stored.name || fbUser.displayName || fbUser.email.split('@')[0],
                username: cloudUser.username || cloudUser.name || stored.username || stored.name || fbUser.email.split('@')[0],
            };

            localStorage.setItem('user', JSON.stringify(merged));
            return merged;
        } catch (err) {
            console.warn('fetchProfile failed, using local cache:', err.message);
            return JSON.parse(localStorage.getItem('user') || '{}');
        }
    },

    // ─── Update name everywhere (cloud + local + Firebase) ─
    async updateDisplayName(newName) {
        const clean = (newName || '').trim();
        if (!clean) throw new Error('Name cannot be empty');

        // 1) Firebase Auth displayName (best-effort — email users can update this)
        const fbUser = window.firebase?.auth?.().currentUser;
        if (fbUser && fbUser.displayName !== clean) {
            try { await fbUser.updateProfile({ displayName: clean }); }
            catch (e) { console.warn('Firebase displayName update failed:', e.message); }
        }

        // 2) Backend (Firestore users/{uid} + userProfiles/{uid})
        try {
            await api.put('/auth/profile', { name: clean, username: clean });
        } catch (e) {
            console.warn('Backend name update failed, will retry on sync:', e.message);
        }

        // 3) localStorage
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.name = clean;
        stored.username = clean;
        localStorage.setItem('user', JSON.stringify(stored));

        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        profile.name = clean;
        profile.username = clean;
        localStorage.setItem('userProfile', JSON.stringify(profile));

        return stored;
    },

    // ─── Logout ────────────────────────────────────────
    async logout() {
        if (window.firebase) {
            try { await window.firebase.auth().signOut(); } catch (_) { }
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },
};