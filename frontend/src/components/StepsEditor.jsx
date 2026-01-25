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
    if (!id) {
      setErr("Missing recipe id.");
      return;
    }

    setBusy(true);
    try {
      await api(`/recipes/${id}/steps`, {
        method: "POST",
        auth: true,
        body: { steps },
      });

      // 1) Let parent refresh/hide editor if it wants
      onSaved?.(id);

      // 2) Let wizard/state-driven parent jump to detail
      onFinish?.(id);

      // 3) Router fallback: go to recipe detail route if you have one
      // If your route is different, change this path.
      try {
        navigate(`/recipes/${id}`);
      } catch {
        // ignore if navigation isn't available in current setup
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

      <ol>
        {steps.map((s, idx) => (
          <li key={idx}>
            {s}{" "}
            <button type="button" onClick={() => remove(idx)}>
              Remove
            </button>
          </li>
        ))}
      </ol>

      <div>
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
