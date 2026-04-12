// frontend/src/lib/api.js

export const BASE = import.meta.env.DEV ? "" : "/recipe-app";
export const AUTH_BASE = import.meta.env.DEV ? "" : "https://auth.stefandodds.ie";

async function readResponse(res) {
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (typeof data === "string" && data) ||
      data?.error ||
      data?.message ||
      (Array.isArray(data?.issues) ? JSON.stringify(data.issues) : "") ||
      JSON.stringify(data);

    throw new Error(msg || `Request failed (${res.status})`);
  }

  return data;
}

// Recipe App API
export async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;
  const url = `${BASE}${apiPath}`;

  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    },
  });

  return readResponse(res);
}

// Central Auth API
export async function authApi(path, opts = {}) {
  const authPath = path.startsWith("/auth") ? path : `/auth${path}`;
  const url = `${AUTH_BASE}${authPath}`;

  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  return readResponse(res);
}

export async function getCurrentUser() {
  return authApi("/me");
}

export async function logout() {
  return authApi("/logout", { method: "POST" });
}

export async function addIngredient(recipeId, ingredient) {
  return api(`/recipes/${recipeId}/ingredients`, {
    method: "POST",
    body: JSON.stringify(ingredient),
  });
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function generateRecipe(payload) {
  return apiFetch("/me/ai/recipe/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function improveRecipe(payload) {
  return apiFetch("/me/ai/recipe/improve", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}