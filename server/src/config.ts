import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

export interface Config {
  port: number;
  publicDir: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number.parseInt(env.PORT ?? "3000", 10);
  return {
    port: Number.isFinite(port) ? port : 3000,
    // Compiled output lives at <package root>/dist/config.js, so the built
    // console the Dockerfile copies to <package root>/public is one level up.
    publicDir: path.resolve(here, "..", "public"),
  };
}
