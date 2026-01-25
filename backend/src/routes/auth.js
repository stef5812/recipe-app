import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db/prisma.js";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(200),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { username, password } = parsed.data;

  const exists = await prisma.users.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ error: "Username already taken" });

  const password_hash = await bcrypt.hash(password, 12);

  const user = await prisma.users.create({
    data: { username, password_hash },
    select: { id: true, username: true, created_at: true },
  });

  res.status(201).json(user);
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { username, password } = parsed.data;

  const user = await prisma.users.findUnique({
    where: { username },
    select: { id: true, password_hash: true, is_admin: true },
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  
  const token = jwt.sign(
    { userId: user.id, isAdmin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  
  res.json({ token });
  
});

export default router;
