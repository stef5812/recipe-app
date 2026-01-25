import { useState } from "react";
import { api } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

export default function MediaForm({ recipeId, onDone }) {
  const [mode, setMode] = useState("file"); // "file" | "url"

  const [media_type, setType] = useState("photo"); // photo|image|video
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [is_primary, setPrimary] = useState(false);

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      if (mode === "file") {
        if (!file) throw new Error("Please choose a file.");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing token. Please log in again.");

        const form = new FormData();
        form.append("file", file);
        form.append("media_type", media_type);
        form.append("caption", caption.trim());
        form.append("is_primary", String(is_primary));

        const res = await fetch(`${API_BASE}/recipes/${recipeId}/media/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type manually with FormData
          },
          body: form,
        });

        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!res.ok) {
          const msg = data?.error || data?.message || `HTTP ${res.status}`;
          throw new Error(msg);
        }
      } else {
        // URL mode (existing JSON endpoint)
        if (!url.trim()) throw new Error("Please paste a URL.");

        await api(`/recipes/${recipeId}/media`, {
          method: "POST",
          auth: true,
          body: {
            media_type,
            url: url.trim(),
            caption: caption.trim() || null,
            is_primary,
          },
        });
      }

      // reset + refresh
      setFile(null);
      setUrl("");
      setCaption("");
      setPrimary(false);
      await onDone?.();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, margin: "16px 0" }}>
      <h3>Add recipe media</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button type="button" disabled={busy} onClick={() => setMode("file")}>
          Upload file
        </button>
        <button type="button" disabled={busy} onClick={() => setMode("url")}>
          Use URL
        </button>
      </div>

      <form onSubmit={submit}>
        <select value={media_type} onChange={(e) => setType(e.target.value)} disabled={busy}>
          <option value="photo">Photo</option>
          <option value="image">Image (explicit)</option>
          <option value="video">Video</option>
        </select>

        {mode === "file" ? (
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ marginLeft: 8 }}
          />
        ) : (
          <input
            placeholder="https://..."
            value={url}
            disabled={busy}
            onChange={(e) => setUrl(e.target.value)}
            style={{ marginLeft: 8, width: "55%" }}
          />
        )}

        <input
          placeholder="caption"
          value={caption}
          disabled={busy}
          onChange={(e) => setCaption(e.target.value)}
          style={{ marginLeft: 8 }}
        />

        <label style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={is_primary}
            disabled={busy}
            onChange={(e) => setPrimary(e.target.checked)}
          />
          Primary
        </label>

        <button disabled={busy} style={{ marginLeft: 8 }}>
          {busy ? "Saving…" : "Add"}
        </button>
      </form>

      {file ? (
        <p style={{ fontSize: 12, opacity: 0.8 }}>Selected: {file.name}</p>
      ) : null}

      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
