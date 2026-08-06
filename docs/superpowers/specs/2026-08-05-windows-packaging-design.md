# macOS + Windows Jarvis Packaging Design

## Goal

Produce a cross-platform Jarvis Codex application where the existing macOS voice and wake-word path remains intact, while Windows can install and use the same Codex Voice and text-task workflow.

## Scope

- Keep the existing macOS AVFoundation wake listener and DMG bundle.
- Add a Windows build path that does not invoke zsh, Swift, AVFoundation, or macOS process paths.
- Keep Windows Voice and text tasks functional through the existing Codex app-server WebRTC path and visible microphone control.
- Generate a Windows NSIS installer on Windows. MSI is not required for the first verified package.
- Defer Linux-specific wake behavior and packaging refinements.

## Architecture

The Rust host will compile the existing macOS wake supervisor only on macOS. Non-macOS builds will expose the same Tauri commands with a deterministic manual-wake status instead of starting a missing native helper. The renderer will continue to use the microphone button and text input, so the core Voice and task path remains shared.

The base Tauri configuration will contain common settings. Platform-specific Tauri configuration will move macOS-only resources and DMG settings into `tauri.macos.conf.json`; Windows will select the NSIS target through `tauri.windows.conf.json`. The build hook will be a Node script that invokes the Swift helper builder only on macOS and is a no-op on Windows.

## Windows behavior

- The app opens normally after installation; Windows does not hide the only window behind a background-only autostart path.
- `arm_wake_listener` and `disarm_wake_listener` remain callable and return `authorization: "manual"`, `ready: false`.
- The renderer labels that state as manual activation and does not treat it as microphone denial.
- `request_microphone_permission` remains a browser/WebView permission check on Windows.
- Codex binary lookup checks the configured path, bundled resource, Windows PATH entries, and the user npm installation directory. The error message includes the Windows `JARVIS_CODEX_BIN` fallback.

## Error handling

Missing Codex, denied microphone permission, failed WebRTC negotiation, and unavailable macOS wake helper remain visible in the existing degraded state. Windows manual activation is informational and must not enter degraded mode.

## Verification

- Node tests verify platform-specific package targets, build hook behavior, manual activation labeling, and preservation of macOS helper configuration.
- `npm run web:build` and the existing Node test suite must pass.
- Rust formatting, compilation, and Tauri bundle generation are run when the local Rust/MSVC toolchain is available.
- macOS DMG generation is configuration-verified only from Windows; final DMG validation requires a macOS runner.
