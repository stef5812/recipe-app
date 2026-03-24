// backend/src/middleware/auth.js

function getAuthMeUrl() {
  if (process.env.AUTH_ME_URL) return process.env.AUTH_ME_URL;

  if (process.env.NODE_ENV === "production") {
    return "https://auth.stefandodds.ie/auth/me";
  }

  return "http://127.0.0.1:3001/auth/me";
}

export async function requireAuth(req, res, next) {
  try {
    const cookie = req.headers.cookie || "";

    if (!cookie) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const response = await fetch(getAuthMeUrl(), {
      method: "GET",
      headers: {
        cookie,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const data = await response.json();

    if (!data?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const appRoles = Array.isArray(data.appRoles) ? data.appRoles : [];
    const recipeRoleEntry = appRoles.find((r) => r.app === "RECIPE_APP");

    req.user = {
      sub: data.user.id,
      email: data.user.email || null,
      displayName: data.user.displayName || null,
      role: recipeRoleEntry?.role || null,
      appRoles,
      authUser: data.user,
    };

    req.userId = data.user.id;
    req.isAdmin = recipeRoleEntry?.role === "ADMIN";

    next();
  } catch (err) {
    console.error("requireAuth failed:", err);
    return res.status(401).json({ error: "Not authenticated" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}