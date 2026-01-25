import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import IngredientForm from "../components/IngredientForm";
import StepsEditor from "../components/StepsEditor";
import MediaForm from "../components/MediaForm";
import FeedbackForm from "../components/FeedbackForm";

export default function RecipeDetail({ id }) {
  const [recipe, setRecipe] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const data = await api(`/recipes/${id}`);
      setRecipe(data);
    } catch (e) {
      setErr(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!recipe) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>{recipe.name}</h2>

      <IngredientForm recipeId={id} onDone={load} />
      <StepsEditor recipeId={id} initialSteps={recipe.recipe_steps ?? []} onDone={load} />
      <MediaForm recipeId={id} onDone={load} />
      <FeedbackForm recipeId={id} onDone={load} />

      {/* …keep your existing display below… */}
    </div>
  );
}
