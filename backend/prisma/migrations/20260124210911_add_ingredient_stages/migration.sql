-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN     "stage_name" VARCHAR(80),
ADD COLUMN     "stage_number" INTEGER NOT NULL DEFAULT 1;
