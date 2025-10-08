import { defineConfig } from "drizzle-kit";
import envLoader from "./src/config/env_loader";

const db = defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: envLoader.getEnv("DATABASE_URL"),
  },
});

export default db;