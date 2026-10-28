import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const directories = [
  "01-shopflow",
  "02-bookease",
  "03-clientdesk",
  "04-supportpilot",
  "05-servicehub",
];
const action = process.argv[2];
const argsByAction = {
  install: ["ci"],
  build: ["run", "build"],
  test: ["test"],
};
if (!argsByAction[action] || !process.env.npm_execpath) {
  console.error(
    "Use npm run install:all, npm run build:all, or npm test from the pack folder.",
  );
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const directory of directories) {
  console.log(`\n${directory}: ${action}`);
  const status = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [process.env.npm_execpath, ...argsByAction[action]],
      {
        cwd: path.join(root, directory),
        stdio: "inherit",
        env: process.env,
      },
    );
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (status !== 0) process.exit(status);
}
console.log(`\nAll five projects: ${action} passed.`);
