import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = process.env.DATABASE_URL || path.join(__dirname, "../../db.sqlite");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
