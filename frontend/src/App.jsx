// frontend/src/App.jsx
import { useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import RecipesList from "./components/RecipesList";
import RecipeCreate from "./components/RecipeCreate";
import RecipeDetail from "./components/RecipeDetail";
import IngredientForm from "./components/IngredientForm";
import StepsEditor from "./components/StepsEditor";

import PageContainer from "./components/PageContainer";
import Section from "./components/Section";
import { api } from "./lib/api";

/** ===== helpers ===== */
function hasToken() {
  return !!localStorage.getItem("token");
}

function RequireAuth({ children }) {
  const authed = hasToken();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

/** Optional but handy */
function ErrorBoundary({ children }) {
  return children;
}

/** ===== route wrappers ===== */

function RecipeDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <RecipeDetail
      id={id}
      onBack={() => navigate("/recipes")}
    />
  );
}

/**
 * Ingredients-only page.
 * IMPORTANT: This renders ONLY IngredientForm
 */
function IngredientsRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PageContainer title="Add ingredients">
      <button
        type="button"
        onClick={() => navigate(`/recipes/${id}`, { replace: true })}
        style={{
          marginBottom: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "8px 10px",
          background: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        ← Back to recipe
      </button>

      <Section title="Ingredients">
        <IngredientForm
          recipeId={id}
          // Next takes you to the dedicated steps page
          onNext={() => navigate(`/recipes/${id}/steps`)}
          // Done can take you back to recipe detail if you want
          onDone={() => navigate(`/recipes/${id}`, { replace: true })}
        />
      </Section>
    </PageContainer>
  );
}

/**
 * Steps-only page.
 * IMPORTANT: This renders ONLY StepsEditor
 * (no IngredientForm)
 */
function StepsWizardRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  // If you want initialSteps here, fetch them (optional).
  // But your StepsEditor works without initialSteps in wizard mode.
  return (
    <PageContainer title="Add steps">
      <button
        type="button"
        onClick={() => navigate(`/recipes/${id}/ingredients`, { replace: true })}
        style={{
          marginBottom: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "8px 10px",
          background: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        ← Back to ingredients
      </button>

      <Section title="Steps">
        <StepsEditor
          recipeId={id}
          onSaved={() => navigate(`/recipes/${id}`, { replace: true })}
          onFinish={() => navigate(`/recipes/${id}`, { replace: true })}
        />
      </Section>
    </PageContainer>
  );
}

/** ===== App ===== */
export default function App() {
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(hasToken());

  function logout() {
    localStorage.removeItem("token");
    setAuthed(false);
    navigate("/", { replace: true });
  }

  return (
    <Routes>
      {/* Home (PUBLIC) */}
      <Route
        path="/"
        element={
          <Home
            isAuthed={authed}
            onGoLogin={() => navigate("/login")}
            onRegister={() => navigate("/register")}
            onGoRecipes={() => navigate("/recipes")}
            onCreateRecipe={() => navigate("/recipes/new")}
            onOpenRecipe={(id) => navigate(`/recipes/${id}`)}
            onLogout={logout}
          />
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          authed ? (
            <Navigate to="/" replace />
          ) : (
            <Login
              onDone={() => {
                setAuthed(true);
                navigate("/", { replace: true });
              }}
              onGoRegister={() => navigate("/register")}
            />
          )
        }
      />

      {/* Register */}
      <Route
        path="/register"
        element={
          authed ? (
            <Navigate to="/" replace />
          ) : (
            <Register
              onDone={() => navigate("/login", { replace: true })}
              onGoLogin={() => navigate("/login")}
            />
          )
        }
      />

      {/* Recipes list (PROTECTED) */}
      <Route
        path="/recipes"
        element={
          <RequireAuth>
            <RecipesList
              onOpen={(id) => navigate(`/recipes/${id}`)}
              onNew={() => navigate("/recipes/new")}
              onBack={() => navigate("/")}
            />
          </RequireAuth>
        }
      />

      {/* Create recipe (PROTECTED) */}
      <Route
        path="/recipes/new"
        element={
          <RequireAuth>
            <RecipeCreate
              // ✅ go straight to ingredients page after creation
              onCreated={(id) => navigate(`/recipes/${id}/ingredients`, { replace: true })}
              onBack={() => navigate("/recipes")}
            />
          </RequireAuth>
        }
      />

      {/* Ingredients step (PROTECTED) */}
      <Route
        path="/recipes/:id/ingredients"
        element={
          <RequireAuth>
            <IngredientsRoute />
          </RequireAuth>
        }
      />

      {/* Steps step (PROTECTED) */}
      <Route
        path="/recipes/:id/steps"
        element={
          <RequireAuth>
            <StepsWizardRoute />
          </RequireAuth>
        }
      />

      {/* Recipe detail (PROTECTED) */}
      <Route
        path="/recipes/:id"
        element={
          <RequireAuth>
            <ErrorBoundary>
              <RecipeDetailRoute />
            </ErrorBoundary>
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
