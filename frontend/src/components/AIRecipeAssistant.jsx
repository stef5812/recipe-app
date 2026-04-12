// frontend/src/components/AIRecipeAssistant.jsx

import { useEffect, useMemo, useState } from "react";
import { api, generateRecipe, improveRecipe } from "../lib/api";

const emptyRecipe = {
  title: "",
  ingredients: [],
  steps: [],
};

function recipeToText(recipe) {
  const ingredients = recipe.ingredients.map((item) => `- ${item}`).join("\n");
  const steps = recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  return `${recipe.title}\n\nIngredients:\n${ingredients}\n\nSteps:\n${steps}`;
}

function buildRecipeTextFromDbRecipe(recipe) {
  if (!recipe) return "";

  const ingredients = Array.isArray(recipe.recipe_ingredients)
    ? recipe.recipe_ingredients.map((item) => {
        const amount = item.amount ? `${item.amount}` : "";
        const unit = item.unit ? ` ${item.unit}` : "";
        const note = item.note ? ` (${item.note})` : "";
        return `- ${item.ingredient_name}${amount || unit || note ? ` — ${amount}${unit}${note}` : ""}`;
      })
    : [];

  const steps = Array.isArray(recipe.recipe_steps)
    ? recipe.recipe_steps.map((step, index) => `${index + 1}. ${step.instruction}`)
    : [];

  return `${recipe.name || "Recipe"}\n\nIngredients:\n${ingredients.join("\n")}\n\nSteps:\n${steps.join("\n")}`;
}

export default function AIRecipeAssistant({
  onInsert,
  initialMode = "generate",
  initialPrompt = "",
  initialRecipeText = "",
  insertLabel = "Insert into app",
}) {
  const [mode, setMode] = useState(initialMode);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [recipeText, setRecipeText] = useState(initialRecipeText);
  const [dietary, setDietary] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(emptyRecipe);
  const [copied, setCopied] = useState(false);

  const [dbRecipes, setDbRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");

  const hasResult = useMemo(() => {
    return (
      result.title &&
      Array.isArray(result.ingredients) &&
      result.ingredients.length > 0 &&
      Array.isArray(result.steps) &&
      result.steps.length > 0
    );
  }, [result]);

  useEffect(() => {
    if (mode !== "improve") return;
    if (dbRecipes.length > 0) return;

    let ignore = false;

    async function loadRecipes() {
      setRecipesLoading(true);
      try {
        const data = await api("/recipes");
        if (!ignore) {
          setDbRecipes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Could not load recipes.");
        }
      } finally {
        if (!ignore) {
          setRecipesLoading(false);
        }
      }
    }

    loadRecipes();

    return () => {
      ignore = true;
    };
  }, [mode, dbRecipes.length]);

  async function handleRecipePick(recipeId) {
    setSelectedRecipeId(recipeId);

    if (!recipeId) {
      setRecipeText("");
      return;
    }

    try {
      const recipe = await api(`/recipes/${recipeId}`);
      setRecipeText(buildRecipeTextFromDbRecipe(recipe));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load selected recipe.");
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const data = await generateRecipe({
        prompt,
        options: {
          dietary,
          goal,
        },
      });

      setResult(data);
    } catch (err) {
      setError(err.message || "Could not generate recipe.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const data = await improveRecipe({
        recipeText,
        options: {
          dietary,
          goal,
        },
      });

      setResult(data);
    } catch (err) {
      setError(err.message || "Could not improve recipe.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recipeToText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy recipe.");
    }
  }

  function handleInsert() {
    if (!onInsert || !hasResult) return;
    onInsert(result);
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>AI Recipe Assistant</h2>
          <p style={styles.subtitle}>
            Generate a new recipe idea or improve an existing one.
          </p>
        </div>
      </div>

      <div style={styles.modeRow}>
        <button
          type="button"
          onClick={() => setMode("generate")}
          style={{
            ...styles.modeBtn,
            ...(mode === "generate" ? styles.modeBtnActive : {}),
          }}
        >
          Generate
        </button>

        <button
          type="button"
          onClick={() => setMode("improve")}
          style={{
            ...styles.modeBtn,
            ...(mode === "improve" ? styles.modeBtnActive : {}),
          }}
        >
          Improve
        </button>
      </div>

      <div style={styles.formGrid}>
        {mode === "generate" ? (
          <div>
            <label style={styles.label}>Prompt</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. quick vegetarian pasta"
              style={styles.input}
            />
          </div>
        ) : (
          <>
            <div>
              <label style={styles.label}>Choose a recipe</label>
              <select
                value={selectedRecipeId}
                onChange={(e) => handleRecipePick(e.target.value)}
                style={styles.input}
              >
                <option value="">
                  {recipesLoading ? "Loading recipes..." : "Select a recipe"}
                </option>
                {dbRecipes.map((recipe) => (
                  <option key={String(recipe.id)} value={String(recipe.id)}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Existing recipe text</label>
              <textarea
                value={recipeText}
                onChange={(e) => setRecipeText(e.target.value)}
                placeholder="Select a recipe or paste an existing recipe here..."
                rows={8}
                style={styles.textarea}
              />
            </div>
          </>
        )}

        <div style={styles.optionGrid}>
          <div>
            <label style={styles.label}>Dietary option</label>
            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              style={styles.input}
            >
              <option value="">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="high protein">High protein</option>
              <option value="low calorie">Low calorie</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. meal prep friendly"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.buttonRow}>
          {mode === "generate" ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                ...styles.primaryBtn,
                ...(loading || !prompt.trim() ? styles.disabledBtn : {}),
              }}
            >
              {loading ? "Generating..." : "Generate recipe"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleImprove}
              disabled={loading || !recipeText.trim()}
              style={{
                ...styles.primaryBtn,
                ...(loading || !recipeText.trim() ? styles.disabledBtn : {}),
              }}
            >
              {loading ? "Improving..." : "Improve recipe"}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasResult}
            style={{
              ...styles.secondaryBtn,
              ...(!hasResult ? styles.disabledBtn : {}),
            }}
          >
            {copied ? "Copied" : "Copy recipe"}
          </button>

          {typeof onInsert === "function" ? (
            <button
              type="button"
              onClick={handleInsert}
              disabled={!hasResult}
              style={{
                ...styles.secondaryBtn,
                ...(!hasResult ? styles.disabledBtn : {}),
              }}
            >
              {insertLabel}
            </button>
          ) : null}
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
      </div>

      {hasResult ? (
        <div style={styles.resultCard}>
          <h3 style={styles.resultTitle}>{result.title}</h3>

          <div style={styles.resultGrid}>
            <div>
              <h4 style={styles.sectionHeading}>Ingredients</h4>
              <ul style={styles.resultList}>
                {result.ingredients.map((item, index) => (
                  <li key={`${item}-${index}`} style={styles.resultItem}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={styles.sectionHeading}>Steps</h4>
              <ol style={styles.resultList}>
                {result.steps.map((step, index) => (
                  <li key={`${step}-${index}`} style={styles.resultItem}>
                    <span style={styles.stepNumber}>{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    padding: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },

  header: {
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    lineHeight: 1.4,
    opacity: 0.75,
  },

  modeRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  modeBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 12px",
    background: "#fafafa",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },

  modeBtnActive: {
    background: "white",
  },

  formGrid: {
    display: "grid",
    gap: 12,
  },

  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.3,
  },

  input: {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    background: "white",
    fontSize: 14,
    lineHeight: 1.4,
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    background: "white",
    fontSize: 14,
    lineHeight: 1.4,
    boxSizing: "border-box",
    resize: "vertical",
    outline: "none",
  },

  buttonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  primaryBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 14px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
  },

  secondaryBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 14px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.2,
  },

  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  error: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },

  resultCard: {
    marginTop: 6,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fafafa",
    padding: 14,
  },

  resultTitle: {
    margin: "0 0 12px",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },

  sectionHeading: {
    margin: "0 0 8px",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    opacity: 0.7,
  },

  resultList: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 8,
  },

  resultItem: {
    fontSize: 14,
    lineHeight: 1.4,
  },

  stepNumber: {
    fontWeight: 700,
    opacity: 0.75,
  },
};