import express, { type Express } from "express";
import { loadConfig, type Config } from "./config.js";

export function createApp(config: Config = loadConfig()): Express {
  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req, res) => {
    res.status(200).send("ok");
  });

  return app;
}
