import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";


const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

console.log("✅ recipes router loaded");

// -------- Schemas --------
const CategoryEnum = z.enum([
  "ENTREE",
  "SNACK",
  "SOUP",
  "STARTER",
  "MAIN",
  "DESSERT",
  "CAKE",
  "SWEET",
  "CONSERVE",
]);

const RecipeCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  source: z.string().optional().nullable(),

  country: z.string().max(80).optional().default("Not known"),
  category: CategoryEnum.optional().nullable(),
});


const addIngredientSchema = z.object({
  ingredient_name: z.string().min(1).max(120),
  amount: z.union([z.number(), z.string()]).optional().nullable(), // allow "2.50" or 2.5
  unit: z.string().max(20).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  
});

const updateIngredientSchema = z.object({
  ingredient_name: z.string().min(1).max(120).optional(),
  amount: z.union([z.number(), z.string()]).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  sort_order: z.number().int().optional().nullable(),

  stage_number: z.number().int().min(1).optional(),
  stage_name: z.string().max(80).optional().nullable(),
});


const addStepsSchema = z.object({
  steps: z.array(z.string().min(1)).min(1),
});

const addMediaSchema = z.object({
  media_type: z.enum(["photo", "image", "video"]), // API accepts photo; DB stores image/video
  url: z.string().url(),
  caption: z.string().max(255).optional().nullable(),
  is_primary: z.boolean().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
});

const addFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

const addStepMediaSchema = z.object({
  media_type: z.enum(["photo", "image", "video"]),
  url: z.string().url(),
  caption: z.string().max(255).optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
});


// -------- Routes --------

// List recipes
// List recipes (with cover image)
router.get("/", async (_req, res) => {
  const recipes = await prisma.recipes.findMany({
    take: 50,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      source: true,
      created_at: true,
      user_id: true,
      category: true, // ✅ ADD THIS LINE
      recipe_media: {
        where: { is_primary: true },
        take: 1,
        select: { url: true, caption: true, media_type: true },
      },
    },
    
  });

  res.json(recipes);
});


// Search recipes by ingredient tokens (AND match)
// Example: /recipes/search?q=onion,tomato
router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();

  const tokens = q
    .split(/[,\s]+/)              // split on commas or spaces
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);                // safety limit

  const where =
    tokens.length === 0
      ? {}
      : {
          AND: tokens.map((t) => ({
            recipe_ingredients: {
              some: {
                ingredient_name: {
                  contains: t,
                  mode: "insensitive",
                },
              },
            },
          })),
        };

  const recipes = await prisma.recipes.findMany({
    where,
    take: 50,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      source: true,
      description: true,
      // optional: show cover on cards if you want
      recipe_media: {
        where: { is_primary: true },
        take: 1,
        select: { url: true, caption: true },
      },
    },
  });

  res.json({
    query: q,
    tokens,
    count: recipes.length,
    recipes,
  });
});


// Recipe details (includes ingredients/steps/media/feedback)
router.get("/:id", async (req, res) => {
  let id;
  try {
    id = BigInt(req.params.id);
  } catch {
    return res.status(400).json({ error: "Bad id" });
  }

  const recipe = await prisma.recipes.findUnique({
    where: { id },
    include: {
      recipe_ingredients: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
      recipe_media: {
        orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }, { id: "asc" }],
      },
      recipe_steps: {
        orderBy: [{ step_number: "asc" }],
        include: {
          recipe_step_media: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
        },
      },
      recipe_feedback: { orderBy: [{ created_at: "desc" }] },
    },
  });

  if (!recipe) return res.status(404).json({ error: "Not found" });
  return res.json(recipe);
});

// Create recipe (protected)
router.post("/", requireAuth, async (req, res) => {
  const parsed = RecipeCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  

  const recipe = await prisma.recipes.create({
    data: {
      user_id: BigInt(String(req.userId)),
      source: parsed.data.source ?? null,
      name: parsed.data.name,
      description: parsed.data.description ?? null,

      // NEW:
      country: parsed.data.country ?? "Not known",
      category: parsed.data.category ?? null,
    },
  });

  return res.status(201).json(recipe);
});


// Add ingredient to recipe (protected + owner-only)
router.post("/:id/ingredients", requireAuth, async (req, res) => {
  try {
    let recipeId;
    try {
      recipeId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const parsed = addIngredientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const userId = BigInt(String(req.userId));

    // Ownership check
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });

    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    

    // Auto-append sort_order if missing
    let sortOrder = parsed.data.sort_order ?? null;
    if (sortOrder === null) {
      const last = await prisma.recipe_ingredients.findFirst({
        where: { recipe_id: recipeId },
        orderBy: [{ sort_order: "desc" }, { id: "desc" }],
        select: { sort_order: true },
      });
      sortOrder = (last?.sort_order ?? 0) + 1;
    }

    // Decimal: pass string or null
    const amountValue =
      parsed.data.amount === undefined ||
      parsed.data.amount === null ||
      parsed.data.amount === ""
        ? null
        : String(parsed.data.amount);

    const ingredient = await prisma.recipe_ingredients.create({
      data: {
        recipe_id: recipeId,
        ingredient_name: parsed.data.ingredient_name.trim(),
        amount: amountValue,
        unit: parsed.data.unit?.trim() ?? null,
        note: parsed.data.note?.trim() ?? null,
        sort_order: sortOrder,
      },
    });

    return res.status(201).json(ingredient);
  } catch (err) {
    console.error("CREATE INGREDIENT ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Update ingredient (protected + owner/admin)
router.patch("/:id/ingredients/:ingredientId", requireAuth, async (req, res) => {
  try {
    let recipeId, ingredientId;
    try {
      recipeId = BigInt(req.params.id);
      ingredientId = BigInt(req.params.ingredientId);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const parsed = updateIngredientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ error: "No fields provided to update." });
    }
    
    const userId = BigInt(String(req.userId));

    // Ownership check via recipe
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Ensure ingredient belongs to that recipe
    const existing = await prisma.recipe_ingredients.findUnique({
      where: { id: ingredientId },
      select: { id: true, recipe_id: true },
    });
    if (!existing || existing.recipe_id !== recipeId) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    // Decimal handling
    const amountValue =
      parsed.data.amount === undefined
        ? undefined
        : parsed.data.amount === null || parsed.data.amount === ""
          ? null
          : String(parsed.data.amount);

    const updated = await prisma.recipe_ingredients.update({
      where: { id: ingredientId },
      data: {
        ...(parsed.data.ingredient_name !== undefined
          ? { ingredient_name: parsed.data.ingredient_name.trim() }
          : {}),
        ...(parsed.data.unit !== undefined ? { unit: parsed.data.unit?.trim() ?? null } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() ?? null } : {}),
        ...(parsed.data.sort_order !== undefined ? { sort_order: parsed.data.sort_order } : {}),
        ...(parsed.data.amount !== undefined ? { amount: amountValue } : {}),
        ...(parsed.data.stage_number !== undefined ? { stage_number: parsed.data.stage_number } : {}),
        ...(parsed.data.stage_name !== undefined ? { stage_name: parsed.data.stage_name?.trim() ?? null } : {}),
        
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PATCH INGREDIENT ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});


// Add steps to recipe (protected + owner-only) - REPLACES
router.post("/:id/steps", requireAuth, async (req, res) => {
  console.log("HIT POST /:id/steps", req.params.id);

  try {
    let recipeId;
    try {
      recipeId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const parsed = addStepsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const userId = BigInt(String(req.userId));

    // Ownership check
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });

    // ✅ Replace all steps for this recipe
    await prisma.recipe_steps.deleteMany({
      where: { recipe_id: recipeId },
    });

    const data = parsed.data.steps.map((instruction, idx) => ({
      recipe_id: recipeId,
      step_number: idx + 1,
      instruction,
    }));

    await prisma.recipe_steps.createMany({ data });

    const steps = await prisma.recipe_steps.findMany({
      where: { recipe_id: recipeId },
      orderBy: [{ step_number: "asc" }],
    });

    return res.status(201).json(steps);
  } catch (err) {
    console.error("ADD STEPS ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});


// Add media to recipe (protected + owner-only)
router.post("/:id/media", requireAuth, async (req, res) => {
  // 🔎 TEMP DIAGNOSTIC (keep until fixed)
  const ct = req.headers["content-type"];
  if (req.body === undefined) {
    return res.status(400).json({
      error: "Missing request body (req.body is undefined)",
      contentType: ct,
      hint:
        "If contentType is multipart/form-data then express.json() won't parse it. If it's application/json but still undefined, you may be running a different server instance or body parsing is not applied.",
    });
  }

  try {
    let recipeId;
    try {
      recipeId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const parsed = addMediaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    // ... keep the rest of your existing code unchanged ...


    let mediaType = parsed.data.media_type;
    if (mediaType === "photo") mediaType = "image"; // normalize for DB constraint

    const userId = BigInt(String(req.userId));

    // Ownership check
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });

    // sort_order default: append
    let sortOrder = parsed.data.sort_order ?? null;
    if (sortOrder === null) {
      const last = await prisma.recipe_media.findFirst({
        where: { recipe_id: recipeId },
        orderBy: [{ sort_order: "desc" }, { id: "desc" }],
        select: { sort_order: true },
      });
      sortOrder = (last?.sort_order ?? 0) + 1;
    }

    const isPrimary = parsed.data.is_primary ?? false;

    // If setting primary, unset others first
    if (isPrimary) {
      await prisma.recipe_media.updateMany({
        where: { recipe_id: recipeId, is_primary: true },
        data: { is_primary: false },
      });
    }

    const media = await prisma.recipe_media.create({
      data: {
        recipe_id: recipeId,
        media_type: mediaType, // DB expects image|video
        url: parsed.data.url,
        caption: parsed.data.caption ?? null,
        is_primary: isPrimary,
        sort_order: sortOrder,
      },
    });

    return res.status(201).json(media);
  } catch (err) {
    console.error("ADD MEDIA ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Add/update feedback for a recipe (protected + one per user)
router.post("/:id/feedback", requireAuth, async (req, res) => {
  try {
    let recipeId;
    try {
      recipeId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const parsed = addFeedbackSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const userId = BigInt(String(req.userId));

    // Ensure recipe exists
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const feedback = await prisma.recipe_feedback.upsert({
      where: {
        recipe_id_user_id: {
          recipe_id: recipeId,
          user_id: userId,
        },
      },
      create: {
        recipe_id: recipeId,
        user_id: userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      },
      update: {
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      },
    });

    return res.status(201).json(feedback);
  } catch (err) {
    console.error("ADD FEEDBACK ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Upload media file to recipe (multipart/form-data)
router.post("/:id/media/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    let recipeId;
    try {
      recipeId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const userId = BigInt(String(req.userId));

    // Ownership check
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });

    if (!req.file) return res.status(400).json({ error: "Missing file" });

    // fields from multipart form
    let mediaType = (req.body.media_type ?? "photo").toString();
    if (mediaType === "photo") mediaType = "image"; // normalize for DB
    if (!["image", "video"].includes(mediaType)) {
      return res.status(400).json({ error: "Invalid media_type" });
    }

    const caption = (req.body.caption ?? "").toString().trim() || null;
    const isPrimary = (req.body.is_primary ?? "false").toString() === "true";

    let sortOrder = req.body.sort_order ? Number(req.body.sort_order) : null;
    if (!Number.isInteger(sortOrder)) sortOrder = null;

    if (sortOrder === null) {
      const last = await prisma.recipe_media.findFirst({
        where: { recipe_id: recipeId },
        orderBy: [{ sort_order: "desc" }, { id: "desc" }],
        select: { sort_order: true },
      });
      sortOrder = (last?.sort_order ?? 0) + 1;
    }

    // If setting primary, unset others first
    if (isPrimary) {
      await prisma.recipe_media.updateMany({
        where: { recipe_id: recipeId, is_primary: true },
        data: { is_primary: false },
      });
    }

    // Save URL pointing to the static uploads route
    const url = `/uploads/${req.file.filename}`;

    const media = await prisma.recipe_media.create({
      data: {
        recipe_id: recipeId,
        media_type: mediaType,
        url,
        caption,
        is_primary: isPrimary,
        sort_order: sortOrder,
      },
    });

    return res.status(201).json(media);
  } catch (err) {
    console.error("ADD MEDIA UPLOAD ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});


// Add media to a step (protected + owner-only via step -> recipe)
router.post("/steps/:stepId/media", requireAuth, async (req, res) => {
  try {
    let stepId;
    try {
      stepId = BigInt(req.params.stepId);
    } catch {
      return res.status(400).json({ error: "Bad stepId" });
    }

    const parsed = addStepMediaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    let mediaType = parsed.data.media_type;
    if (mediaType === "photo") mediaType = "image"; // normalize

    const userId = BigInt(String(req.userId));

    // Find step + recipe owner
    const step = await prisma.recipe_steps.findUnique({
      where: { id: stepId },
      select: {
        id: true,
        recipe_id: true,
        recipes: { select: { user_id: true } },
      },
    });

    if (!step) return res.status(404).json({ error: "Step not found" });
    if (step.recipes.user_id !== userId && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });

    // sort_order default: append
    let sortOrder = parsed.data.sort_order ?? null;
    if (sortOrder === null) {
      const last = await prisma.recipe_step_media.findFirst({
        where: { step_id: stepId },
        orderBy: [{ sort_order: "desc" }, { id: "desc" }],
        select: { sort_order: true },
      });
      sortOrder = (last?.sort_order ?? 0) + 1;
    }

    const media = await prisma.recipe_step_media.create({
      data: {
        step_id: stepId,
        media_type: mediaType,
        url: parsed.data.url,
        caption: parsed.data.caption ?? null,
        sort_order: sortOrder,
      },
    });

    return res.status(201).json(media);
  } catch (err) {
    console.error("ADD STEP MEDIA ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Upload media file to a step (multipart/form-data)
router.post(
  "/steps/:stepId/media/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      let stepId;
      try {
        stepId = BigInt(req.params.stepId);
      } catch {
        return res.status(400).json({ error: "Bad stepId" });
      }

      if (!req.file) return res.status(400).json({ error: "Missing file" });

      const userId = BigInt(String(req.userId));

      // Find step + recipe owner
      const step = await prisma.recipe_steps.findUnique({
        where: { id: stepId },
        select: {
          id: true,
          recipe_id: true,
          recipes: { select: { user_id: true } },
        },
      });

      if (!step) return res.status(404).json({ error: "Step not found" });
      if (step.recipes.user_id !== userId && !req.isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // multipart fields
      let mediaType = (req.body.media_type ?? "photo").toString();
      if (mediaType === "photo") mediaType = "image"; // normalize
      if (!["image", "video"].includes(mediaType)) {
        return res.status(400).json({ error: "Invalid media_type" });
      }

      const caption = (req.body.caption ?? "").toString().trim() || null;

      let sortOrder = req.body.sort_order ? Number(req.body.sort_order) : null;
      if (!Number.isInteger(sortOrder)) sortOrder = null;

      if (sortOrder === null) {
        const last = await prisma.recipe_step_media.findFirst({
          where: { step_id: stepId },
          orderBy: [{ sort_order: "desc" }, { id: "desc" }],
          select: { sort_order: true },
        });
        sortOrder = (last?.sort_order ?? 0) + 1;
      }

      // Save URL pointing to the static uploads route
      const url = `/uploads/${req.file.filename}`;

      const media = await prisma.recipe_step_media.create({
        data: {
          step_id: stepId,
          media_type: mediaType,
          url,
          caption,
          sort_order: sortOrder,
        },
      });

      return res.status(201).json(media);
    } catch (err) {
      console.error("STEP MEDIA UPLOAD ERROR:", err);
      return res.status(500).json({ error: err.message ?? String(err) });
    }
  }
);


// Update recipe media (caption / make primary) (protected + owner-only)
router.patch("/:id/media/:mediaId", requireAuth, async (req, res) => {
  try {
    let recipeId, mediaId;
    try {
      recipeId = BigInt(req.params.id);
      mediaId = BigInt(req.params.mediaId);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const userId = BigInt(String(req.userId));

    // Ownership check
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });

    // Must belong to this recipe
    const existing = await prisma.recipe_media.findUnique({
      where: { id: mediaId },
      select: { id: true, recipe_id: true, is_primary: true },
    });
    if (!existing || existing.recipe_id !== recipeId) {
      return res.status(404).json({ error: "Media not found" });
    }

    const caption =
      req.body?.caption === undefined ? undefined : (String(req.body.caption).trim() || null);
    const makePrimary =
      req.body?.is_primary === undefined ? undefined : Boolean(req.body.is_primary);

    if (makePrimary === true) {
      await prisma.recipe_media.updateMany({
        where: { recipe_id: recipeId, is_primary: true },
        data: { is_primary: false },
      });
    }

    const updated = await prisma.recipe_media.update({
      where: { id: mediaId },
      data: {
        ...(caption !== undefined ? { caption } : {}),
        ...(makePrimary !== undefined ? { is_primary: makePrimary } : {}),
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PATCH MEDIA ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Delete recipe media (protected + owner-only)
router.delete("/:id/media/:mediaId", requireAuth, async (req, res) => {
  try {
    let recipeId, mediaId;
    try {
      recipeId = BigInt(req.params.id);
      mediaId = BigInt(req.params.mediaId);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    const userId = BigInt(String(req.userId));

    // Ownership check
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true },
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (recipe.user_id !== userId && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const media = await prisma.recipe_media.findUnique({
      where: { id: mediaId },
      select: { id: true, recipe_id: true, url: true, is_primary: true },
    });
    if (!media || media.recipe_id !== recipeId) {
      return res.status(404).json({ error: "Media not found" });
    }

    await prisma.recipe_media.delete({ where: { id: mediaId } });

    // If local upload, delete file too
    if (typeof media.url === "string" && media.url.startsWith("/uploads/")) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const uploadsDir = join(__dirname, "..", "uploads"); // routes/.. => backend/uploads

      const filename = media.url.replace("/uploads/", "");
      const filePath = path.join(uploadsDir, filename);

      fs.unlink(filePath, (err) => {
        if (err) console.warn("Could not delete file:", filePath, err.message);
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE MEDIA ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Delete a recipe (ADMIN ONLY)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ error: "Admin only" });

    let recipeId;
    try {
      recipeId = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "Bad id" });
    }

    // Gather any locally-uploaded files to remove from disk after DB delete
    const media = await prisma.recipe_media.findMany({
      where: { recipe_id: recipeId },
      select: { url: true },
    });

    // If you store step media in a separate table, collect those too
    const stepMedia = await prisma.recipe_step_media.findMany({
      where: { recipe_steps: { recipe_id: recipeId } },
      select: { url: true },
    });

    const toDelete = [...media, ...stepMedia]
      .map((m) => m.url)
      .filter((u) => typeof u === "string" && u.startsWith("/uploads/"));

    // Delete DB records (transaction keeps it consistent)
    await prisma.$transaction(async (tx) => {
      // step media -> steps -> ingredients/feedback/media -> recipe
      await tx.recipe_step_media.deleteMany({
        where: { recipe_steps: { recipe_id: recipeId } },
      });

      await tx.recipe_steps.deleteMany({ where: { recipe_id: recipeId } });
      await tx.recipe_ingredients.deleteMany({ where: { recipe_id: recipeId } });
      await tx.recipe_feedback.deleteMany({ where: { recipe_id: recipeId } });
      await tx.recipe_media.deleteMany({ where: { recipe_id: recipeId } });

      await tx.recipes.delete({ where: { id: recipeId } });
    });

    // Remove files from disk (best-effort)
    for (const url of toDelete) {
      const filename = url.replace("/uploads/", "");
      const filePath = path.join(uploadsDir, filename);
      fs.unlink(filePath, () => {});
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE RECIPE ERROR:", err);
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});


export default router;
