import { useState } from "react";
import { api } from "../lib/api";
import RegisterChef from "../assets/register.png";

export default function Register({ onDone, onGoLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const ui = {
    hero: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: 24,
      gap: 10,
    },
    heroImg: {
      width: 140,
      height: "auto",
      filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.18))",
    },
    title: {
      margin: 0,
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: -0.3,
    },
    input: {
      width: "100%",
      padding: "14px 14px",
      marginBottom: 10,
      borderRadius: 14,
      border: "1px solid #d1d5db",
      fontSize: 16,
      outline: "none",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
    },
    primaryBtn: (busy) => ({
      width: "100%",
      padding: "12px 16px",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.10)",
      background: busy
        ? "linear-gradient(180deg, #374151 0%, #111827 100%)"
        : "linear-gradient(180deg, #111827 0%, #000000 100%)",
      color: "white",
      fontWeight: 800,
      fontSize: 15,
      letterSpacing: -0.2,
      cursor: busy ? "wait" : "pointer",
      boxShadow: busy
        ? "none"
        : "0 4px 10px rgba(0,0,0,0.25), 0 14px 26px rgba(0,0,0,0.18)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease",
    }),
    linkBtn: {
      marginTop: 10,
      width: "100%",
      padding: "10px 14px",
      borderRadius: 14,
      border: "1px solid #d1d5db",
      background: "white",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 700,
    },
    smallNote: { marginTop: 10, fontSize: 13, opacity: 0.75, textAlign: "center" },
  };

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!username.trim()) return setErr("Please enter a username.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setBusy(true);
    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: { username, password },
      });

      // If your backend returns a token on register, keep this:
      if (data?.token) localStorage.setItem("token", data.token);

      onDone?.();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <div style={ui.hero}>
        <img src={RegisterChef} alt="" aria-hidden="true" style={ui.heroImg} />
        <h1 style={ui.title}>Register</h1>
      </div>

      <form onSubmit={submit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={ui.input}
          autoComplete="username"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={ui.input}
          autoComplete="new-password"
        />

        <input
          placeholder="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={ui.input}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={busy}
          style={ui.primaryBtn(busy)}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <button type="button" style={ui.linkBtn} onClick={onGoLogin}>
        Back to login
      </button>

      {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}

      <div style={ui.smallNote}>
        Tip: use a password you’ll remember (min 6 characters).
      </div>
    </div>
  );
}
