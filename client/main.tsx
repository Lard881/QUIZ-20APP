import "./global.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Ensure we only create the root once
const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

// Check if root already exists to prevent duplicate creation
let root = (container as any)._reactRoot;

if (!root) {
  root = createRoot(container);
  (container as any)._reactRoot = root;
}

root.render(<App />);
