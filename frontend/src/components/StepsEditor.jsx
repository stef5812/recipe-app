// src/components/StepsEditor.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useParams, useNavigate } from "react-router-dom";

export default function StepsEditor({ recipeId, initialSteps, onSaved, onFinish }) {
  const params = useParams();
  const navigate = useNavigate();

  const id = String(recipeId ?? params.id ?? "");

  // Convert [{step_number, instruction}] to array of strings
  const initial = useMemo(() => {
    return (initialSteps || [])
      .slice()
      .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
      .map((s) => s.instruction ?? "");
  }, [initialSteps]);

  const [steps, setSteps] = useState(initial);
  const [newStep, setNewStep] = useState("");

  // Inline edit
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSteps(initial);
    setEditingIndex(null);
    setEditingText("");
  }, [id, initial]);

  function add() {
    setErr("");
    const s = newStep.trim();
    if (!s) return;
    setSteps((prev) => [...prev, s]);
    setNewStep("");
  }

  function remove(idx) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
      setEditingText("");
    }
  }

  function startEdit(idx) {
    setErr("");
    setEditingIndex(idx);
    setEditingText(steps[idx] ?? "");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingText("");
  }

  function applyEdit() {
    setErr("");
    const trimmed = editingText.trim();
    if (!trimmed) {
      setErr("Step cannot be empty.");
      return;
    }
    setSteps((prev) => prev.map((s, i) => (i === editingIndex ? trimmed : s)));
    setEditingIndex(null);
    setEditingText("");
  }

  async function save() {
    setErr("");
    if (!id) {
      setErr("Missing recipe id.");
      return;
    }

    // If currently editing, apply first
    if (editingIndex !== null) {
      const trimmed = editingText.trim();
      if (!trimmed) {
        setErr("Step cannot be empty.");
        return;
      }
      setSteps((prev) => prev.map((s, i) => (i === editingIndex ? trimmed : s)));
      setEditingIndex(null);
      setEditingText("");
    }

    setBusy(true);
    try {
      await api(`/recipes/${id}/steps`, {
        method: "POST",
        auth: true,
        body: { steps },
      });

      onSaved?.(id);
      onFinish?.(id);

      try {
        navigate(`/recipes/${id}`);
      } catch {
        // ignore
      }
    } catch (e) {
      setErr(e.message || "Failed to save steps.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={styles.heroWrap}>
        <img
          src="https://www.tastingtable.com/img/gallery/beating-whisking-and-folding-how-these-techniques-result-in-different-textures-for-your-cake/intro-1759939960.jpg"
          alt="Busy kitchen"
          style={styles.heroImage}
        />
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Steps</h3>

        {/* Add new step */}
        <div style={styles.form}>
          <div style={styles.row}>
            <label style={styles.label}>
              New step
              <textarea
                style={styles.textarea}
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="e.g. Preheat oven to 180°C…"
                rows={3}
                disabled={busy}
              />
            </label>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={add}
              disabled={busy || !newStep.trim()}
              style={styles.secondaryBtn}
              title={!newStep.trim() ? "Type a step first" : "Add step"}
            >
              Add step
            </button>

            <button
              type="button"
              onClick={save}
              disabled={busy}
              style={styles.primaryBtn}
            >
              {busy ? "Saving…" : "Save & finish"}
            </button>
          </div>

          {err ? <div style={styles.error}>{err}</div> : null}
        </div>

        {/* Steps list */}
        <div style={styles.listWrap}>
          <div style={styles.listTitle}>Current steps</div>

          {steps.length === 0 ? (
            <div style={styles.muted}>No steps yet. Add the first one above.</div>
          ) : (
            <ol style={styles.olist}>
              {steps.map((s, idx) => {
                const isEditing = editingIndex === idx;

                return (
                  <li key={idx} style={styles.listItemRow}>
                    {!isEditing ? (
                      <>
                        <div style={{ flex: 1, whiteSpace: "pre-wrap" }}>
                          <div style={styles.stepNumber}>Step {idx + 1}</div>
                          {s}
                        </div>

                        <div style={styles.smallActions}>
                          <button
                            type="button"
                            onClick={() => startEdit(idx)}
                            style={styles.miniBtn}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            style={styles.miniBtn}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={styles.editBox}>
                        <div style={styles.editGrid}>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={4}
                            style={styles.textarea}
                            autoFocus
                            disabled={busy}
                          />

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={applyEdit}
                              disabled={busy}
                              style={styles.miniPrimary}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              style={styles.miniBtn}
                              disabled={busy}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  heroWrap: {
    maxWidth: 1100,
    margin: "20px auto 14px",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  heroImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
  },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "white",
    maxWidth: 1100,
    margin: "0 auto",
  },
  title: { margin: "0 0 12px", fontSize: 16 },

  form: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", gap: 12 },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
    fontSize: 12,
    color: "#374151",
  },

  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 14,
  },

  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 14,
    resize: "vertical",
    minHeight: 70,
  },

  actions: { display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },

  error: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },

  listWrap: { marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 12 },
  listTitle: { fontSize: 13, fontWeight: 800, marginBottom: 8 },
  muted: { fontSize: 13, opacity: 0.75 },

  // ordered list, but styled like your ingredient list
  olist: {
    margin: 0,
    paddingLeft: 0,
    listStyle: "none",
    display: "grid",
    gap: 10,
  },

  listItemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
  },

  stepNumber: {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.75,
    marginBottom: 4,
  },

  smallActions: { display: "flex", gap: 8 },

  miniBtn: {
    border: "1px solid #d1d5db",
    background: "white",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    height: 34,
  },
  miniPrimary: {
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
    height: 34,
  },

  editBox: { width: "100%" },
  editGrid: { display: "grid", gap: 8, width: "100%" },
};
