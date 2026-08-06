import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const packageJson = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const baseConfig = JSON.parse(readFileSync(new URL("src-tauri/tauri.conf.json", root), "utf8"));
const backend = await readFile(new URL("src-tauri/src/lib.rs", root), "utf8");
const frontend = await readFile(new URL("src/main.ts", root), "utf8");
const workflow = await readFile(new URL(".github/workflows/ci.yml", root), "utf8");

test("build hook is runnable on Windows", () => {
  assert.equal(packageJson.scripts["wake:build"], "node scripts/build-platform.mjs");
  assert.ok(existsSync(new URL("scripts/build-platform.mjs", root)));
});

test("common bundle config is platform-neutral", () => {
  assert.equal(baseConfig.bundle.targets, "all");
  assert.equal("resources" in baseConfig.bundle, false);
});

test("platform overlays provide Windows NSIS and macOS helper settings", () => {
  assert.ok(existsSync(new URL("src-tauri/tauri.windows.conf.json", root)));
  assert.ok(existsSync(new URL("src-tauri/tauri.macos.conf.json", root)));
  const windows = JSON.parse(readFileSync(new URL("src-tauri/tauri.windows.conf.json", root), "utf8"));
  const macos = JSON.parse(readFileSync(new URL("src-tauri/tauri.macos.conf.json", root), "utf8"));
  assert.deepEqual(windows.bundle.targets, ["nsis"]);
  assert.match(JSON.stringify(macos.bundle.resources), /JarvisWakeListener\.app/);
});

test("non-macOS builds expose manual activation instead of a missing helper", () => {
  assert.match(backend, /cfg\(target_os = "macos"\)[\s\S]*fn start_wake_supervisor/);
  assert.match(backend, /"manual"/);
  assert.match(backend, /USERPROFILE/);
  assert.match(frontend, /手动启动 Voice|Manual activation/);
});

test("CI builds and uploads both desktop bundles", () => {
  assert.match(workflow, /macos-14/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /actions\/upload-artifact/);
});
