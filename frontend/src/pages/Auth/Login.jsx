import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function Login() {
    const [sp] = useSearchParams();
    const [mode, setMode] = useState(
        sp.get("register") === "true" ? "register" : "login",
    );
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, register, loginWithGoogle } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "login") {
                await login(email, password);
                showToast("Login successful!", "success");
                navigate("/dashboard");
            } else {
                await register(email, password, username);
                showToast("Check your email to verify.", "success");
                setMode("login");
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const google = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate("/dashboard");
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <div className="logo">
                <div className="auth-logo">
                    <img src="/icon/Anipulse.png" alt="AniPulse" />
                </div>
                <p className="subtitle">Track. Analyze. Connect.</p>
            </div>

            <div style={{ textAlign: "center" }}>
                <span className="mode-badge">
                    {mode === "login" ? "Sign In" : "Sign Up"}
                </span>
            </div>

            <form onSubmit={submit}>
                {mode === "register" && (
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                            minLength={3}
                        />
                    </div>
                )}
                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <div className="password-wrapper">
                        <input
                            type={showPwd ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPwd((v) => !v)}
                        >
                            <i
                                className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"}`}
                            />
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn" disabled={loading}>
                    <i
                        className={`fas ${mode === "login" ? "fa-sign-in-alt" : "fa-user-plus"}`}
                    />{" "}
                    {loading
                        ? "Please wait..."
                        : mode === "login"
                          ? "Login"
                          : "Sign Up"}
                </button>
            </form>

            <div className="divider">
                <span>OR</span>
            </div>
            <button
                type="button"
                className="btn btn-google"
                onClick={google}
                disabled={loading}
            >
                <i className="fab fa-google" /> Sign in with Google
            </button>

            <div className="switch-mode">
                <span>
                    {mode === "login"
                        ? "Don't have an account?"
                        : "Already have an account?"}
                </span>{" "}
                <a
                    onClick={() =>
                        setMode(mode === "login" ? "register" : "login")
                    }
                    style={{ cursor: "pointer" }}
                >
                    {mode === "login" ? "Create one" : "Login"}
                </a>
            </div>
        </div>
    );
}
