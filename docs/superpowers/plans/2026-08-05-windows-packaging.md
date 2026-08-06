# Windows Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Jarvis Codex Tauri project build a usable Windows NSIS installer while preserving the existing macOS DMG and wake-word path.

**Architecture:** Keep shared Voice, text-task, and UI logic unchanged. Compile macOS wake supervision only on macOS, return a manual activation status on other platforms, and split Tauri configuration into common, macOS, and Windows overlays.

**Tech Stack:** Tauri 2, Rust, TypeScript, Vite, Node test runner, macOS Swift/AVFoundation, Windows NSIS.

---

### Task 1: Add red tests for platform packaging contracts

**Files:**
- Create: `tests/platform-packaging.test.mjs`

- [ ] **Step 1: Write the failing tests**

Assert that the package script invokes a Node build hook, the common config uses the all-platform bundle mode without macOS-only resources, the Windows overlay selects NSIS, the macOS overlay retains the wake helper resource, and the renderer contains manual activation copy.

- [ ] **Step 2: Run the focused test**

Run `node --test tests/platform-packaging.test.mjs`.

Expected: assertion failures against the current zsh-only script and monolithic Tauri config.

### Task 2: Implement platform-aware build configuration

**Files:**
- Create: `scripts/build-platform.mjs`
- Create: `src-tauri/tauri.macos.conf.json`
- Create: `src-tauri/tauri.windows.conf.json`
- Modify: `package.json`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Implement the Node build hook**

On `process.platform === "darwin"`, spawn `zsh scripts/build-wake-helper.sh`; on other platforms, print a manual-wake notice and exit successfully.

- [ ] **Step 2: Move platform-only bundle settings**

Keep shared metadata and `targets: "all"` in the base config. Put the helper resource and macOS signing/DMG fields in the macOS overlay. Put `targets: ["nsis"]` and current-user install settings in the Windows overlay.

- [ ] **Step 3: Run the focused test**

Run `node --test tests/platform-packaging.test.mjs`.

Expected: PASS.

### Task 3: Add non-macOS host behavior before production changes

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/main.ts`

- [ ] **Step 1: Add the platform contract test**

Extend the focused Node test to require macOS-only wake supervisor symbols to be cfg-gated, a non-macOS manual status branch, Windows workspace fallback, and renderer copy for manual activation.

- [ ] **Step 2: Implement the smallest host change**

Gate helper path, supervisor, process termination, cold-wake replay, and macOS window activation blocks with `cfg(target_os = "macos")`. Add non-macOS command implementations that return `WakeStatus { authorization: "manual" }`. Add Windows PATH and `USERPROFILE` lookup for Codex and workspace defaults. Skip background-only autostart behavior outside macOS.

- [ ] **Step 3: Run focused tests and frontend build**

Run `node --test tests/platform-packaging.test.mjs tests/wav.test.mjs` and `npm run web:build`.

Expected: PASS.

### Task 4: Build and validate the Windows artifact

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Document Windows prerequisites and manual activation**

State that Windows requires Codex login, microphone permission, and the bundled NSIS installer; explain that system-level wake-word listening is macOS-only in this release and the Windows microphone button starts Voice.

- [ ] **Step 2: Run the full web and unit checks**

Run `npm test`, `npm run web:build`, and `cargo fmt --manifest-path src-tauri/Cargo.toml --check`.

Expected: PASS when Rust is installed.

- [ ] **Step 3: Build the Windows installer**

Run `npm run build` on Windows and verify the generated `src-tauri/target/release/bundle/nsis/*.exe` exists. Record any missing external toolchain limitation instead of claiming a package that was not built.
