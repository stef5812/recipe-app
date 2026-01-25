import { useMemo, useState } from "react";
import { api } from "../lib/api";
import "./mediaGallery.css";


const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";



function resolveSrc(url) {
  const raw = (url ?? "").replaceAll("\\", "/");
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return raw;
}

export default function MediaGallery({ recipeId, media = [], onChanged }) {
  const [viewer, setViewer] = useState(null); // { src, caption }
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const items = useMemo(() => media ?? [], [media]);

  async function makePrimary(mediaId) {
    setErr("");
    setBusyId(String(mediaId));
    try {
      await api(`/recipes/${recipeId}/media/${mediaId}`, {
        method: "PATCH",
        auth: true,
        body: { is_primary: true },
      });
      await onChanged?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(mediaId) {
    if (!confirm("Delete this media?")) return;
    setErr("");
    setBusyId(String(mediaId));
    try {
      await api(`/recipes/${recipeId}/media/${mediaId}`, {
        method: "DELETE",
        auth: true,
      });
      await onChanged?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function copyLink(src) {
    navigator.clipboard?.writeText(src);
  }

  return (
    <div style={styles.panel}>

      <div style={styles.headerRow}>
        <h3 style={styles.h3}>Media</h3>
        <div style={styles.count}>{items.length} item(s)</div>
      </div>

      {err ? <div style={styles.error}>{err}</div> : null}

      {items.length === 0 ? (
        <p style={styles.empty}>No media yet.</p>
      ) : (
        <div style={styles.grid}>
          {items.map((m) => {
            const src = resolveSrc(m.url);
            const isBusy = busyId === String(m.id);

            return (
              <div
                key={String(m.id)}
                className="media-card"
                style={{
                  ...styles.card,
                  ...(m.is_primary ? styles.primaryCard : null),
                  ...(isBusy ? styles.busyCard : null),
                }}
              >
                <button
                  type="button"
                  className="media-thumb"
                  onClick={() => setViewer({ src, caption: m.caption })}
                  style={styles.thumbBtn}
                  title="View"
                  disabled={isBusy}
                >
                  <img
                    src={src}
                    alt={m.caption ?? "recipe media"}
                    style={styles.thumb}
                    loading="lazy"
                  />
                  <div className="media-thumb-overlay" style={styles.thumbOverlay}>
                      <span className="media-overlay-icon" style={styles.overlayIcon}>🔍</span>
                  </div>
                  {m.is_primary ? <div style={styles.badge}>★ Primary</div> : null}
                </button>

                <div style={styles.meta}>
                  <div style={styles.captionRow}>
                    <div style={styles.caption} title={m.caption ?? ""}>
                      {m.caption ? m.caption : <span style={styles.muted}>(no caption)</span>}
                    </div>
                  </div>

                  <div style={styles.actions}>
                  <button
                    type="button"
                    className="media-action"
                    onClick={() => copyLink(src)}
                    disabled={isBusy}
                    style={styles.iconBtn}
                  >

                      🔗 <span style={styles.btnText}>Copy</span>
                    </button>

                    {!m.is_primary ? (
                      <button
                        type="button"
                        className="media-action"
                        onClick={() => makePrimary(m.id)}
                        disabled={isBusy}
                        style={styles.iconBtn}
                        title="Make primary"
                      >
                        ★ <span style={styles.btnText}>Primary</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="media-action"
                        disabled
                        style={{ ...styles.iconBtn, ...styles.disabledBtn }}
                        title="Already primary"
                      >
                        ★ <span style={styles.btnText}>Primary</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="media-action"
                      onClick={() => remove(m.id)}
                      disabled={isBusy}
                      style={{ ...styles.iconBtn, ...styles.dangerBtn }}
                      title="Delete"
                    >
                      🗑 <span style={styles.btnText}>{isBusy ? "Working..." : "Delete"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewer ? (
        <div style={styles.modalOverlay} onClick={() => setViewer(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <img src={viewer.src} alt={viewer.caption ?? "media"} style={styles.modalImg} />
            <div style={styles.modalCaption}>{viewer.caption ?? ""}</div>
            <div style={styles.modalActions}>
              <button type="button" className="media-action" onClick={() => setViewer(null)} style={styles.iconBtn}>
                ✖ <span style={styles.btnText}>Close</span>
              </button>
              <a href={viewer.src} target="_blank" rel="noreferrer" style={styles.linkBtn}>
                ⤴ <span style={styles.btnText}>Open</span>
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {

    panel: {
        marginTop: 18,
        maxWidth: 1100,
        marginInline: "auto",
        padding: 16,
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        background: "#fafafa",
      },

  headerRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  h3: { margin: 0, fontSize: 16 },
  count: { fontSize: 12, opacity: 0.7 },

  error: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },
  empty: { opacity: 0.7 },

  grid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
    justifyContent: "center",
  },
  

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "white",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transform: "translateY(0)",
    transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
  },
  primaryCard: {
    borderColor: "#111827",
  },
  busyCard: {
    opacity: 0.7,
  },

  // thumbnail as a button so it’s accessible + clickable
  thumbBtn: {
    width: "100%",
    border: "none",
    padding: 0,
    margin: 0,
    background: "transparent",
    display: "block",
    cursor: "pointer",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: 170,
    objectFit: "cover",
    display: "block",
  },
  thumbOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0)",
    transition: "background 140ms ease",
  },
  overlayIcon: {
    transform: "scale(0.9)",
    opacity: 0,
    transition: "opacity 140ms ease, transform 140ms ease",
    color: "white",
    fontSize: 22,
    textShadow: "0 2px 10px rgba(0,0,0,0.35)",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "rgba(17,24,39,0.92)",
    color: "white",
    fontSize: 12,
    padding: "5px 9px",
    borderRadius: 999,
    letterSpacing: 0.2,
  },

  meta: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  captionRow: { display: "flex", justifyContent: "space-between", gap: 10 },
  caption: {
    fontSize: 13,
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  muted: { opacity: 0.6 },

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  iconBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
  },
  btnText: { fontSize: 13 },
  dangerBtn: {
    borderColor: "#fecaca",
    color: "#991b1b",
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 50,
  },
  modal: {
    width: "min(920px, 96vw)",
    background: "white",
    borderRadius: 16,
    padding: 12,
    boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
  },
  modalImg: {
    width: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    display: "block",
    borderRadius: 12,
    background: "#f3f4f6",
  },
  modalCaption: {
    marginTop: 10,
    fontSize: 13,
    opacity: 0.85,
  },
  modalActions: {
    marginTop: 12,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  linkBtn: {
    textDecoration: "none",
    color: "inherit",
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "white",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
};
