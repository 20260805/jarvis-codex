import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function buildWakeHelper(platform = process.platform, spawn = spawnSync) {
  if (platform !== "darwin") {
    console.log("Skipping the macOS wake helper; this platform uses manual Voice activation.");
    return 0;
  }

  const result = spawn("zsh", ["scripts/build-wake-helper.sh"], { stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const entrypoint = process.argv[1] && path.resolve(process.argv[1]);
if (entrypoint === path.resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = buildWakeHelper();
}
