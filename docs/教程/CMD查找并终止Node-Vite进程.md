# Windows CMD 查找并终止 Node/Vite 进程

> 适用场景：你用 `npm run dev` 启动 Vite 后，终端意外关闭或进程没正常退出，导致端口一直被占用，需要手动找到并杀死后台残留的 Vite 进程。

---

## 核心问题：为什么 `tasklist | findstr vite` 找不到？

在 Windows 上执行 `npm run dev` 时，实际启动的进程名通常是 `node.exe` 或 `cmd.exe`，而不是独立的 `vite.exe`。

例如实际命令行可能是：

```text
node.exe "E:\...\node_modules\vite\bin\vite.js" --config configs/vite.config.ts
```

所以 `tasklist` 的进程名列里根本看不到 `vite` 这个字，必须用 **完整命令行（CommandLine）** 去匹配才能找到。

---

## 指令一：按完整命令行查找 Vite 进程

```cmd
wmic process where "CommandLine like '%vite%'" get ProcessId,CommandLine
```

### 效果
输出所有命令行中包含 `vite` 的进程，以及它们的 PID：

```text
CommandLine                                              ProcessId
node.exe  "E:\WorkSpaces\...\node_modules\vite\bin\vite.js"  12345
```

### 拆解说明

| 部分 | 含义 |
|------|------|
| `wmic` | Windows Management Instrumentation Command-line，Windows 内置的系统管理数据库命令行工具 |
| `process` | WMI 类 `Win32_Process` 的简写，代表系统进程 |
| `where "CommandLine like '%vite%'"` | WQL 过滤条件，匹配 `CommandLine` 属性中任意位置包含 `vite` 的进程（类似 SQL 的 `LIKE`） |
| `get ProcessId,CommandLine` | 只输出指定的两列，避免打印全部属性 |

> `CommandLine` 保存的是进程启动时的**完整命令行（含参数）**，这是 `tasklist` 看不到的关键信息。

---

## 指令二：快速查看所有 Node 进程

```cmd
tasklist | findstr node
```

### 效果
列出所有进程名中包含 `node` 的进程：

```text
node.exe                     12345 Console           1     45,032 K
node.exe                     67890 Console           1     52,100 K
```

### 拆解说明

| 部分 | 含义 |
|------|------|
| `tasklist` | 列出当前运行的所有进程 |
| `\|` | 管道符，将输出传给下一个命令 |
| `findstr node` | 过滤包含 `node` 字符串的行 |

### 适用场景
- 快速确认 `node.exe` 是否在跑
- 但**无法区分**哪个是 Vite、哪个是其他 Node 脚本
- 如果需要精准定位，请用上面的 `wmic` 按 `CommandLine` 匹配

---

## 指令三：按完整命令行终止 Vite 进程

```cmd
wmic process where "CommandLine like '%vite%'" delete
```

### 效果
强制终止所有命令行中包含 `vite` 的进程，输出类似：

```text
Deleting instance \.\ROOT\CIMV2:Win32_Process.Handle="12345"
Instance deletion successful.
```

### 拆解说明

| 部分 | 含义 |
|------|------|
| `wmic process where "CommandLine like '%vite%'"` | 同查询指令，先筛选出目标进程实例 |
| `delete` | 对筛选出的进程实例执行删除操作，对 `Win32_Process` 来说就是 **Terminate（强制终止）** |

### ⚠️ 注意事项
1. **先查后杀**：建议先用 `get` 确认匹配的进程无误，再执行 `delete`，避免误杀。
2. **权限问题**：如果 Vite 进程是以管理员权限启动的，普通 CMD 可能终止失败，需要以**管理员身份运行终端**。
3. **误杀风险**：`%vite%` 是模糊匹配，如果其他进程的命令行里也碰巧有 `vite`（比如某个编辑器插件进程），也会被一起杀掉。

---

## 常用对照表

| 需求 | Linux 指令 | Windows CMD 等效 |
|------|-----------|-----------------|
| 查看含 vite 的完整进程信息 | `ps aux \| grep vite` | `wmic process where "CommandLine like '%vite%'" get ProcessId,CommandLine` |
| 查看所有 node 进程 | `ps aux \| grep node` | `tasklist \| findstr node` |
| 按完整命令行终止 vite | `pkill -f vite` | `wmic process where "CommandLine like '%vite%'" delete` |

---

## 进阶：按端口精准定位

如果你知道被占用的端口号（比如 5000），也可以直接按端口找 PID，再杀掉：

```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

这样不需要管进程名是不是 vite，只看谁占了端口，更加精准。
