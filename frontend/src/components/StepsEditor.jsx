import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useParams, useNavigate } from "react-router-dom";
import PageContainer from "./PageContainer";
import Section from "./Section";

export default function StepsEditor({ recipeId, initialSteps, onSaved, onFinish, onBack }) {
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
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // When recipe reloads, refresh editor list
  useEffect(() => {
    setSteps(initial);
  }, [id, initial]);

  function add() {
    const s = newStep.trim();
    if (!s) return;
    setSteps((prev) => [...prev, s]);
    setNewStep("");
  }

  function remove(idx) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setErr("");
    if (!id) return setErr("Missing recipe id.");

    setBusy(true);
    try {
      await api(`/recipes/${id}/steps`, {
        method: "POST",
        auth: true,
        body: { steps },
      });

      onSaved?.(id);
      onFinish?.(id);

      // fallback
      try {
        navigate(`/recipes/${id}`);
      } catch {}
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer title="Steps">
      {onBack ? (
        <button type="button" onClick={onBack} style={ui.backBtn}>
          ← Back
        </button>
      ) : null}

      <Section title="Add steps">
        <div style={ui.list}>
          {steps.length ? (
            <ol style={ui.ol}>
              {steps.map((s, idx) => (
                <li key={idx} style={ui.stepRow}>
                  <div style={ui.stepText}>{s}</div>
                  <button type="button" onClick={() => remove(idx)} style={ui.ghostBtn}>
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ opacity: 0.7, margin: 0 }}>No steps yet. Add your first step below.</p>
          )}
        </div>

        <div style={ui.addRow}>
          <input
            placeholder="New step…"
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            style={ui.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
          />
          <button type="button" onClick={add} style={ui.btn}>
            Add step
          </button>

          <button type="button" onClick={save} disabled={busy} style={ui.primaryBtn}>
            {busy ? "Saving…" : "Save & finish"}
          </button>
        </div>

        {err ? <div style={ui.error}>{err}</div> : null}
      </Section>
    </PageContainer>
  );
}

const ui = {
  backBtn: {
    marginBottom: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },

  list: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 12,
    background: "#fafafa",
    marginBottom: 12,
  },

  ol: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 10,
  },

  stepRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "10px 10px",
    borderRadius: 12,
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },

  stepText: {
    flex: 1,
    lineHeight: 1.35,
    fontSize: 14,
    opacity: 0.92,
  },

  addRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  input: {
    flex: "1 1 360px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    background: "white",
  },

  btn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 700,
  },

  primaryBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 800,
    opacity: 0.95,
  },

  ghostBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "6px 10px",
    background: "white",
    cursor: "pointer",
    opacity: 0.9,
    whiteSpace: "nowrap",
  },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },
};
