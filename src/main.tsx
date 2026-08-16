import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import "./polyfills";
import { CpuLab } from "../components/cpu-lab";
import "../app/globals.css";

inject({ mode: import.meta.env.PROD ? "production" : "development" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CpuLab />
  </StrictMode>,
);
