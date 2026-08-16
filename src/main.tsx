import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./polyfills";
import { CpuLab } from "../components/cpu-lab";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CpuLab />
  </StrictMode>,
);
