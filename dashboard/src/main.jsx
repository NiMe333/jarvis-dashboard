import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import { dashboardCopy } from "./config/dashboardContent.js";
import "./styles/globals.css";

document.title = dashboardCopy.app.documentTitle;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
