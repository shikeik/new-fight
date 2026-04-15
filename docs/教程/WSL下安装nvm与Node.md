# WSL 下安装 nvm 与 Node

> 记录本项目在 WSL (Ubuntu/Debian) 中安装 nvm 并管理 Node 版本的完整流程。npm 会随 Node 一起自动安装，无需单独处理。

---

## 为什么要用 nvm

- Debian/Ubuntu 官方源里的 `nodejs` 版本通常很旧（如 v18），而本项目要求 **Node 20.19+ 或 22.12+**。
- `nvm` 让你可以在同一台机器上安装多个 Node 版本，随时切换，不影响系统自带的老版本。

---

## 安装步骤

### 1. 安装 nvm

**方式 A：curl（如果已安装）**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

**方式 B：wget（WSL 默认可能没有 curl）**
```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

**方式 C：Node 自带 fetch（curl 和 wget 都没有时）**
```bash
node -e "fetch('https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh').then(r=>r.text()).then(t=>require('fs').writeFileSync('install-nvm.sh',t))"
bash install-nvm.sh
rm install-nvm.sh
```

### 2. 让当前终端认识 nvm 命令

安装脚本会修改 `~/.bashrc`，但**当前终端不会自动生效**，需要手动加载：

```bash
source ~/.bashrc
```

或者**直接重开一个 WSL 终端窗口**。

### 3. 安装 Node 22 LTS（npm 会一起装好）

```bash
nvm install 22
```

### 4. 设为默认版本

```bash
nvm alias default 22
```

### 5. 验证

```bash
node -v   # 应输出 v22.x.x
npm -v    # 应输出 10.x.x
```

---

## 常用命令速查

| 命令 | 作用 |
|------|------|
| `nvm ls` | 查看已安装的所有 Node 版本 |
| `nvm ls-remote` | 查看远程可安装的版本列表 |
| `nvm install 20` | 安装 Node 20 最新版 |
| `nvm use 20` | 当前终端临时切换到 Node 20 |
| `nvm alias default 22` | 把 Node 22 设为默认 |
| `nvm uninstall 18` | 卸载 Node 18 |

---

## 常见问题

### Q1：安装完 nvm 后，输入 `nvm` 提示 `command not found`

**原因**：`~/.bashrc` 已修改，但当前 shell 没重新加载。  
**解决**：执行 `source ~/.bashrc`，或重开一个终端。

### Q2：新开的 WSL 终端又找不到 `node` 或 `npm`

**原因**：当前 shell 的默认 Node 版本没有正确设置。  
**解决**：
```bash
nvm alias default 22
source ~/.bashrc
```

### Q3：系统自带的 `apt install nodejs` 和 nvm 装的 Node 冲突吗？

**不冲突**。nvm 把 Node 装在 `~/.nvm/versions/node/` 下，并通过 `~/.bashrc` 修改 PATH 优先级。只要 nvm 正确加载，命令行调用的 `node` 永远是 nvm 管理的版本。

---

## 相关报错备忘

如果 Node 版本过低，运行 `npm run build` 时会出现：

```
You are using Node.js 18.20.4. Vite requires Node.js version 20.19+ or 22.12+.
ReferenceError: CustomEvent is not defined
```

此时请务必按本文档升级到 Node 22+。
