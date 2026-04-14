# eval-api2：离线指令排队（无需浏览器打开）

**描述**：当前的 `eval-api` 依赖 Vite HMR WebSocket，必须浏览器页面已打开并连接才能执行代码。希望做一个变式 `eval-api2`，在浏览器未打开时也能将指令排队或直接执行，页面打开后自动生效。

**可能方案**：
- 服务端维护一个待执行队列，页面打开后通过 HMR WS 自动下发。
- 或者将代码持久化到本地存储，页面加载时自动读取并执行。

**涉及文件**：`configs/api-eval-plugin.ts`、`scripts/eval-api.mjs`
