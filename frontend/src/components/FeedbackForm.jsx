// frontend/src/components/FeedbackForm.jsx

import { useState } from "react";
import { api } from "../lib/api";

export default function FeedbackForm({ recipeId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      await api(`/recipes/${recipeId}/feedback`, {
        method: "POST",
        auth: true,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: Number(rating),
          comment: comment.trim() || null,
        }),
      });

      await onDone?.();
    } catch (e) {
      setErr(e.message || "Could not save feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, margin: "16px 0" }}>
      <h3>Your feedback</h3>
      <form onSubmit={submit}>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <input
          placeholder="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ marginLeft: 8, width: "60%" }}
        />

        <button disabled={busy} style={{ marginLeft: 8 }}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}