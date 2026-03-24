// frontend/src/App.jsx

import { useEffect, useState } from "react";
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

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? "http://localhost:5173";
const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE ?? "http://localhost:3001";

/** ===== helpers ===== */
function RequireAuth({ authed, children }) {
  if (!authed) return <Navigate to="/" replace />;
  return children;
}

function ErrorBoundary({ children }) {
  return children;
}

function goToAuthLogin() {
  const from = "recipe-app";
  const next = "http://localhost:5174/recipe-app/";

  window.location.href =
    `${AUTH_BASE}/login?from=${encodeURIComponent(from)}&next=${encodeURIComponent(next)}`;
}

function goToAuthRegister() {
  const from = "recipe-app";
  const next = "http://localhost:5174/recipe-app/";

  window.location.href =
    `${AUTH_BASE}/register?from=${encodeURIComponent(from)}&next=${encodeURIComponent(next)}`;
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
          onNext={() => navigate(`/recipes/${id}/steps`)}
          onDone={() => navigate(`/recipes/${id}`, { replace: true })}
        />
      </Section>
    </PageContainer>
  );
}

function StepsWizardRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setAuthed(false);
          return;
        }

        const data = await res.json();
        setAuthed(!!data?.user);
      } catch (err) {
        setAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, []);

  async function logout() {
    try {
      await fetch(`${AUTH_API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore network errors here; still clear local auth state
    }

    setAuthed(false);
    navigate("/", { replace: true });
  }

  if (!authChecked) {
    return <div style={{ padding: 40 }}>Checking login...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            isAuthed={authed}
            onGoLogin={goToAuthLogin}
            onRegister={goToAuthRegister}
            onGoRecipes={() => navigate("/recipes")}
            onCreateRecipe={() => navigate("/recipes/new")}
            onOpenRecipe={(id) => navigate(`/recipes/${id}`)}
            onLogout={logout}
          />
        }
      />

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

      <Route
        path="/recipes"
        element={
          <RequireAuth authed={authed}>
            <RecipesList
              onOpen={(id) => navigate(`/recipes/${id}`)}
              onNew={() => navigate("/recipes/new")}
              onBack={() => navigate("/")}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/recipes/new"
        element={
          <RequireAuth authed={authed}>
            <RecipeCreate
              onCreated={(id) => navigate(`/recipes/${id}/ingredients`, { replace: true })}
              onBack={() => navigate("/recipes")}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/recipes/:id/ingredients"
        element={
          <RequireAuth authed={authed}>
            <IngredientsRoute />
          </RequireAuth>
        }
      />

      <Route
        path="/recipes/:id/steps"
        element={
          <RequireAuth authed={authed}>
            <StepsWizardRoute />
          </RequireAuth>
        }
      />

      <Route
        path="/recipes/:id"
        element={
          <RequireAuth authed={authed}>
            <ErrorBoundary>
              <RecipeDetailRoute />
            </ErrorBoundary>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}