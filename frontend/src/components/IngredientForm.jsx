// src/components/IngredientForm.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useParams, useNavigate } from "react-router-dom";

export default function IngredientForm({ recipeId, onAdded, onNext }) {
  const params = useParams();
  const id = String(recipeId ?? params.id ?? "");

  // Add form
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");

  const navigate = useNavigate();


  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // List
  const [loadingList, setLoadingList] = useState(false);
  const [ingredients, setIngredients] = useState([]);

  const [stageNumber, setStageNumber] = useState(1);
  const [stageName, setStageName] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editIng, setEditIng] = useState({
    ingredient_name: "",
    amount: "",
    unit: "",
    note: "",
    stage_number: 1,
    stage_name: "",    
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState("");

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (amount === "") return true;
    return !Number.isNaN(Number(amount));
  }, [name, amount]);

  async function loadIngredients() {
    if (!id) return;
    setLoadingList(true);
    try {
      const recipe = await api(`/recipes/${id}`, { auth: true });
      const list =
        recipe?.ingredients ??
        recipe?.recipe?.ingredients ??
        recipe?.recipe_ingredients ??
        [];
      setIngredients(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("Failed to load ingredients", e);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!id) {
      setError("Missing recipe id.");
      return;
    }
    if (!canSubmit) {
      setError("Please enter a name (and a valid amount if provided).");
      return;
    }

    setSubmitting(true);

    const prev = { name, amount, unit, note };

    setName("");
    setAmount("");
    setUnit("");
    setNote("");

    try {
      const payload = {
        ingredient_name: prev.name.trim(),
        amount:
          prev.amount.trim() === ""
            ? null
            : Number(prev.amount.replace(",", ".").trim()),
        unit: prev.unit.trim() || null,
        note: prev.note.trim() || null,

        stage_number: stageNumber || 1,
        stage_name: stageName.trim() || null,        
      };

      await api(`/recipes/${id}/ingredients`, {
        method: "POST",
        body: payload,
        auth: true,
      });

      await loadIngredients();
      onAdded?.();
    } catch (err) {
      setName(prev.name);
      setAmount(prev.amount);
      setUnit(prev.unit);
      setNote(prev.note);
      setError(err?.message || "Failed to add ingredient.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatIngredient(i) {
    const n = i.ingredient_name ?? i.name ?? "";
    const a = i.amount ?? "";
    const u = i.unit ?? "";
    const no = i.note ?? "";
    const qty = [a, u].filter(Boolean).join(" ");
    return `${n}${qty ? ` — ${qty}` : ""}${no ? ` (${no})` : ""}`;
  }

  function startEdit(i) {
    setEditErr("");
    setEditingId(String(i.id));
    setEditIng({
      ingredient_name: i.ingredient_name ?? "",
      amount: i.amount ?? "",
      unit: i.unit ?? "",
      note: i.note ?? "",
      stage_number: i.stage_number ?? 1,
      stage_name: i.stage_name ?? "",      
    });
  }

  async function saveEdit(ingredientId) {
    setEditErr("");
    setEditBusy(true);
  
    try {
      const name = String(editIng.ingredient_name ?? "").trim();
      const amountStr = String(editIng.amount ?? "").trim();
      const unit = String(editIng.unit ?? "").trim();
      const note = String(editIng.note ?? "").trim();
  
      const stageNumRaw = String(editIng.stage_number ?? "").trim();
      const stageNum = stageNumRaw === "" ? null : Number(stageNumRaw);
  
      const stageName = String(editIng.stage_name ?? "").trim();
  
      // ✅ If EVERYTHING is empty (including stage fields), don’t PATCH
      const nothing =
        !name &&
        amountStr === "" &&
        unit === "" &&
        note === "" &&
        (stageNumRaw === "" || stageNum === null) &&
        stageName === "";
  
      if (nothing) {
        setEditErr("Nothing to save.");
        return;
      }
  
      // ✅ Build PATCH body
      const body = {};
  
      if (name) body.ingredient_name = name;
  
      // allow clearing:
      body.amount = amountStr === "" ? null : amountStr;
      body.unit = unit === "" ? null : unit;
      body.note = note === "" ? null : note;
  
      // stage fields:
      if (stageNum !== null && Number.isFinite(stageNum) && stageNum >= 1) {
        body.stage_number = stageNum;
      }
      body.stage_name = stageName === "" ? null : stageName;
  
      await api(`/recipes/${id}/ingredients/${ingredientId}`, {
        method: "PATCH",
        auth: true,
        body,
      });
  
      setEditingId(null);
      await loadIngredients();
    } catch (e) {
      setEditErr(e.message);
    } finally {
      setEditBusy(false);
    }
  }
  

  async function removeIngredient(ingredientId) {
    if (!confirm("Remove this ingredient?")) return;

    try {
      await api(`/recipes/${id}/ingredients/${ingredientId}`, {
        method: "DELETE",
        auth: true,
      });
      await loadIngredients();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <>
      <div style={styles.heroWrap}>
        <img
          src="https://cdn.mos.cms.futurecdn.net/5GgDz23GhZn2corq5f5Mz5.jpg"
          alt="Harvesting fresh ingredients"
          style={styles.heroImage}
        />
        
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Add ingredient</h3>

        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.rowGrid}>
          <label style={styles.label}>
            Stage #
            <input
              style={styles.input}
              value={stageNumber}
              onChange={(e) => setStageNumber(Number(e.target.value || 1))}
              inputMode="numeric"
              disabled={submitting}
            />
          </label>

          <label style={styles.label}>
            Stage name (optional)
            <input
              style={styles.input}
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. Cake mix"
              disabled={submitting}
            />
          </label>
        </div>

          <div style={styles.row}>
            <label style={styles.label}>
              Name *
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spaghetti"
                disabled={submitting}
              />
            </label>
          </div>

          <div style={styles.rowGrid}>
            <label style={styles.label}>
              Amount
              <input
                style={styles.input}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 200"
                inputMode="decimal"
                disabled={submitting}
              />
            </label>

            <label style={styles.label}>
              Unit
              <input
                style={styles.input}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. g"
                disabled={submitting}
              />
            </label>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>
              Note
              <input
                style={styles.input}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. dry"
                disabled={submitting}
              />
            </label>
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          <div style={styles.actions}>
            <button type="submit" disabled={submitting} style={styles.primaryBtn}>
              {submitting ? "Adding..." : "Add ingredient"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/recipes/${id}/steps`)}
              disabled={!id}
              style={styles.secondaryBtn}
              title={!id ? "Missing recipe id" : "Continue to steps"}
            >
              Next: add steps
            </button>

          </div>
        </form>

        {/* List (with edit) */}
        <div style={styles.listWrap}>
          <div style={styles.listTitle}>Ingredients</div>

          {loadingList ? (
            <div style={styles.muted}>Loading…</div>
          ) : ingredients.length === 0 ? (
            <div style={styles.muted}>No ingredients yet. Add the first one above.</div>
          ) : (
            <ul style={styles.list}>
              {ingredients.map((i, idx) => {
                const isEditing = editingId === String(i.id);

                return (
                  <li
                    key={i.id ?? `${i.ingredient_name ?? i.name}-${idx}`}
                    style={styles.listItemRow}
                  >
                    {!isEditing ? (
                      <>
                        <div style={{ flex: 1 }}>{formatIngredient(i)}</div>

                        <div style={styles.smallActions}>
                          <button type="button" onClick={() => startEdit(i)} style={styles.miniBtn}>
                            Edit
                          </button>

                          {/* Optional: remove (delete if you have that route) */}
                          <button
                            type="button"
                            onClick={() => removeIngredient(i.id)}
                            style={styles.miniBtn}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={styles.editBox}>
                        <div style={styles.editGrid}>
                          <input
                            style={styles.input}
                            value={editIng.ingredient_name}
                            onChange={(e) =>
                              setEditIng((p) => ({ ...p, ingredient_name: e.target.value }))
                            }
                            placeholder="Ingredient name"
                          />

<div style={styles.rowGrid}>
  <input
    style={styles.input}
    value={editIng.stage_number ?? 1}
    onChange={(e) =>
      setEditIng((p) => ({ ...p, stage_number: e.target.value }))
    }
    placeholder="Stage #"
    inputMode="numeric"
  />

  <input
    style={styles.input}
    value={editIng.stage_name ?? ""}
    onChange={(e) =>
      setEditIng((p) => ({ ...p, stage_name: e.target.value }))
    }
    placeholder="Stage name (optional)"
  />
</div>


                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              style={{ ...styles.input, width: 120 }}
                              value={editIng.amount}
                              onChange={(e) =>
                                setEditIng((p) => ({ ...p, amount: e.target.value }))
                              }
                              placeholder="Amount"
                            />
                            <input
                              style={{ ...styles.input, width: 120 }}
                              value={editIng.unit}
                              onChange={(e) => setEditIng((p) => ({ ...p, unit: e.target.value }))}
                              placeholder="Unit"
                            />
                          </div>
                          <input
                            style={styles.input}
                            value={editIng.note}
                            onChange={(e) => setEditIng((p) => ({ ...p, note: e.target.value }))}
                            placeholder="Note (optional)"
                          />

                          {editErr ? <div style={{ color: "crimson" }}>{editErr}</div> : null}

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              disabled={editBusy}
                              onClick={() => saveEdit(i.id)}
                              style={styles.miniPrimary}
                            >
                              {editBusy ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditErr("");
                              }}
                              style={styles.miniBtn}
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
            </ul>
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
  heroCaption: {
    padding: "8px 12px",
    fontSize: 13,
    opacity: 0.8,
    background: "white",
    borderTop: "1px solid #e5e7eb",
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
  rowGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
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

  list: { margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 },
  listItemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
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
  },

  editBox: { width: "100%" },
  editGrid: { display: "grid", gap: 8, width: "100%" },
};
