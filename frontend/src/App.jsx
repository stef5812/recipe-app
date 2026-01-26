import { Routes, Route, Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "./lib/api";

import PageContainer from "./components/PageContainer";
import Section from "./components/Section";


import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./components/Login";
import Register from "./components/Register";

import RecipesList from "./components/RecipesList";
import RecipeDetail from "./components/RecipeDetail";
import RecipeCreate from "./components/RecipeCreate";
import Home from "./components/Home";

import IngredientForm from "./components/IngredientForm";
import StepsEditor from "./components/StepsEditor";

// import RecipeCreate from "./components/RecipeCreate"; // we’ll add this next

function hasToken() {
  return !!localStorage.getItem("token");
}

function RequireAuth({ children }) {
  if (!hasToken()) return <Navigate to="/login" replace />;
  return children;
}



function TopBar({ onLogout }) {
  return (
    <div style={bar.wrap}>
      <Link to="/" style={bar.link}>🏠 Home</Link>
      <Link to="/recipes" style={bar.link}>📚 Recipes</Link>
      <button onClick={onLogout} style={bar.btn}>Logout</button>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    setAuthed(false);
    navigate("/", { replace: true });
  }

  return (
    <div>

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
        onCreated={(id) => navigate(`/recipes/${id}`, { replace: true })}
        onBack={() => navigate("/recipes")}
      />
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

    </div>
  );
}

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

function IngredientsWizardRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <IngredientForm
      recipeId={id}
      onNext={() => navigate(`/recipes/${id}/steps`, { replace: true })}
    />
  );
}

function StepsWizardRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    api(`/recipes/${id}`)
      .then(setRecipe)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!recipe) return <p>Loading…</p>;

  return (
    <PageContainer title="Edit steps">
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

      <Section title="Steps">
        <StepsEditor
          recipeId={id}
          initialSteps={recipe.recipe_steps ?? []}
          onSaved={() => navigate(`/recipes/${id}`, { replace: true })}
          onFinish={() => navigate(`/recipes/${id}`, { replace: true })}
        />
      </Section>
    </PageContainer>
  );
}




function IngredientsRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <IngredientForm
      recipeId={id}
      onNext={() => navigate(`/recipes/${id}/steps`, { replace: true })}
      onDone={() => navigate(`/recipes/${id}`, { replace: true })}
    />
  );
}

function StepsRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <StepsEditor
      recipeId={id}
      // no initialSteps in wizard (it’s fine)
      onSaved={() => navigate(`/recipes/${id}`, { replace: true })}
      onFinish={() => navigate(`/recipes/${id}`, { replace: true })}
    />
  );
}


const bar = {
  wrap: {
    maxWidth: "100%",
    margin: "20px auto",
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "0 16px",
  },
  link: {
    textDecoration: "none",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    color: "#111827",
    background: "white",
  },
  btn: {
    marginLeft: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    cursor: "pointer",
  },
};
