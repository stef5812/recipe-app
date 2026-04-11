import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import faviconUrl from "./assets/favicon.ico";

const faviconEl =
  document.querySelector('link[rel="icon"]') || document.createElement("link");
faviconEl.setAttribute("rel", "icon");
faviconEl.setAttribute("type", "image/x-icon");
faviconEl.setAttribute("href", faviconUrl);

if (!document.head.contains(faviconEl)) {
  document.head.appendChild(faviconEl);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/recipe-app">
      <App />
    </BrowserRouter>
  </StrictMode>
);
