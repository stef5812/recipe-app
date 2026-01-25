import { Routes, Route, Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

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
        onCreated={(id) =>
          navigate(`/recipes/${id}/ingredients`, { replace: true })
        }
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
        <IngredientForm
          onNext={(id) => navigate(`/recipes/${id}/steps`, { replace: true })}
        />
      </RequireAuth>
    }
  />

  {/* Steps step (PROTECTED) */}
  <Route
    path="/recipes/:id/steps"
    element={
      <RequireAuth>
        <StepsEditor
          onDone={(id) => navigate(`/recipes/${id}`, { replace: true })}
        />
      </RequireAuth>
    }
  />

  {/* Recipe detail (PROTECTED) */}
  <Route
    path="/recipes/:id"
    element={
      <RequireAuth>
        <RecipeDetailRoute />
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
