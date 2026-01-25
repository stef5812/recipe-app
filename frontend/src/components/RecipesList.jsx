import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import Section from "./Section";
import PageContainer from "./PageContainer";

function getTokenPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function RecipesList({ onOpen, onNew, onBack  }) {
  const [recipes, setRecipes] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

  function resolveSrc(url) {
    const raw = String(url ?? "").replaceAll("\\", "/");
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
    return raw;
  }

  const isAdmin = useMemo(() => {
    const p = getTokenPayload();
    return Boolean(p?.isAdmin);
  }, []);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api("/recipes");
      setRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecipe(recipeId) {
    if (!confirm("Delete this recipe? This cannot be undone.")) return;

    try {
      await api(`/recipes/${recipeId}`, { method: "DELETE", auth: true });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    
    <PageContainer title="Recipes">

{onBack ? (
  <button
    type="button"
    onClick={onBack}
    style={{
      marginBottom: 10,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "8px 10px",
      background: "white",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    ← Back to home
  </button>
) : null}


      <Section title="All recipes">
        <div style={styles.headerRow}>
          <button
            type="button"
            onClick={() => onNew?.()}
            style={styles.newBtn}
            title="Create a new recipe"
          >
            ➕ New recipe
          </button>

          <button
            type="button"
            onClick={load}
            style={styles.refreshBtn}
            title="Refresh list"
          >
            ↻ Refresh
          </button>
        </div>

        {err ? <div style={styles.error}>{err}</div> : null}
        {loading ? <p style={{ opacity: 0.7 }}>Loading…</p> : null}

        {!loading && recipes.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No recipes yet.</p>
        ) : (
          <div style={styles.grid}>
            {recipes.map((r) => {
              // If your /recipes endpoint returns recipe_media with is_primary, grab it:
              const cover =
                r?.recipe_media?.find?.((m) => m.is_primary) ??
                r?.recipe_media?.[0] ??
                null;

              const coverUrl =
                cover?.url && cover?.media_type !== "video" ? resolveSrc(cover.url) : null;

              return (
                <div key={String(r.id)} style={styles.cardWrap}>
                  <button
                    type="button"
                    onClick={() => onOpen?.(String(r.id))}
                    style={styles.card}
                    className="recipe-card"
                    title="Open recipe"
                  >
                    {coverUrl ? (
                      <div style={styles.coverWrap}>
                        <img
                          src={coverUrl}
                          alt={cover?.caption || r.name}
                          style={styles.coverImg}
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <div style={styles.cardTop}>
                      <div style={styles.name}>{r.name}</div>
                      <div style={styles.chev}>›</div>
                    </div>

                    {r.description ? (
                      <div style={styles.desc}>{r.description}</div>
                    ) : (
                      <div style={{ ...styles.desc, opacity: 0.6 }}>(no description)</div>
                    )}

                    <div style={styles.metaRow}>
                      {r.source ? <span style={styles.pill}>Source: {r.source}</span> : null}
                      <span style={styles.pill}>ID: {String(r.id)}</span>
                    </div>
                  </button>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(String(r.id));
                      }}
                      style={styles.deleteBtn}
                      title="Delete recipe (admin)"
                    >
                      🗑
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </PageContainer>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  newBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 700,
  },
  refreshBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    opacity: 0.9,
  },
  error: {
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
    justifyContent: "center",
    marginTop: 10,
  },

  cardWrap: {
    position: "relative",
  },

  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "6px 8px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    opacity: 0.9,
  },

  card: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    padding: 14,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
  },

  coverWrap: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  coverImg: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    display: "block",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  chev: {
    fontSize: 22,
    opacity: 0.35,
    lineHeight: 1,
  },
  desc: {
    fontSize: 13,
    opacity: 0.85,
    lineHeight: 1.35,
    marginBottom: 10,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },
  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    fontSize: 12,
    padding: "5px 9px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
    opacity: 0.9,
  },
};
