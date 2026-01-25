-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RECIPES
CREATE TABLE IF NOT EXISTS recipes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source      VARCHAR(255),
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);

-- INGREDIENTS
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id              BIGSERIAL PRIMARY KEY,
  recipe_id       BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(120) NOT NULL,
  amount          NUMERIC(10,2),
  unit            VARCHAR(20),
  note            VARCHAR(255),
  sort_order      INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- STEPS
CREATE TABLE IF NOT EXISTS recipe_steps (
  id          BIGSERIAL PRIMARY KEY,
  recipe_id   BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL,
  CONSTRAINT uq_recipe_step UNIQUE (recipe_id, step_number),
  CONSTRAINT chk_step_number CHECK (step_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_steps_recipe_id ON recipe_steps(recipe_id);

-- RECIPE MEDIA
CREATE TABLE IF NOT EXISTS recipe_media (
  id          BIGSERIAL PRIMARY KEY,
  recipe_id   BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  media_type  VARCHAR(10) NOT NULL,  -- 'image' or 'video'
  url         TEXT NOT NULL,
  caption     VARCHAR(255),
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_recipe_media_type CHECK (media_type IN ('image','video'))
);

CREATE INDEX IF NOT EXISTS idx_recipe_media_recipe_id ON recipe_media(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_media_primary ON recipe_media(recipe_id, is_primary);

-- STEP MEDIA
CREATE TABLE IF NOT EXISTS recipe_step_media (
  id          BIGSERIAL PRIMARY KEY,
  step_id     BIGINT NOT NULL REFERENCES recipe_steps(id) ON DELETE CASCADE,
  media_type  VARCHAR(10) NOT NULL,  -- 'image' or 'video'
  url         TEXT NOT NULL,
  caption     VARCHAR(255),
  sort_order  INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_step_media_type CHECK (media_type IN ('image','video'))
);

CREATE INDEX IF NOT EXISTS idx_step_media_step_id ON recipe_step_media(step_id);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS recipe_feedback (
  id          BIGSERIAL PRIMARY KEY,
  recipe_id   BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INT NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT uq_feedback_one_per_user UNIQUE (recipe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_recipe_id ON recipe_feedback(recipe_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON recipe_feedback(user_id);

-- Optional: ensure only one primary media per recipe
CREATE UNIQUE INDEX IF NOT EXISTS uq_recipe_primary_media
ON recipe_media(recipe_id)
WHERE is_primary = TRUE;
