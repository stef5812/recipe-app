// backend/src/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import recipeRoutes from "./routes/recipes.js";

import aiRecipeRoutes from "./routes/ai.recipe.routes.js";

// Allow JSON.stringify to handle BigInt (convert to string)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/uploads", express.static(uploadsDir));
console.log("Serving uploads from:", uploadsDir);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);

app.use("/api/me/ai/recipe", aiRecipeRoutes);

// JSON error handler (so curl doesn't get HTML)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 3002;
app.listen(port, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${port}`);
});
