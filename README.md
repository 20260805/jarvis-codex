# Jarvis × Codex

一个 macOS 本地语音入口：说“嗨 Jarvis”后唤醒全息 GUI，并通过 Codex
app-server V3 WebRTC 进入同一个 Codex Voice 线程。

它不模拟点击 Codex/ChatGPT 窗口、不绑定全局热键，也不创建第二套 GPT-Live
会话。认证复用本机 Codex 登录；语音、文本、任务执行和工具事件属于同一个
Codex thread。

> 当前状态：已在 macOS 26 Apple Silicon 实机验证唤醒、实时转写、语音回复和
> Codex 任务执行。Codex realtime conversation 仍是实验性 app-server 能力，
> 上游协议升级时可能需要同步适配。

## 功能

- 本机唤醒词：嗨/嘿 Jarvis、Hi/Hey Jarvis、嗨/嘿贾维斯
- Tauri 2 + Rust + TypeScript 全息桌面 GUI
- 原生 AVFoundation 权限预检和 Hardened Runtime 音频 entitlement
- WebRTC 麦克风输入、实时音频输出和字幕
- `thread/realtime/start` V3 直连 Codex Voice
- Voice 自动调用 Codex 完成真实任务并继续语音回报
- STOP 终止 Voice、抑制 transcript tail，并中断晚到的 turn
- 文本输入可加入当前 Voice thread
- 工作目录可配置，每个目录持久化并续接自己的 Codex thread
- 高风险 app-server 请求必须在 Jarvis 界面确认
- 登录时后台启动，关闭窗口仅隐藏，继续监听唤醒词

## 系统要求

- macOS 13 或更高版本
- Node.js 20+
- Rust stable
- 已安装并登录 Codex CLI；GUI 应用从 Codex app-server 复用本机登录
- 麦克风和语音识别权限

## 本地开发

```bash
npm ci
npm run check
npm run dev
```

设置开发时默认工作目录：

```bash
JARVIS_WORKSPACE=/absolute/path npm run dev
```

也可以在 Jarvis 设置面板保存工作目录；重启后生效。

## 构建

```bash
npm run build
```

输出：

- `src-tauri/target/release/bundle/macos/Jarvis Codex.app`
- `src-tauri/target/release/bundle/dmg/Jarvis Codex_0.1.0_aarch64.dmg`

构建脚本会生成并签名 `JarvisWakeListener.app`。该产物不进入 Git。

## 生产发布

当前仓库默认用 ad-hoc 身份 `-` 方便本机开发。对外分发必须使用 Apple
Developer ID Application 证书并完成 notarization；否则 macOS 无法稳定识别升级
前后的同一应用身份，用户也可能再次遇到权限提示。

安装证书后，可用 Tauri 支持的环境变量覆盖本地 ad-hoc 配置：

```bash
APPLE_SIGNING_IDENTITY="Developer ID Application: Example (TEAMID)" \
APPLE_API_ISSUER="..." \
APPLE_API_KEY="..." \
APPLE_API_KEY_PATH="/absolute/path/AuthKey_XXX.p8" \
npm run build
```

证书、私钥和 Apple 凭据不得提交到仓库。详见
[生产发布清单](docs/PRODUCTION.md)。

## 隐私与安全

- 唤醒词强制使用 `requiresOnDeviceRecognition` 在本机识别。
- 只有唤醒后，麦克风音频才进入 Codex Voice WebRTC 会话。
- 不保存原始音频，不读取或写入登录凭据。
- WebView 使用限制性 CSP，不加载第三方字体或脚本。
- Codex thread 使用 `workspace-write` sandbox 和 `on-request` approval。
- Siri 不参与主链路。

架构和信任边界见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，安全问题报告方式
见 [SECURITY.md](SECURITY.md)。
