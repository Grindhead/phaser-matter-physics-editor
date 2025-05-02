import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: process.cwd(),
  base: "./",
  build: {
    outDir: "dist/editor",
    rollupOptions: {
      input: {
        editor: resolve(process.cwd(), "index.editor.html"),
      },
    },
  },
  plugins: [
    {
      name: "editor-html-rewrite",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/" || req.url === "/index.html") {
            req.url = "/index.editor.html";
          }
          next();
        });
      },
    },
  ],
});
