const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

function getToken() {
  return localStorage.getItem("token");
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}



export async function addIngredient(recipeId, ingredient) {
  // expects ingredient: { name, amount, unit, note }
  return request(`/recipes/${recipeId}/ingredients`, {
    method: "POST",
    body: ingredient,
  });
}
