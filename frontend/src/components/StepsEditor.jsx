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
      .map((s) => s.instruction);
  }, [initialSteps]);

  const [steps, setSteps] = useState(initial);
  const [newStep, setNewStep] = useState("");

  // NEW: inline edit state
  const [editingIndex, setEditingIndex] = useState(null); // number | null
  const [editingText, setEditingText] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // When recipe reloads, refresh editor list
  useEffect(() => {
    setSteps(initial);
    setEditingIndex(null);
    setEditingText("");
  }, [id, initial]);

  function add() {
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
    setEditingIndex(idx);
    setEditingText(steps[idx] ?? "");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingText("");
  }

  function applyEdit() {
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

    // If they’re currently editing, apply it first (so they don’t lose changes)
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
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, margin: "16px 0" }}>
      <div style={styles.heroWrap}>
        <img
          src="https://www.tastingtable.com/img/gallery/beating-whisking-and-folding-how-these-techniques-result-in-different-textures-for-your-cake/intro-1759939960.jpg"
          alt="Busy kitchen"
          style={styles.heroImage}
        />
      </div>

      <h3>Steps</h3>

      <ol style={{ paddingLeft: 18 }}>
        {steps.map((s, idx) => {
          const isEditing = editingIndex === idx;

          return (
            <li key={idx} style={{ marginBottom: 10 }}>
              {!isEditing ? (
                <>
                  <div style={{ whiteSpace: "pre-wrap" }}>{s}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button type="button" onClick={() => startEdit(idx)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(idx)}>
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }}>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={4}
                    style={{ width: "100%", resize: "vertical" }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={applyEdit}>
                      Save change
                    </button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="New step…"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          style={{ width: "70%" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <button type="button" onClick={add} style={{ marginLeft: 8 }}>
          Add step
        </button>

        <button type="button" onClick={save} disabled={busy} style={{ marginLeft: 8 }}>
          {busy ? "Saving…" : "Save & finish"}
        </button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
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
};
