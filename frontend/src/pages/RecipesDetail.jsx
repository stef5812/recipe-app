import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../lib/api";
import IngredientForm from "../components/IngredientForm";
import StepsEditor from "../components/StepsEditor";
import MediaForm from "../components/MediaForm";
import FeedbackForm from "../components/FeedbackForm";

function getTokenPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function RecipeDetail({ id }) {
  const [recipe, setRecipe] = useState(null);
  const [err, setErr] = useState("");

  const p = useMemo(() => getTokenPayload(), []);
  const tokenUserId = p?.userId != null ? String(p.userId) : null;
  const isAdmin = Boolean(p?.isAdmin);

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

  const recipeOwnerId = recipe?.user_id != null ? String(recipe.user_id) : null;
  const canEdit = Boolean(isAdmin || (tokenUserId && recipeOwnerId && tokenUserId === recipeOwnerId));

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!recipe) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>{recipe.name}</h2>

      {canEdit ? (
        <>
          <IngredientForm recipeId={id} onDone={load} />
          
          <MediaForm recipeId={id} onDone={load} />
        </>
      ) : (
        <p style={{ opacity: 0.8 }}>
          You can view this recipe, but only the creator (or an admin) can edit it.
        </p>
      )}

      <FeedbackForm recipeId={id} onDone={load} />

      {/* …keep your existing display below… */}
    </div>
  );
}
