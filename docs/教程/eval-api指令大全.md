# eval-api 指令大全

## 基础用法

### 执行单行代码
```bash
./eval-api 'window.helloStr'
```

### 执行多行代码
```bash
./eval-api <<'EOF'
const k = 3 + 2
window.helloStr = "modifier" + k
EOF
```

### 启用 pretty 美观输出
```bash
./eval-api -p 'window.helloStr = 6'
```

---

## 系统与浏览器状态

### 获取当前页面标题和 URL
```bash
./eval-api -p '({ title: document.title, url: location.href })'
```

### 获取屏幕尺寸
```bash
./eval-api -p '({ width: window.innerWidth, height: window.innerHeight, aspect: camera.aspect })'
```

### 获取当前相机参数
```bash
./eval-api -p '({ x: camera.position.x, y: camera.position.y, z: camera.position.z })'
```

---

## 游戏状态查询

### 检查游戏是否在进行中
```bash
./eval-api -p '({ appState, hasP1: !!p1, hasP2: !!p2 })'
```

### 获取两角色位置和血量
```bash
./eval-api -p '({ p1: { x: p1.pos.x, hp: p1.hp }, p2: { x: p2.pos.x, hp: p2.hp }, dist: Math.abs(p1.pos.x - p2.pos.x) })'
```

### 查看当前连击数
```bash
./eval-api -p 'document.getElementById("combo-txt").innerText'
```

---

## 游戏控制

### 点击开始游戏（选人界面跳过）
```bash
./eval-api 'document.getElementById("start-btn").click()'
```

### 开启/关闭敌人 AI
```bash
./eval-api 'CFG.enableEnemyAI = true'
./eval-api 'CFG.enableEnemyAI = false'
```

### 调整相机追焦速度
```bash
./eval-api 'CFG.cameraLerpX = 0.3; CFG.cameraLerpZ = 0.2'
```

### 调整相机安全边距
```bash
./eval-api 'CFG.cameraSafeRatio = 0.85'
```

---

## 视觉效果

### 画面地震效果
```bash
./eval-api 'window.gameCamShake = 3'
```

### 时间冻结（慢动作）
```bash
./eval-api 'window.gameHitStop = 1'
```

### 修改血条显示宽度
```bash
./eval-api "document.getElementById('hp-player').style.width = '30%'"
```

### 连击数改成 999
```bash
./eval-api "let c = document.getElementById('combo-txt'); c.innerText = '999 HITS!'; c.style.opacity = 1"
```

### 给画面加滤镜
```bash
./eval-api "document.querySelector('canvas').style.filter = 'hue-rotate(90deg) contrast(1.5)'"
```

### 恢复正常画面
```bash
./eval-api "document.querySelector('canvas').style.filter = 'none'"
```

---

## IndexedDB 查询

### 列出所有数据库
```bash
./eval-api -p '(async () => await indexedDB.databases())()'
```

### 查询 fighters 表全部数据
```bash
./eval-api -p <<'EOF'
(async () => {
  const req = indexedDB.open('GameDB');
  return await new Promise((resolve, reject) => {
    req.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('fighters', 'readonly');
      tx.objectStore('fighters').getAll().onsuccess = ev => resolve(ev.target.result);
    };
    req.onerror = e => reject(e.target.error);
  });
})()
EOF
```

---

## 日志获取

### 获取全部浏览器日志
```bash
./eval-api -p 'window.__ALL_LOGS__'
```

### 获取最近 20 条日志
```bash
./eval-api -p 'window.__ALL_LOGS__.slice(-20)'
```

### 只看 error 级别日志
```bash
./eval-api -p 'window.__ALL_LOGS__.filter(l => l.level === "error")'
```

### 从某个时间之后筛选
```bash
./eval-api -p 'window.__ALL_LOGS__.filter(l => l.time > "14:30:00")'
```

---

## 高级技巧

### 自动按键（物理外挂）
```bash
./eval-api <<'EOF'
const autoAtk = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyJ'}));
  setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyJ'})), 80);
};
const id = setInterval(autoAtk, 200);
setTimeout(() => clearInterval(id), 3000);
'auto attack 3s'
EOF
```

### 修改页面标题
```bash
./eval-api 'document.title = "👑 GOD MODE"'
```
