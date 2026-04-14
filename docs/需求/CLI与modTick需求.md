# CLI 简化与 modTick 需求

## 1. CLI 简化工具

### 目标
在项目根目录通过极简命令调用 eval-api，无需手写 curl。

### 用法设计
```bash
# 单行指令
./eval-api -p 'window.helloStr'

# 多行指令
./eval-api -p <<'EOF'
const k = 3 + 2
window.helloStr = "modifier" + k
EOF

# 不带 pretty
./eval-api '1+1'
```

### 特性
- `-p` 可选，代表 pretty 输出
- 密码自动填充 `shikeik666`
- URL 固定 `http://127.0.0.1:5000/api/eval`
- 多行通过 stdin 自动支持（shell heredoc）
- 实际脚本位于 `scripts/eval-api.mjs`
- 根目录 `eval-api` 为可执行包装器

## 2. 长时间运行指令（modTick）

### 方案 A：modTick（推荐）
在游戏 `mainLoop` 中增加每帧钩子 `window.__TICK_TASKS__`。

#### 提交任务
```js
window.__TICK_TASKS__.push({
    id: 1,
    fn: (dt) => { p1.root.rotation.y += dt; }
});
```

#### 停止任务
```js
window.__TICK_TASKS__ = window.__TICK_TASKS__.filter(t => t.id !== 1);
```

#### 优点
- 与渲染帧同步，不卡 UI
- 自动获得 `dt` 时间增量
- 可管理、可停止

#### 缺点
- 需要修改游戏主循环源码

### 方案 B：setInterval
通过 eval-api 直接执行 `setInterval`。

#### 优点
- 不改源码，立刻可用

#### 缺点
- 不同步帧率，可能掉帧
- 无 `dt` 参数
- 停止麻烦，任务多了事件循环压力大

### 结论
优先实现 **方案 A（modTick）**，作为官方长期运行任务机制。
