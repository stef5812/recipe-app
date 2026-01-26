import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

import IngredientForm from "../components/IngredientForm";
import StepsEditor from "../components/StepsEditor";
import FeedbackForm from "../components/FeedbackForm";
import Section from "../components/Section";

import { getCategoryCover } from "../lib/categoryCover";


export default function RecipeDetail({ id, onBack }) {
  const [recipe, setRecipe] = useState(null);
  const [err, setErr] = useState("");

  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showEditSteps, setShowEditSteps] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [editIng, setEditIng] = useState({
    ingredient_name: "",
    amount: "",
    unit: "",
    note: "",
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";


  function getTokenPayload() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }
  

  const payload = getTokenPayload();

  const tokenUserId =
    payload?.userId != null ? String(payload.userId) :
    payload?.user_id != null ? String(payload.user_id) :
    payload?.sub != null ? String(payload.sub) :
    null;
  
  const isAdmin = Boolean(payload?.isAdmin);
  
  const recipeOwnerId = recipe?.user_id != null ? String(recipe.user_id) : null;
  const canEdit = Boolean(isAdmin || (tokenUserId && recipeOwnerId && tokenUserId === recipeOwnerId));
   
  

  function resolveSrc(url) {
    const raw = String(url ?? "").replaceAll("\\", "/");
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
    return raw;
  }

  const load = useCallback(async () => {
    setErr("");
    try {
      const data = await api(`/recipes/${id}`);
      setRecipe(data);
    } catch (e) {
      setErr(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadPrimaryImage(file) {
    if (!file) return;

    setUploadErr("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("media_type", "photo"); // backend normalizes to "image"
      fd.append("is_primary", "true"); // cover image

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/recipes/${id}/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      await load();
    } catch (e) {
      setUploadErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function uploadStepMedia(stepId, file, mediaType) {
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("media_type", mediaType); // "image" or "video"

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/recipes/steps/${stepId}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Step upload failed");

    await load();
  }

  function startEdit(i) {
    setEditErr("");
    setEditingIngredientId(String(i.id));
    setEditIng({
      ingredient_name: i.ingredient_name ?? "",
      amount: i.amount ?? "",
      unit: i.unit ?? "",
      note: i.note ?? "",
    });
  }

  async function removeIngredient(recipeId, ingredientId) {
    if (!confirm("Remove this ingredient?")) return;

    try {
      await api(`/recipes/${recipeId}/ingredients/${ingredientId}`, {
        method: "DELETE",
        auth: true,
      });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function saveEdit(recipeId, ingredientId) {
    setEditErr("");
    setEditBusy(true);

    try {
      const name = editIng.ingredient_name.trim();
      const amount = String(editIng.amount ?? "").trim();
      const unit = String(editIng.unit ?? "").trim();
      const note = String(editIng.note ?? "").trim();

      if (!name && !amount && !unit && !note) {
        setEditErr("Nothing to save.");
        return;
      }

      const body = {};
      if (name) body.ingredient_name = name;

      body.amount = amount === "" ? null : amount;
      body.unit = unit === "" ? null : unit;
      body.note = note === "" ? null : note;

      await api(`/recipes/${recipeId}/ingredients/${ingredientId}`, {
        method: "PATCH",
        auth: true,
        body,
      });

      setEditingIngredientId(null);
      await load();
    } catch (e) {
      setEditErr(e.message);
    } finally {
      setEditBusy(false);
    }
  }

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!recipe) return <p>Loading…</p>;

  const hasIngredients = (recipe?.recipe_ingredients?.length ?? 0) > 0;
  const hasSteps = (recipe?.recipe_steps?.length ?? 0) > 0;

  const primaryImage =
    recipe?.recipe_media?.find((m) => m.is_primary) ?? recipe?.recipe_media?.[0] ?? null;

  const fileBtnStyle = {
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    background: "#fff",
    display: "inline-block",
  };

  return (
    <div style={page.container}>

<button
  type="button"
  onClick={onBack}
  style={{
    marginBottom: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "6px 10px",
    background: "white",
    cursor: "pointer",
    fontSize: 13,
  }}
>
  ← Back to recipes
</button>

      
      <h2 style={page.title}>{recipe.name}</h2>

      

      {/* Cover image upload (recipe-level) */}
      {canEdit ? (
        <div style={{ margin: "12px 0" }}>
          <label style={fileBtnStyle}>
            🖼️ Change cover image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                uploadPrimaryImage(f);
                e.target.value = "";
              }}
            />
          </label>

          {uploading ? (
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>Uploading…</div>
          ) : null}

          {uploadErr ? (
            <div style={{ color: "crimson", fontSize: 13, marginTop: 6 }}>{uploadErr}</div>
          ) : null}
        </div>
      ) : null}

{/* Cover image display (or category fallback) */}
<div style={page.heroImageWrap}>
  <img
    src={
      primaryImage && primaryImage.media_type === "image"
        ? resolveSrc(primaryImage.url)
        : getCategoryCover(recipe.category)
    }
    alt={primaryImage?.caption || recipe.name}
    style={page.heroImage}
  />
  {primaryImage?.caption ? (
    <div style={page.heroCaption}>{primaryImage.caption}</div>
  ) : null}
</div>


      <div style={page.sections}>
        <Section title="Ingredients">
          {hasIngredients ? (
            <ul>
              {recipe.recipe_ingredients.map((i) => {
                const isEditing = editingIngredientId === String(i.id);

                return (
                  <li key={String(i.id)} style={{ marginBottom: 10 }}>
                    {!isEditing ? (
                      <>
                        <div>
                          <strong>{i.ingredient_name}</strong>
                          {i.amount != null ? ` — ${i.amount}` : ""}
                          {i.unit ? ` ${i.unit}` : ""}
                          {i.note ? ` (${i.note})` : ""}
                        </div>

                        {canEdit ? (
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button type="button" onClick={() => startEdit(i)}>
                              Edit
                            </button>

                            <button type="button" onClick={() => removeIngredient(id, i.id)}>
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : canEdit ? (
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }}>
                        <div style={{ display: "grid", gap: 8 }}>
                          <input
                            value={editIng.ingredient_name}
                            onChange={(e) =>
                              setEditIng((p) => ({ ...p, ingredient_name: e.target.value }))
                            }
                            placeholder="Ingredient name"
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              value={editIng.amount}
                              onChange={(e) => setEditIng((p) => ({ ...p, amount: e.target.value }))}
                              placeholder="Amount"
                              style={{ width: 120 }}
                            />
                            <input
                              value={editIng.unit}
                              onChange={(e) => setEditIng((p) => ({ ...p, unit: e.target.value }))}
                              placeholder="Unit"
                              style={{ width: 120 }}
                            />
                          </div>
                          <input
                            value={editIng.note}
                            onChange={(e) => setEditIng((p) => ({ ...p, note: e.target.value }))}
                            placeholder="Note (optional)"
                          />

                          {editErr ? <div style={{ color: "crimson" }}>{editErr}</div> : null}

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              disabled={editBusy}
                              onClick={() => saveEdit(id, i.id)}
                            >
                              {editBusy ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIngredientId(null);
                                setEditErr("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No ingredients yet.</p>
          )}

          {canEdit ? (
            <>
              <button type="button" onClick={() => setShowAddIngredient((v) => !v)}>
                {showAddIngredient ? "Hide ingredient form" : "Add more ingredients"}
              </button>

              {showAddIngredient || !hasIngredients ? (
                <IngredientForm recipeId={id} onDone={load} />
              ) : null}
            </>
          ) : null}
        </Section>

        <Section title="Steps">
          {hasSteps ? (
            <ol>
              {recipe.recipe_steps.map((s) => (
                <li key={String(s.id)} style={{ marginBottom: 16 }}>
                  <div>{s.instruction}</div>

                  {/* existing step media */}
                  {s.recipe_step_media?.length ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                      {s.recipe_step_media.map((m) =>
                        m.media_type === "image" ? (
                          <img
                            key={String(m.id)}
                            src={resolveSrc(m.url)}
                            alt={m.caption || "Step image"}
                            style={{
                              width: 180,
                              height: 110,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                            }}
                          />
                        ) : (
                          <video
                            key={String(m.id)}
                            src={resolveSrc(m.url)}
                            controls
                            style={{
                              width: 220,
                              height: 140,
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                            }}
                          />
                        )
                      )}
                    </div>
                  ) : null}

                  {/* upload buttons per step (only one set) */}
                  {canEdit && !showEditSteps ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <label style={fileBtnStyle}>
                          📷 Add image
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                await uploadStepMedia(s.id, f, "image");
                              } catch (err) {
                                alert(err.message);
                              } finally {
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>

                        <label style={fileBtnStyle}>
                          🎥 Add video
                          <input
                            type="file"
                            accept="video/*"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                await uploadStepMedia(s.id, f, "video");
                              } catch (err) {
                                alert(err.message);
                              } finally {
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p>No steps yet.</p>
          )}

          {canEdit ? (
            <>
              <button type="button" onClick={() => setShowEditSteps((v) => !v)}>
                {showEditSteps ? "Hide steps editor" : hasSteps ? "Edit steps" : "Add steps"}
              </button>

              {showEditSteps || !hasSteps ? (
                <StepsEditor
                  recipeId={id}
                  initialSteps={recipe.recipe_steps}
                  onSaved={() => {
                    load();
                    setShowEditSteps(false);
                  }}
                />
              ) : null}
            </>
          ) : null}
        </Section>

        <Section title="Feedback">
          {recipe.recipe_feedback?.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {recipe.recipe_feedback.map((f) => (
                <div key={String(f.id)}>
                  ⭐ {f.rating} {f.comment ? `— ${f.comment}` : ""}
                </div>
              ))}
            </div>
          ) : (
            <p>No feedback yet.</p>
          )}

          <button type="button" onClick={() => setShowFeedbackForm((v) => !v)}>
            {showFeedbackForm ? "Hide feedback form" : "Leave feedback"}
          </button>

          {showFeedbackForm ? (
            <FeedbackForm
              recipeId={id}
              onDone={() => {
                load();
                setShowFeedbackForm(false);
              }}
            />
          ) : null}
        </Section>
      </div>
    </div>
  );
}

const page = {
  container: {
    maxWidth: 1100,
    margin: "40px auto",
    padding: "0 16px",
  },
  title: {
    margin: "0 0 16px",
  },
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  heroImageWrap: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  heroImage: {
    width: "100%",
    maxHeight: 420,
    objectFit: "cover",
    display: "block",
  },
  heroCaption: {
    padding: "8px 12px",
    fontSize: 13,
    opacity: 0.75,
    background: "white",
    borderTop: "1px solid #e5e7eb",
  },
};
