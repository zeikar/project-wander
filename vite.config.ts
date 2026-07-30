import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project under the repo name
// (zeikar.dev/project-wander/, since zeikar.dev is the user site's domain),
// but the dev server serves from the root — so the base only applies to builds.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/project-wander/" : "/",
}));
