import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.resolve(__dirname, "../../uploads");

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "quizzy-dev-secret",
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:4173,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadsRoot,
};

export const questionUploadsDir = path.join(uploadsRoot, "questions");
