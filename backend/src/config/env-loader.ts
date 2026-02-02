import { config } from "dotenv";
import { DEFAULT_ENV } from "./default-env";
import * as fs from "fs";
import * as path from "path";

/**
 * Load environment variables
 * Priority: .env file > default embedded config
 */
export function loadEnvironment() {
  // Try to load .env file
  const envPath = path.join(process.cwd(), ".env");

  if (fs.existsSync(envPath)) {
    console.log("✅ Loading environment from .env file");
    config();
  } else {
    console.log("⚠️  No .env file found, using embedded configuration");
    // Set default values
    Object.entries(DEFAULT_ENV).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  }
}
