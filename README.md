# 商机雷达（Opportunity radar）

把「多平台发现商机 → 筛选数字产品可解问题 → 评估可行性 → 出报告与网页」这套流程固化成可复用的 Harness 插件，并保存每一期的调研结果与配置。

## 界面

点左侧栏的雷达图标打开主面板。顶部有两个标签：

### 商机库（默认）

把**所有期数**的候选商机汇总成一块看板，是这套插件的闭环核心：

- **看板卡片**：每张卡显示候选商机、五维综合分、结论、来源期数、当前状态。
- **状态流转**：发现 → 打分 → 排期 → 跟进 → 已验证 / 放弃，点卡片或卡片内的下拉即可改，**状态存浏览器 localStorage**，刷新后仍在。
- **筛选与排序**：按状态、按平台（取自各期 `config.platforms`）、按评分/进度/日期排序，以及按名称/理由/证据全文搜索。
- **详情抽屉**：点「详情」打开右侧抽屉，看产品形态、为什么可行、主要风险、五维评分、**每一条证据的原始 URL**，可一键「定位到该期」。
- 同一商机在不同期数里复用同一 `id`，就能横向对比它历期分数的变化。

### 期数

- 左侧列出所有归档期数（按日期倒序），点选即切换。
- 右侧显示该期的**定制选项**、候选商机、报告网页，以及免责说明。
- 「详情」抽屉里的「定位到该期」会自动切回这个标签并选中对应期。

### 每期的定制选项

- 调研主题、调研平台（多选）、关键词、备注
- 修改后自动存到浏览器 `localStorage`（按每一期独立保存），刷新后仍在
- 「恢复该期默认」清除本地改动，回到 `meta.json` 里的配置
- 「复制定制调研指令」把当前配置编入一段完整调研提示词，粘贴到对话框即可按此配置复跑
- 「在新标签打开」用 Blob URL 打开该期报告网页

定制只影响**下次调研的指令**，不会改写已归档的报告。报告是历史快照。

## 交付内容

| 文件 | 作用 |
|---|---|
| `WORKFLOW.md` | **流程单一真源**。完整 SOP，可单独交给任意 Agent 复跑。 |
| `index.js` | Host 半：注册 `/radar` 与 `/opportunity` 命令。 |
| `client.js` | Client 半：侧边栏图标 + 主面板（商机库看板 + 期数详情 + 定制）。含编译进去的往期数据。 |
| `build-archive.mjs` | 把 `reports/` 编译进 `client.js`，并把候选商机归一化成闭环结构（兼容旧 `score` 字段）。 |
| `reports/<期>/` | 每期一个目录：`meta.json`（结构化商机）、`index.html`、`report.md`。 |
| `locale/*`, `icon.svg` | 插件在插件管理器里的显示元数据。 |

## 命令

在输入框输入（命令名只接受 ASCII 小写）：

- `/radar` 或 `/opportunity` — 输出完整流程 SOP
- `/radar 平台` — 默认数据源清单与访问限制
- `/radar 评分` — 五维评分矩阵与判废标准
- `/radar 报告` — 报告结构与网页交付要求

## 新增一期

1. 跑完一次调研，在 `reports/` 下新建 `<日期>-<主题>/`，放入：
   - `meta.json` — 见现有那期的字段；`config` 里写 `topic`、`platforms`、`keywords`、`notes`
   - `index.html` — 单文件报告网页
   - `report.md` — Markdown 报告
2. 运行 `node build-archive.mjs`（把新一期编译进 `client.js`）
3. 刷新 Web GUI 页面，左侧期数列表即出现新的一期

> 为什么需要编译：这个 Desktop 的 `browserAccess` 策略禁止普通浏览器请求自定义 HTTP 路径（只有 Electron 渲染进程带凭证才放行）。为保证「打开报告」始终可用，插件**不提供任何 HTTP 接口**，往期数据随 Client 模块一起下发。代价是加期数后要跑一次构建脚本并刷新。

## 复跑一次完整调研

最可靠的方式是把 `WORKFLOW.md` 交给 Agent，或用面板的「复制定制调研指令」：

```
按 opportunity-radar/WORKFLOW.md 的流程，重新调研 <主题>。
产出报告 Markdown、单文件网页，并归档到 reports/<日期-主题>/。
遵守其中关于证据边界与验证顺序的要求。
```

## 设计边界（请读）

- **插件固化的是流程，不是抓取能力**。实际抓取由 Agent 用 `web_fetch` / `web_search` 完成；插件不内置爬虫，也不自动发帖。
- 自动回复/发帖必须人工确认，SOP 明确禁止自动发布。
- 讨论热度不等于付费意愿，SOP 要求写明需二次验证的部分。
- 报告用 `<iframe srcDoc sandbox="allow-popups allow-popups-to-escape-sandbox">` 渲染：不含 `allow-scripts`，报告里的脚本不会执行；报告是独立单文件网页，自带配色，不跟随宿主主题。
- 面板文案按浏览器语言自动切中/英；未接入 Client locale service（本环境未确认该 API），属于已知简化。
- 定制项存在 `localStorage`，换设备或清浏览器数据会丢失；要长期保留请改 `meta.json` 的 `config`。

## 安装

通过 Harness 的 `plugin_manager install_bundle`，`target` 指向本目录绝对路径。安装后在插件管理器可见「商机雷达」。

> **更新已安装插件后必须重启 Harness 应用 + 刷新页面**。Host 半的插件行只在启动时合成；在已运行的进程里改文件（即使是 `link:` 软链安装）不会把行挂上，侧边栏也没有图标。改完 `client.js` 后：重启应用 → 再刷新 Web 页面。Client 半没有 `dev:web` watcher，不会热更新。
>
> **client 入口的 `id` 必须与 npm 包名完全一致**（本插件为 `@xinnix/dsh-opportunity-radar`）。若写成别的值（例如遗留的 `@local/...`），`dsh-client-modules` 会在同一次启动里把它当作两个不同模块注册，抛 `duplicate factory registration ... (bundle executed twice without invalidate?)`，导致渲染进程启动即崩、应用反复重试后把整个 bundle 自动禁用。改过 `id` 之后：先 `plugin_manager set_bundle enabled:true` 重新启用，再重启/刷新。
