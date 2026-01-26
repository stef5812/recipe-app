import { useState } from "react";
import { api } from "../lib/api";
import PageContainer from "./PageContainer";
import Section from "./Section";

const COUNTRY_OPTIONS = [
  "Not known",
  "Ireland",
  "United Kingdom",
  "France",
  "Italy",
  "Spain",
  "Portugal",
  "Germany",
  "Netherlands",
  "Belgium",
  "Hungary",
  "Africa",
  "United States",
  "Canada",
  "Australia",
  "New Zealand",
  "India",
  "China",
  "Japan",
  "Thailand",
  "Mexico",
];

const CATEGORY_OPTIONS = [
  { value: "ENTREE", label: "Entree" },
  { value: "SNACK", label: "Snack" },
  { value: "SOUP", label: "Soup" },
  { value: "STARTER", label: "Starter" },
  { value: "MAIN", label: "Main" },
  { value: "DESSERT", label: "Dessert" },
  { value: "CAKE", label: "Cake" },
  { value: "SWEET", label: "Sweet" },
  { value: "CONSERVE", label: "Conserve" },
];

export default function RecipeCreate({ onCreated, onBack }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");

  const [country, setCountry] = useState("Not known");
  const [category, setCategory] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErr("Please enter a recipe name.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || null,
        source: source.trim() || null,
        country: country || "Not known",
        category: category || null,
      };

      const created = await api("/recipes", {
        method: "POST",
        auth: true,
        body: payload,
      });

      const newId = created?.id ?? created?.recipe?.id;
      if (!newId) {
        throw new Error("Created recipe id was not returned by the server.");
      }

      onCreated?.(String(newId));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer title="New recipe">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
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
          ← Back to recipes
        </button>
      ) : null}
  
      {/* ✅ Hero image at top */}
      <div
        style={{
          marginBottom: 16,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          background: "#fafafa",
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1600&q=60"
          alt="Cooking ingredients"
          style={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
  
      <Section title="Create a recipe">
        {err ? <div style={styles.error}>{err}</div> : null}
  
        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Spaghetti Bolognese"
              autoFocus
            />
          </label>
  
          <label style={styles.label}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="Short description (optional)"
              rows={4}
            />
          </label>
  
          <label style={styles.label}>
            Source
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={styles.input}
              placeholder="Book / website / family / etc (optional)"
            />
          </label>
  
          <label style={styles.label}>
            Country
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={styles.select}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
  
          <label style={styles.label}>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              <option value="">(choose)</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
  
          <div style={styles.actions}>
            <button type="submit" disabled={saving} style={styles.primaryBtn}>
              {saving ? "Saving…" : "Save and add ingredients"}
            </button>
          </div>
        </form>
      </Section>
    </PageContainer>
  );
  }

const styles = {
  error: {
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 13,
  },
  form: {
    display: "grid",
    gap: 12,
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
  },
  input: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  textarea: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
  },
  select: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    background: "white",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  primaryBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 12px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontWeight: 800,
  },
};
