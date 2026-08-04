# Windows 常见问题排查

本文按“先验证环境，再定位应用”的顺序整理 Windows 11 x64 上最常见的部署问题。
所有命令均在 PowerShell 中执行。

## 先运行环境自检

```powershell
node --version
npm --version
rustc --version
cargo --version
where.exe codex
```

项目要求 Node.js 20+、Rust stable MSVC toolchain，以及可运行的 `codex.exe`。
任意一项找不到时，先修复该项，再运行：

```powershell
npm ci
npm run check
```

## `cargo` 或 `rustc` 不是可识别的命令

通常是 Rust 尚未安装，或安装后没有重新打开终端。

1. 使用 rustup 安装 Rust，并选择默认的 MSVC toolchain。
2. 关闭所有 PowerShell 和 VS Code 窗口后重新打开。
3. 再次运行 `cargo --version`。

如果 Rust 已安装但当前终端仍找不到，可临时补充当前用户 PATH：

```powershell
$env:Path += ";$HOME\.cargo\bin"
cargo --version
```

随后确认 toolchain：

```powershell
rustup default stable-msvc
rustup show
```

## Rust 提示缺少 linker、`link.exe` 或 Windows SDK

安装或修改 Visual Studio 2022 Build Tools，勾选：

- 使用 C++ 的桌面开发
- MSVC v143 C++ x64/x86 build tools
- Windows 10 或 Windows 11 SDK

安装完成后重启终端。仅安装 VS Code 或 Rust Analyzer 不能替代这些编译组件。

## `Windows .NET Framework C# compiler was not found`

Windows 唤醒器在开发和构建前会调用系统的 .NET Framework C# 编译器。先检查：

```powershell
Test-Path "$env:SystemRoot\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
Test-Path "$env:SystemRoot\Microsoft.NET\Framework\v4.0.30319\csc.exe"
```

两项都为 `False` 时，请安装或修复 Windows 的 .NET Framework 4.x 开发组件，然后
重新运行 `npm run wake:build`。

## `Windows System.Speech.dll was not found`

唤醒器依赖 Windows 桌面语音组件。请先完成 Windows 更新，并在系统的“语言和区域”
中为目标语言安装“语音”组件。然后重新运行：

```powershell
npm run wake:build
```

## 找不到 `codex.exe`

先确认 Codex 已安装并完成登录：

```powershell
where.exe codex
codex --version
```

如果 Codex 可以运行但 Jarvis 没有自动发现，可在当前 PowerShell 会话显式指定：

```powershell
$env:JARVIS_CODEX_BIN = 'C:\完整路径\codex.exe'
npm run dev
```

也可以在 Jarvis 设置面板选择该文件。请选择真正的 `.exe`，不要选择 `.cmd` 或
`.bat` 包装脚本。路径可以包含空格和中文。

## 窗口空白、WebView2 错误或应用无法显示

Windows 11 通常自带 Evergreen WebView2 Runtime。可先检查：

```powershell
Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F1E7E5D3-44A0-4A15-9A7F-54DB9A9F4A46}' -ErrorAction SilentlyContinue
```

没有结果时，从微软官方 WebView2 下载页安装 Evergreen Runtime，然后重新启动应用。
若仍为空白，更新显卡驱动并先用 `npm run dev` 查看终端错误。

## 没有语音识别器或中文唤醒无反应

在 Windows“设置 → 时间和语言 → 语言和区域”中，为目标语言安装“语音”组件。
可用下面的 PowerShell 命令查看桌面识别器：

```powershell
Add-Type -AssemblyName System.Speech
[System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() |
  Select-Object Description, Culture
```

需要强制使用中文识别器时：

```powershell
$env:JARVIS_WAKE_CULTURE = 'zh-CN'
npm run dev
```

`System.Speech` 一次只使用一个识别文化。安装中文语言包并不等于英文和中文唤醒词
一定能同时可靠识别，应分别在真实麦克风上测试。

## 麦克风被拒绝或唤醒后没有声音

进入“设置 → 隐私和安全性 → 麦克风”，同时打开：

- 麦克风访问
- 允许应用访问麦克风
- 允许桌面应用访问麦克风

修改后完全退出 Jarvis，再重新启动。还应检查系统默认麦克风和扬声器是否正确。

## Realtime、WebSocket 或 Voice 连接失败

依次确认：

1. Codex 已登录且 `codex --version` 可以正常执行。
2. 当前 Codex 版本支持 app-server realtime conversation。
3. 浏览器或 Codex 本身可以访问网络。
4. VPN 或代理没有阻断 WebSocket。

若需要显式指定代理，只对当前 PowerShell 会话设置：

```powershell
$env:HTTPS_PROXY = 'http://127.0.0.1:端口'
$env:HTTP_PROXY = $env:HTTPS_PROXY
npm run dev
```

Jarvis 也会尝试继承当前用户的 Windows 系统代理，但不会修改系统代理设置。网络瞬断
最多自动重连三次，权限错误和非网络错误不会无限重试。

## `npm ci` 失败

确认当前目录包含 `package-lock.json`，并使用 Node.js 20 或更高版本：

```powershell
node --version
npm cache verify
npm ci
```

不要把另一台电脑的 `node_modules` 复制过来；该目录不会上传到 GitHub。

## NSIS 安装包出现“未知发布者”或 SmartScreen 提示

本地构建的安装包默认没有 Windows 代码签名，因此可能显示“未知发布者”。这不代表
构建失败，但不适合直接面向公众分发。只运行自己构建或来源可信且已核对的安装包；
正式发布前应使用 Windows 代码签名证书签名。证书和密码不得提交到 GitHub。

## 如何收集诊断信息

优先在源码目录运行以下命令，并保留完整输出：

```powershell
npm run wake:build
npm test
npm run web:build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run dev
```

报告问题时请附上 Windows 版本、Node/Rust/Codex 版本、失败命令和第一段完整错误信息；
不要上传登录凭据、代理密码、证书或其他密钥。
