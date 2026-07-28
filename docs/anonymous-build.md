# 匿名构建

## 命令

```bash
npm ci
npm run build:anonymous
```

匿名构建在编译期移除具名 profile，随后运行 `scripts/scan-anonymous.mjs` 扫描 `dist`。扫描覆盖 HTML、CSS、JavaScript、JSON、SVG、manifest 和 source map 等文本资源；命中学校、作者、GitHub 用户名或非必要品牌字符串时构建失败。

## 匿名版差异

- 品牌改为 `LM Simulation`。
- 学校、作者和课程负责人信息在匿名 bundle 中不可达。
- HTML metadata、favicon 和页面文案使用中性表述。
- 不生成 source map。
- 课程模型、实验功能、报告工作台和本地存储逻辑保持一致。

## 人工检查

1. 解压或打开 `dist`，再次搜索禁用字符串。
2. 检查浏览器标题、favicon、页脚、下载文件名和截图。
3. 使用中性 GitHub 账号、仓库名和域名发布。
4. 检查提交历史、PR 作者、Actions 日志和外部分析服务。

代码无法隐藏当前 GitHub Pages URL 中的用户名，因此匿名评审正式提交必须使用中性发布地址。
