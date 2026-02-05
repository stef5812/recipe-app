import { useEffect, useState } from "react";

import Section from "./Section";
import { api } from "../lib/api";

import loginChef from "../assets/login-chef.png";
import registerChef from "../assets/register.png";
import createRecipeImg from "../assets/create-recipe.png";
import searchImg from "../assets/search.png";
import viewRecipesImg from "../assets/view-recipes.png";

import recipeHeader from "../assets/recipe-header.jpg";




const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const CTA_ICON_width = 150;
const CTA_ICON_height = 150;


function resolveSrc(url) {
  const raw = (url ?? "").replaceAll("\\", "/");
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return raw;
}

function useIsNarrow(breakpoint = 900) {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isNarrow;
}


export default function Home({
  isAuthed,
  onGoLogin,
  onRegister,
  onGoRecipes,
  onCreateRecipe,
  onOpenRecipe,
  onLogout
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [results, setResults] = useState(null); // {count, recipes}
  const isNarrow = useIsNarrow(900);

  const content = {
    wrap: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "40px 16px",
    },
  };

  const imgBtn = {
    button: {
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      borderRadius: 16,
      lineHeight: 0, // stops extra spacing under image
    },
    img: {
      width: 170,          // tweak this size
      height: "auto",
      display: "block",
      borderRadius: 16,
      transition: "transform 0.15s ease, filter 0.15s ease",
    },
  };
  
  

  async function search(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await api(`/recipes/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={page.container}>
      {/* NEW: Top image + intro */}
      <div style={hero.wrap}>
        <img
          src={recipeHeader}
          alt="Recipe book hero"
          style={hero.img}
        />
        <div style={hero.overlay} />
        <div style={hero.content}>
          <div style={hero.title}>Mum's recipes</div>
          <div style={hero.subtitle}>
            While travelling with my family, my mum discovered wonderful recipes from around the world.
            This is our place to share them — and for everyone to add their own favourite dishes.
          </div>
        </div>
      </div>


      {/* Existing hero area (search + CTA + tip) */}
      <div style={content.wrap}>
      <div
        style={{
        ...page.hero,
        gridTemplateColumns: isNarrow ? "1fr" : "1.2fr 0.8fr",
      }}
      >

        <div>
          <h1 style={page.h1}>Search</h1>
          <p style={page.sub}>Search recipes by ingredients (e.g. “onion tomato garlic”).</p>

          <form onSubmit={search} style={page.searchRow}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ingredients…"
              style={page.searchInput}
            />

            <button
              className="app-btn"
              type="submit"
              disabled={busy}
              aria-label="Search recipes"
              title="Search recipes"
              style={{
                ...imgBtn.button,
                opacity: busy ? 0.6 : 1,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              <img
                src={searchImg}
                alt="Search"
                style={{
                  ...imgBtn.img,
                  width: 90,
                  filter: busy ? "grayscale(1)" : "none",
                }}
              />
            </button>

          </form>

          {err ? <div style={page.error}>{err}</div> : null}

          <div style={page.ctas}>
  {!isAuthed ? (
    <>
      {/* Login */}
      <div style={page.ctaCol}>
        <button
          className="app-btn"
          onClick={onGoLogin}
          aria-label="Log in"
          title="Log in"
          style={imgBtn.button}
          type="button"
        >
          <img
            src={loginChef}
            alt="Log in"
            style={{ ...imgBtn.img, width: CTA_ICON_width, height: CTA_ICON_height }}
          />
        </button>
        <div style={{ fontSize: 13, opacity: 0.75, textAlign: "center" }}>Login</div>
      </div>

      {/* Register */}
      <div style={page.ctaCol}>
        <button
          className="app-btn"
          onClick={onRegister}
          aria-label="Register"
          title="Register"
          style={imgBtn.button}
          type="button"
        >
          <img
            src={registerChef}
            alt="Register"
            style={{ ...imgBtn.img, width: CTA_ICON_width, height: CTA_ICON_height }}
          />
        </button>
        <div style={{ fontSize: 13, opacity: 0.75, textAlign: "center" }}>Register</div>
      </div>
    </>
  ) : (
    /* Logged in: ONLY ONE view recipes block */
    <div style={page.ctaCol}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <button
          className="app-btn"
          onClick={onGoRecipes}
          aria-label="View recipes"
          title="View recipes"
          style={imgBtn.button}
          type="button"
        >
          <img
            src={viewRecipesImg}
            alt="View recipes"
            style={{ ...imgBtn.img, width: CTA_ICON_width, height: CTA_ICON_height }}
          />
        </button>

        <div style={{ fontSize: 13, opacity: 0.75, textAlign: "center" }}>View recipes</div>

        <button type="button" className="app-btn" onClick={onLogout} style={page.logoutBtn}>
          Log out
        </button>
      </div>
    </div>
  )}

  {/* Add recipes (always shown; disabled when not authed) */}
  <div style={page.ctaCol}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button
        className="app-btn"
        onClick={onCreateRecipe}
        disabled={!isAuthed}
        aria-label="Create recipe"
        title={!isAuthed ? "Log in to create recipes" : "Create recipe"}
        style={{
          ...imgBtn.button,
          opacity: isAuthed ? 1 : 0.4,
          cursor: isAuthed ? "pointer" : "not-allowed",
        }}
        type="button"
      >
        <img
          src={createRecipeImg}
          alt="Create recipe"
          style={{
            ...imgBtn.img,
            width: CTA_ICON_width,
            height: CTA_ICON_height,
            filter: !isAuthed ? "grayscale(1)" : "none",
          }}
        />
      </button>

      <div style={{ fontSize: 13, opacity: 0.75, textAlign: "center" }}>Add recipes</div>
    </div>
  </div>
</div>


          {!isAuthed ? <p style={page.note}>Log in to create recipes and upload photos.</p> : null}
        </div>

        <div style={page.kpiCard}>
          <div style={page.kpiLabel}>Tip</div>
          <div style={page.kpiValue}>AND search</div>
          <div style={page.kpiHint}>“onion tomato” finds recipes containing both.</div>
        </div>
      </div>
      </div>

      <div style={content.wrap}>
      <div style={page.sections}>
        <Section title="Search results">
          {!results ? (
            <p style={{ opacity: 0.7, margin: 0 }}>Try searching for one or more ingredients.</p>
          ) : results.count === 0 ? (
            <p style={{ opacity: 0.7, margin: 0 }}>
              No matches for: <strong>{results.tokens.join(", ") || "(empty)"}</strong>
            </p>
          ) : (
            <div style={grid.wrap}>
              {results.recipes.map((r) => {
                const cover = r.recipe_media?.[0]?.url ? resolveSrc(r.recipe_media[0].url) : null;
                return (
                  <button
                    key={String(r.id)}
                    type="button"
                    onClick={() => onOpenRecipe?.(String(r.id))}
                    style={grid.card}
                    title="Open recipe"
                  >
                    {cover ? (
                      <img src={cover} alt={r.name} style={grid.thumb} />
                    ) : (
                      <div style={grid.thumbPlaceholder}>No image</div>
                    )}

                    <div style={grid.body}>
                      <div style={grid.name}>{r.name}</div>
                      {r.source ? <div style={grid.pill}>{r.source}</div> : null}
                      <div style={grid.desc}>
                        {r.description ?? <span style={{ opacity: 0.6 }}>(no description)</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
    </div>
  );
}



const page = {
  container: {
    width: "100%",
    margin: "0 auto",
  },

  ctaCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },  

  registerLink: {
    background: "none",
    border: "none",
    padding: 0,
    fontSize: 13,
    color: "#111827",
    opacity: 0.75,
    cursor: "pointer",
    textUnderlineOffset: 3,

    textDecoration: "underline",
  },


  
  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 16,
    alignItems: "stretch",
    marginBottom: 16,
  },

  h1: { margin: 0, fontSize: 28, letterSpacing: -0.2 },
  sub: { margin: "10px 0 0", opacity: 0.8, lineHeight: 1.4 },

  searchRow: { marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" },
  searchInput: {
    flex: 1,
    minWidth: 260,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
  },
  searchBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },

  logoutBtn: {
    width: "fit-content",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },

  ctas: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  note: { marginTop: 10, fontSize: 13, opacity: 0.7 },

  kpiCard: {
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  kpiLabel: { fontSize: 12, opacity: 0.7 },
  kpiValue: { fontSize: 26, fontWeight: 700, lineHeight: 1.1, marginTop: 6 },
  kpiHint: { fontSize: 12, opacity: 0.7, marginTop: 6 },

  sections: { display: "flex", flexDirection: "column", gap: 16 },
};

const hero = {
  wrap: {
    position: "relative",
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "white",
    marginBottom: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },
  img: {
    width: "100%",
    height: 260,
    objectFit: "cover",
    display: "block",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)",
  },
  content: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 18,
    gap: 8,
    color: "white",
  },
  title: {
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: -0.3,
    lineHeight: 1.05,
    textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  },
  subtitle: {
    maxWidth: 720,
    fontSize: 14,
    lineHeight: 1.45,
    opacity: 0.95,
    textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  },
};

const btn = {
  primary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
  },
  secondary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
  },
};

const grid = {
  wrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  card: {
    textAlign: "left",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    cursor: "pointer",
    overflow: "hidden",
    padding: 0,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  thumb: { width: "100%", height: 140, objectFit: "cover", display: "block" },
  thumbPlaceholder: {
    width: "100%",
    height: 140,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    color: "#6b7280",
    fontSize: 13,
  },
  body: { padding: 12, display: "grid", gap: 8 },
  name: { fontSize: 15, fontWeight: 700 },
  pill: {
    width: "fit-content",
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#374151",
  },
  desc: { fontSize: 13, lineHeight: 1.35, color: "#374151" },
};
