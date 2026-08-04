import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

if (process.platform === "win32") {
  const root = process.env.SystemRoot ?? "C:\\Windows";
  const compilerCandidates = [
    `${root}\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe`,
    `${root}\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe`,
  ];
  const compiler = compilerCandidates.find(existsSync);
  if (!compiler) {
    throw new Error("Windows .NET Framework C# compiler was not found.");
  }
  const speechGac = `${root}\\Microsoft.NET\\assembly\\GAC_MSIL\\System.Speech`;
  const speechAssembly = existsSync(speechGac)
    ? readdirSync(speechGac, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${speechGac}\\${entry.name}\\System.Speech.dll`)
        .find(existsSync)
    : undefined;
  if (!speechAssembly) {
    throw new Error("Windows System.Speech.dll was not found.");
  }
  const source = fileURLToPath(
    new URL("../src-tauri/wake-helper/JarvisWakeListener.cs", import.meta.url),
  );
  const output = fileURLToPath(
    new URL("../src-tauri/wake-helper/JarvisWakeListener.exe", import.meta.url),
  );
  const result = spawnSync(
    compiler,
    [
      "/nologo",
      "/optimize+",
      "/target:winexe",
      `/out:${output}`,
      `/reference:${speechAssembly}`,
      source,
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

if (process.platform !== "darwin") {
  console.log(`No native wake helper is required for ${process.platform}.`);
  process.exit(0);
}

const script = fileURLToPath(new URL("./build-wake-helper.sh", import.meta.url));
const result = spawnSync("zsh", [script], { stdio: "inherit" });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
