# Console 技巧大全

`console` 不只是 `console.log()`，用好它能大幅提升调试效率。

---

## 基础输出

### log / info / warn / error
```js
console.log('普通日志');
console.info('提示信息');
console.warn('警告信息');  // 通常带黄色背景
console.error('错误信息'); // 通常带红色背景
```
在 eruda 或 F12 中，不同级别有不同的颜色和图标，方便一眼区分。

---

## 格式化输出

### %s 字符串 / %d 数字 / %o 对象
```js
console.log('玩家 %s 等级 %d', 'Kimi', 99);
console.log('当前对象: %o', { name: 'Kimi', hp: 100 });
```

### %c CSS 样式（仅限 PC 浏览器，eruda 可能不支持复杂样式）
```js
console.log('%c 大标题 ', 'font-size: 20px; color: red; background: yellow;');
```

---

## 结构化输出

### console.table() — 表格展示数组/对象
```js
const fighters = [
  { name: 'Brawler', hp: 100, atk: 15 },
  { name: 'Boxer', hp: 120, atk: 20 },
  { name: 'Blitzer', hp: 90, atk: 25 },
];
console.table(fighters);
```
效果：自动生成一个带表头的表格，比 JSON 好看一百倍。

也可以只显示指定列：
```js
console.table(fighters, ['name', 'atk']);
```

---

## 分组输出

### console.group() / console.groupEnd()
```js
console.group('战斗轮次 1');
console.log('Player 攻击 Enemy，伤害 25');
console.log('Enemy 反击 Player，伤害 10');
console.groupEnd();
```
效果：日志可以折叠/展开，结构清晰。

也可以默认折叠：
```js
console.groupCollapsed('折叠组');
console.log('隐藏的内容');
console.groupEnd();
```

---

## 计时器

### console.time() / console.timeEnd()
```js
console.time('加载时间');
// ... 执行一些代码
console.timeEnd('加载时间'); // 输出: 加载时间: 15.234ms
```
适合测性能，比如初始化、渲染耗时。

---

## 计数器

### console.count() / console.countReset()
```js
function onClick() {
  console.count('点击次数');
}
// 点击按钮后输出: 点击次数: 1
// 再点击输出: 点击次数: 2

console.countReset('点击次数'); // 重置
```

---

## 断言调试

### console.assert()
```js
console.assert(hp > 0, 'HP 不应该小于等于 0');
```
条件为假时才输出错误，适合快速检查状态异常。

---

## 清空控制台

```js
console.clear();
```

---

## 追踪调用栈

### console.trace()
```js
function a() { b(); }
function b() { c(); }
function c() { console.trace('追踪到这里'); }
a();
```
效果：输出完整的调用栈，告诉你这个 log 是从哪一层调用过来的。

---

## 小结速查表

| 方法 | 用途 |
|------|------|
| `log/info/warn/error` | 分级输出 |
| `table` | 表格展示数据 |
| `group/groupCollapsed/groupEnd` | 折叠分组 |
| `time/timeEnd` | 计时 |
| `count/countReset` | 计数 |
| `assert` | 条件断言 |
| `trace` | 调用栈追踪 |
| `clear` | 清空控制台 |
