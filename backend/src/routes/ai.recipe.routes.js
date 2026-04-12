import { Router } from "express";
import { generateRecipeFromPrompt, improveRecipeText } from "../services/ai.recipe.service.js";

const router = Router();

function normaliseRecipePayload(data = {}) {
  return {
    title: typeof data.title === "string" ? data.title.trim() : "",
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [],
    steps: Array.isArray(data.steps)
      ? data.steps
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [],
  };
}

function validateRecipePayload(recipe) {
  return (
    typeof recipe.title === "string" &&
    recipe.title.length > 0 &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.length > 0 &&
    Array.isArray(recipe.steps) &&
    recipe.steps.length > 0
  );
}

router.post("/generate", async (req, res) => {
  try {
    const { prompt, options = {} } = req.body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "A recipe prompt is required.",
      });
    }

    const recipe = await generateRecipeFromPrompt({
      prompt: prompt.trim(),
      options,
    });

    const cleaned = normaliseRecipePayload(recipe);

    if (!validateRecipePayload(cleaned)) {
      return res.status(502).json({
        error: "AI returned an invalid recipe structure.",
      });
    }

    return res.json(cleaned);
} catch (error) {
    console.error("AI recipe generate error:", error);
  
    const msg = String(error?.message || "");
  
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return res.status(429).json({
        error: "AI quota reached. Please try again shortly.",
      });
    }
  
    return res.status(500).json({
      error: msg || "Failed to generate recipe.",
    });
  }
});

router.post("/improve", async (req, res) => {
  try {
    const { recipeText, options = {} } = req.body || {};

    if (!recipeText || typeof recipeText !== "string" || !recipeText.trim()) {
      return res.status(400).json({
        error: "Existing recipe text is required.",
      });
    }

    const recipe = await improveRecipeText({
      recipeText: recipeText.trim(),
      options,
    });

    const cleaned = normaliseRecipePayload(recipe);

    if (!validateRecipePayload(cleaned)) {
      return res.status(502).json({
        error: "AI returned an invalid recipe structure.",
      });
    }

    return res.json(cleaned);
} catch (error) {
    console.error("AI recipe generate error:", error);
  
    const msg = String(error?.message || "");
  
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return res.status(429).json({
        error: "AI quota reached. Please try again shortly.",
      });
    }
  
    return res.status(500).json({
      error: msg || "Failed to generate recipe.",
    });
  }
});

export default router;