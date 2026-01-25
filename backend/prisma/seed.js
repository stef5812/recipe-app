import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const username = process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME; // allow either name
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("❌ Set ADMIN_EMAIL (or ADMIN_USERNAME) and ADMIN_PASSWORD environment variables.");
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 10);

await prisma.users.upsert({
  where: { username },
  update: { is_admin: true, password_hash },
  create: { username, is_admin: true, password_hash },
});

console.log("✅ Admin user created / updated:", username);

await prisma.$disconnect();
