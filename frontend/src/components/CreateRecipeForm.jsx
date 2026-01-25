import { useState } from "react";
import { api } from "../lib/api";

export default function CreateRecipeForm({ onCreated }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Name is required");
      return;
    }

    setBusy(true);
    try {
      const recipe = await api("/recipes", {
        method: "POST",
        auth: true,
        body: {
          name: name.trim(),
          source: source.trim() || null,
          description: description.trim() || null,
        },
      });

      setName("");
      setSource("");
      setDescription("");

      onCreated?.(recipe);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Create recipe</h3>

      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Recipe name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Source (optional) e.g. website/book"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <button disabled={busy}>
          {busy ? "Creating…" : "Create"}
        </button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
