import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { resolve } from "node:path";

const release = resolve(import.meta.dirname, "release");

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      adapter: adapter(),
      alias: {
        $release: release,
        "$release/*": `${release}/*`,
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: { allow: [release] },
  },
});
