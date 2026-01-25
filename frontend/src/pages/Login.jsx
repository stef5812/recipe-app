import { useState } from "react";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function Login({ onDone }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      // adjust this key if your backend returns token under a different name
      setToken(data.token);
      onDone?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
        <br />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <br />
        <button type="submit">Login</button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
