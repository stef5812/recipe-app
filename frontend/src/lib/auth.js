export function setToken(token) {
    localStorage.setItem("token", token);
  }
  export function clearToken() {
    localStorage.removeItem("token");
  }
  export function isAuthed() {
    return !!localStorage.getItem("token");
  }
  