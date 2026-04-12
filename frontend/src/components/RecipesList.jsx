import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import Section from "./Section";
import PageContainer from "./PageContainer";
import { getCategoryCover } from "../lib/categoryCover";

import topImg from "../assets/top-page.png";

function getTokenPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function RecipesList({ onOpen, onNew, onBack, onOpenAiAssistant }) {
  const [recipes, setRecipes] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function resolveSrc(url) {
    const raw = String(url ?? "").trim().replaceAll("\\", "/");
    if (!raw) return "";

    if (/^https?:\/\//i.test(raw)) return raw;

    const isDev = import.meta.env.DEV;

    if (isDev) {
      if (raw.startsWith("/recipe-app/api/uploads/")) {
        return raw.replace("/recipe-app/api", "");
      }
      if (raw.startsWith("recipe-app/api/uploads/")) {
        return `/${raw.replace(/^recipe-app\/api/, "")}`;
      }
      if (raw.startsWith("/uploads/")) return raw;
      if (raw.startsWith("uploads/")) return `/${raw}`;

      const recipeUploadsIndex = raw.indexOf("/recipe-app/api/uploads/");
      if (recipeUploadsIndex !== -1) {
        return raw.slice(recipeUploadsIndex).replace("/recipe-app/api", "");
      }

      const uploadsIndex = raw.indexOf("/uploads/");
      if (uploadsIndex !== -1) {
        return raw.slice(uploadsIndex);
      }

      return `/uploads/${raw}`;
    }

    if (raw.startsWith("/recipe-app/api/uploads/")) return raw;
    if (raw.startsWith("recipe-app/api/uploads/")) return `/${raw}`;

    if (raw.startsWith("/uploads/")) return `/recipe-app/api${raw}`;
    if (raw.startsWith("uploads/")) return `/recipe-app/api/${raw}`;

    const recipeUploadsIndex = raw.indexOf("/recipe-app/api/uploads/");
    if (recipeUploadsIndex !== -1) {
      return raw.slice(recipeUploadsIndex);
    }

    const plainRecipeUploadsIndex = raw.indexOf("recipe-app/api/uploads/");
    if (plainRecipeUploadsIndex !== -1) {
      return `/${raw.slice(plainRecipeUploadsIndex)}`;
    }

    const uploadsIndex = raw.indexOf("/uploads/");
    if (uploadsIndex !== -1) {
      return `/recipe-app/api${raw.slice(uploadsIndex)}`;
    }

    const plainUploadsIndex = raw.indexOf("uploads/");
    if (plainUploadsIndex !== -1) {
      return `/recipe-app/api/${raw.slice(plainUploadsIndex)}`;
    }

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
      <div style={styles.topImageWrap}>
        <img
          src={topImg}
          alt="Recipes"
          style={styles.topImage}
          loading="lazy"
        />
      </div>

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          style={styles.backBtn}
        >
          ← Back to home
        </button>
      ) : null}

      <Section title="All recipes">
        <div style={styles.headerRow}>
          <button
            type="button"
            onClick={() => onNew?.()}
            style={styles.primaryBtn}
            title="Create a new recipe"
          >
            ➕ New recipe
          </button>

          <button
            type="button"
            onClick={load}
            style={styles.secondaryBtn}
            title="Refresh list"
          >
            ↻ Refresh
          </button>
        </div>

        {err ? <div style={styles.error}>{err}</div> : null}
        {loading ? <p style={styles.loadingText}>Loading…</p> : null}

        {!loading && recipes.length === 0 ? (
          <p style={styles.emptyText}>No recipes yet.</p>
        ) : (
          <div style={styles.grid}>
            <div style={styles.cardWrap}>
              <button
                type="button"
                onClick={() => onOpenAiAssistant?.()}
                style={{ ...styles.card, ...styles.aiCard }}
                className="recipe-card"
                title="Open AI Recipe Assistant"
              >
                <div style={styles.coverWrap}>
                  <div style={styles.aiCover}>
                    <div style={styles.aiBadge}>AI</div>
                  </div>
                </div>

                <div style={styles.cardTop}>
                  <div style={styles.name}>AI Recipe Assistant</div>
                  <div style={styles.chev}>›</div>
                </div>

                <div style={styles.desc}>
                  Generate a brand new recipe from a prompt, or improve an existing one with AI.
                </div>

                <div style={styles.metaRow}>
                  <span style={styles.pill}>AI tools</span>
                  <span style={styles.pill}>Create faster</span>
                </div>
              </button>
            </div>

            {recipes.map((r) => {
              const cover =
                r?.recipe_media?.find?.((m) => m.is_primary) ??
                r?.recipe_media?.[0] ??
                null;

              const coverUrl =
                cover?.url && cover?.media_type !== "video"
                  ? resolveSrc(cover.url)
                  : getCategoryCover(r.category);

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
                      <div style={{ ...styles.desc, opacity: 0.6 }}>
                        (no description)
                      </div>
                    )}

                    <div style={styles.metaRow}>
                      {r.source ? (
                        <span style={styles.pill}>Source: {r.source}</span>
                      ) : null}
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
  topImageWrap: {
    maxWidth: 720,
    margin: "0 auto 16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
  },

  topImage: {
    width: 160,
    height: 110,
    objectFit: "cover",
    borderRadius: 12,
    display: "block",
  },

  backBtn: {
    marginBottom: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },

  headerRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
  },

  primaryBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 14px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
  },

  secondaryBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 14px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.2,
    opacity: 0.95,
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

  loadingText: {
    opacity: 0.7,
    fontSize: 14,
  },

  emptyText: {
    opacity: 0.7,
    fontSize: 14,
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

  aiCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
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

  aiCover: {
    width: "100%",
    height: 140,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 35%, #f8fafc 100%)",
  },

  aiBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 800,
    color: "#334155",
    boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
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