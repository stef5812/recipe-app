import { generateText } from "./ai.service.js";

/**
 * Attempts to extract a JSON object from an AI response string.
 * Handles plain JSON and cases where the model wraps JSON in extra text.
 */
function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    throw new Error("AI returned an empty response.");
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in AI response.");
  }

  const jsonSlice = trimmed.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSlice);
  } catch {
    throw new Error("AI returned malformed JSON.");
  }
}

function normaliseRecipe(recipe = {}) {
  return {
    title: typeof recipe.title === "string" ? recipe.title.trim() : "",
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((x) => String(x).trim()).filter(Boolean)
      : [],
    steps: Array.isArray(recipe.steps)
      ? recipe.steps.map((x) => String(x).trim()).filter(Boolean)
      : [],
  };
}

function buildRecipePrompt({ mode, prompt, recipeText, options = {} }) {
  const optionLines = [];

  if (options.style) optionLines.push(`Style: ${options.style}`);
  if (options.goal) optionLines.push(`Goal: ${options.goal}`);
  if (options.dietary) optionLines.push(`Dietary preference: ${options.dietary}`);
  if (options.extra) optionLines.push(`Extra instruction: ${options.extra}`);

  const optionsBlock =
    optionLines.length > 0
      ? `Additional constraints:\n${optionLines.map((line) => `- ${line}`).join("\n")}\n`
      : "";

  if (mode === "generate") {
    return `
You are a recipe assistant for a full-stack web app.

Task:
Generate a practical, concise recipe from the user's prompt.

Rules:
- Return valid JSON only
- Do not use markdown
- Do not include commentary outside JSON
- Keep the result concise and UI-friendly
- Use this exact shape:
{
  "title": "string",
  "ingredients": ["string"],
  "steps": ["string"]
}

Recipe prompt:
${prompt}

${optionsBlock}
Requirements:
- The title should be short and appealing
- Ingredients should be clear and shopping-list friendly
- Steps should be practical, ordered, and concise
- Prefer 5 to 8 ingredients and 4 to 7 steps unless the prompt implies otherwise
`.trim();
  }

  return `
You are a recipe assistant for a full-stack web app.

Task:
Improve and restructure the user's existing recipe.

Rules:
- Return valid JSON only
- Do not use markdown
- Do not include commentary outside JSON
- Keep the result concise and UI-friendly
- Use this exact shape:
{
  "title": "string",
  "ingredients": ["string"],
  "steps": ["string"]
}

Existing recipe:
${recipeText}

${optionsBlock}
Improvement goals:
- Improve clarity
- Remove repetition
- Make the steps more logical
- Make ingredient wording consistent
- Keep the recipe realistic and usable
`.trim();
}

async function callRecipeModel(prompt) {
  const raw = await generateText({
    prompt,
    temperature: 0.4,
  });

  const text =
    typeof raw === "string"
      ? raw
      : typeof raw?.text === "string"
        ? raw.text
        : "";

  const parsed = extractJsonObject(text);
  return normaliseRecipe(parsed);
}

export async function generateRecipeFromPrompt({ prompt, options = {} }) {
  const aiPrompt = buildRecipePrompt({
    mode: "generate",
    prompt,
    options,
  });

  return callRecipeModel(aiPrompt);
}

export async function improveRecipeText({ recipeText, options = {} }) {
  const aiPrompt = buildRecipePrompt({
    mode: "improve",
    recipeText,
    options,
  });

  return callRecipeModel(aiPrompt);
}