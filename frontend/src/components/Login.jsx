import { useState } from "react";
import { api } from "../lib/api";
import loginChef from "../assets/login-chef.png";


export default function Login({ onDone }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const login = {
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
  
    /* 👇 THIS IS THE BIT YOU WERE LOOKING FOR */
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
  };
  
  

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { username, password },
      });

      // adjust if your backend returns a different key name
      localStorage.setItem("token", data.token);

      onDone?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <div style={login.hero}>
        <img
          src={loginChef}
          alt=""
          aria-hidden="true"
          style={login.heroImg}
        />
        <h1 style={login.title}>Login</h1>
    </div>

      <form onSubmit={submit}>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={login.input}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={login.input}
      />

        <button
          type="submit"
          disabled={busy}
          style={{
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
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          {busy ? "Logging in…" : "Log in"}
        </button>

      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
