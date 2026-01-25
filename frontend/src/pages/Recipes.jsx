import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Recipes({ onOpen }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/recipes")
      .then(setItems)
      .catch(e => setErr(e.message));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>Recipes</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <ul>
        {items.map(r => (
          <li key={r.id}>
            <button onClick={() => onOpen?.(r.id)}>{r.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

