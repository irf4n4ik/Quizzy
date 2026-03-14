import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

function run(command, options = {}) {
  return execSync(command, { stdio: "inherit", ...options });
}

function runCapture(command) {
  return execSync(command, { encoding: "utf8" });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureSchema() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      let output = "";
      try {
        output = runCapture("npx prisma migrate deploy");
      } catch (migrationError) {
        console.warn("Не удалось применить миграции Prisma, выполняется синхронизация схемы через db push.");
        if (migrationError instanceof Error && migrationError.message) {
          console.warn(migrationError.message.trim());
        }
        output = runCapture("npx prisma db push");
      }
      if (output) process.stdout.write(output);
      return;
    } catch (error) {
      if (attempt === 10) {
        throw error;
      }

      console.warn(`Ожидание Postgres перед повторной попыткой синхронизации схемы (${attempt}/10)...`);
      await wait(3000);
    }
  }
}

await ensureSchema();

const prisma = new PrismaClient();
const usersCount = await prisma.user.count();
await prisma.$disconnect();

if (usersCount === 0) {
  run("npm run prisma:seed");
}

await import("../dist/index.js");
