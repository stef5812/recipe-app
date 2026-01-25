-- CreateEnum
CREATE TYPE "recipe_category" AS ENUM ('ENTREE', 'SOUP', 'STARTER', 'MAIN', 'DESSERT', 'CAKE', 'SWEET');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "category" "recipe_category",
ADD COLUMN     "country" VARCHAR(80) NOT NULL DEFAULT 'Not known';
