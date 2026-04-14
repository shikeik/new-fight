# eval-api 指令大全

> 本文档只收录**通用**和**常驻 API** 指令。它们不依赖具体业务代码，在任何接入了 eval-api HMR 桥的页面都能用（其中 `modTick`、`__ALL_LOGS__` 等需要目标页面已注入对应基础设施）。
> 
> 涉及 `p1` / `p2` / `CFG` / `scene` 等具体业务变量的指令，请到项目源码或业务相关文档中查看。

---

## 调用方式

项目已注册全局快捷指令 `eval-api`，所有示例默认使用它。如果你在其他没有注册 CLI 的环境，可直接用 `curl` 等效替换：

| 场景 | `eval-api` 写法 | 等效 `curl` 写法 |
|------|----------------|------------------|
| 单行 | `eval-api '1+1'` | `curl -s -X POST --data-binary '1+1' 'http://localhost:5000/api/eval?shikeik666'` |
| 多行 | `eval-api <<'EOF' ... EOF` | `curl -s -X POST --data-binary @- 'http://localhost:5000/api/eval?shikeik666'` |
| 美观输出 | `eval-api -p '1+1'` | 在 URL 后加 `&pretty`，即 `...?shikeik666&pretty` |

**注意**：密码参数 `shikeik666` 必须放在 `pretty` 之前，否则会被解析为密码而鉴权失败。

---

## 页面与浏览器信息

### 获取当前页面标题和 URL
```bash
eval-api -p '({ title: document.title, url: location.href })'
```

### 获取屏幕尺寸
```bash
eval-api -p '({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio })'
```

### 修改页面标题
```bash
eval-api 'document.title = "👑 DEBUG MODE"'
```

---

## DOM 操作

### 点击某个按钮
```bash
eval-api 'document.getElementById("start-btn").click()'
```

### 修改任意元素样式
```bash
eval-api "document.querySelector('canvas').style.filter = 'hue-rotate(90deg) contrast(1.5)'"
eval-api "document.querySelector('canvas').style.filter = 'none'"
```

### 修改任意元素文本
```bash
eval-api "document.getElementById('combo-txt').innerText = '999 HITS!'"
```

---

## 浏览器原生存储与网络

### 列出所有 IndexedDB 数据库
```bash
eval-api -p '(async () => await indexedDB.databases())()'
```

### 读取 localStorage
```bash
eval-api -p '({ ...localStorage })'
```

### 发送一个自定义请求
```bash
eval-api '(async () => await fetch("https://httpbin.org/get").then(r => r.json()))()'
```

---

## 常驻 API：浏览器日志 (`__ALL_LOGS__`)

> 需要目标页面已注入 `window.__ALL_LOGS__` 日志捕获模块。

### 获取全部日志
```bash
eval-api -p 'window.__ALL_LOGS__'
```

### 获取最近 20 条日志
```bash
eval-api -p 'window.__ALL_LOGS__.slice(-20)'
```

### 只看 error 级别日志
```bash
eval-api -p 'window.__ALL_LOGS__.filter(l => l.level === "error")'
```

### 从某个时间之后筛选
```bash
eval-api -p 'window.__ALL_LOGS__.filter(l => l.time > "14:30:00")'
```

---

## 常驻 API：每帧任务调度 (`modTick`)

> 需要目标页面已注入 `window.modTick` 调度器（内部基于 `window.__TICK_TASKS__` 在渲染主循环中执行）。

### 添加一个每帧旋转任务（示例 ID 为 `1`）
```bash
eval-api 'modTick.add(1, dt => { if(window.box) window.box.rotation.y += dt * 2; })'
```

### 添加一个每帧缩放脉冲（示例 ID 为 `2`）
```bash
eval-api 'modTick.add(2, dt => { const s = 1 + Math.sin(Date.now()*0.005)*0.3; if(window.box) window.box.scale.set(s,s,s); })'
```

### 停止指定 ID 的任务
```bash
eval-api 'modTick.remove(1)'
```

### 停止全部任务
```bash
eval-api 'modTick.clear()'
```

### 查看当前任务 ID 列表
```bash
eval-api 'modTick.list()'
```

---

## 通用高级技巧

### 自动发送键盘事件
```bash
eval-api <<'EOF'
const autoAtk = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyJ'}));
  setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyJ'})), 80);
};
const id = setInterval(autoAtk, 200);
setTimeout(() => clearInterval(id), 3000);
'auto keypress 3s'
EOF
```

### 在页面执行任意异步逻辑
```bash
eval-api -p <<'EOF'
(async () => {
  const t0 = performance.now();
  await new Promise(r => setTimeout(r, 100));
  return { waited: 100, elapsed: Math.round(performance.now() - t0) };
})()
EOF
```
