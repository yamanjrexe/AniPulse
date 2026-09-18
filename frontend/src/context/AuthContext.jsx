import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { authService } from "../services/authService.js";
import { firebase, initFirebase } from "../firebaseClient.js";

const AuthContext = createContext(null);

function readCachedUser() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u) return null;
    if (!u.uid) {
      u.uid = u.userId || u.id || localStorage.getItem("uid") || null;
    }
    return u;
  } catch {
    return null;
  }
}

function hasCachedAuth() {
  return !!(localStorage.getItem("authToken") && readCachedUser());
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [initialized, setInitialized] = useState(hasCachedAuth);
  const [loading, setLoading] = useState(false);
  const refreshTimer = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await initFirebase();
      if (cancelled) return;

      unsubRef.current = authService.onAuthStateChanged(async (fbUser) => {
        if (cancelled) return;

        if (fbUser) {
          const cached = readCachedUser();
          if (cached?.uid === fbUser.uid && cached?.name) {
            setUser(cached);
            setInitialized(true);
          } else {
            try {
              const data = await authService.fetchProfile(fbUser);
              const withUid = {
                ...data,
                uid: data?.uid || fbUser.uid,
              };
              localStorage.setItem("user", JSON.stringify(withUid, null, 2));
              setUser(withUid);
            } catch (_) {
              setUser(cached || { uid: fbUser.uid });
            }
            setInitialized(true);
          }

          if (refreshTimer.current) clearInterval(refreshTimer.current);
          refreshTimer.current = setInterval(
            async () => {
              try {
                const t = await fbUser.getIdToken(true);
                localStorage.setItem("authToken", t);
              } catch (_) {}
            },
            10 * 60 * 1000,
          );
        } else {
          setUser(null);
          setInitialized(true);
          if (refreshTimer.current) {
            clearInterval(refreshTimer.current);
            refreshTimer.current = null;
          }
        }
      });
    })();

    const fallback = setTimeout(() => {
      setInitialized((v) => v || hasCachedAuth() || true);
    }, 5000);

    return () => {
      cancelled = true;
      if (unsubRef.current) unsubRef.current();
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      try {
        const fresh = readCachedUser();
        if (fresh) setUser(fresh);
      } catch (err) {
        console.warn("[AuthContext] Refresh failed:", err);
      }
    };
    window.addEventListener("uiRefresh", handler);
    return () => window.removeEventListener("uiRefresh", handler);
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("userLogout", onLogout);
    return () => window.removeEventListener("userLogout", onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const p = await authService.login(email, password);
      const withUid = { ...p, uid: p?.uid || p?.userId };
      localStorage.setItem("user", JSON.stringify(withUid, null, 2));
      setUser(withUid);
      setInitialized(true);
      return withUid;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, username) => {
    setLoading(true);
    try {
      return await authService.register(email, password, username);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const p = await authService.loginWithGoogle();
      const withUid = { ...p, uid: p?.uid || p?.userId };
      localStorage.setItem("user", JSON.stringify(withUid, null, 2));
      setUser(withUid);
      setInitialized(true);
      return withUid;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem("user", JSON.stringify(next, null, 2));
      return next;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = readCachedUser();
    if (fresh) setUser(fresh);
    return fresh;
  }, []);

  const updateDisplayName = useCallback(async (newName) => {
    const updated = await authService.updateDisplayName(newName);
    setUser((prev) => ({
      ...(prev || {}),
      name: updated.name,
      username: updated.username,
    }));
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: updateUser,
        initialized,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
