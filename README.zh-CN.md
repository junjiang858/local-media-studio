# Obscura

[![Check](https://github.com/junjiang858/obscura/actions/workflows/check.yml/badge.svg)](https://github.com/junjiang858/obscura/actions/workflows/check.yml)

Obscura 是一个面向个人创作者的本地优先 Web 媒体工作台，用于在浏览器里快速预览、编辑、管理和导出图片与短视频，不需要安装重型桌面软件，也不需要上传私密媒体文件。

语言：[English](README.md) | 简体中文

## 项目简介

Obscura 是为快速、私密的媒体清理流程而设计的。它把媒体库、大预览区、图片编辑工具、单视频编辑工作台和导出控制放在同一个浏览器工作台里。

第一个版本以图片编辑为主，同时包含单个视频资产的基础编辑工作台。它不是云端编辑器、账号系统、协作平台、多轨时间线，也不是模板市场。

## 为什么做 Obscura

创作者经常为了处理一张图片或一段短视频，在桌面编辑器、在线转换器、背景移除网站和视频工具之间来回切换。这个流程慢、碎片化，而且经常要求用户上传私密媒体。

Obscura 的第一个 MVP 坚持本地优先：用户选择的媒体保留在浏览器会话内，重型处理通过明确的 Worker-facing API 承载，导出结果在本地生成后再下载。

## 与代表项目相比

Obscura 与社区里一些优秀的开源媒体编辑项目站在同一类问题空间里，但它选择的是更克制的本地优先工作台路线：

- 相比 TUI Image Editor，Obscura 不只是一个 Canvas 图片编辑器。它还包含会话媒体库、大预览工作区、导出流程，以及第一版里的短视频处理路径。
- 相比 Filerobot Image Editor，Obscura 不是 SDK 优先的可嵌入图片编辑器。它是一个围绕本地文件、快速编辑和隐私边界设计的独立创作者工作台。
- 相比 FreeCut，Obscura v1 不追求专业多轨视频编辑。视频能力保持在单资产预览、裁剪、速度调整、手动字幕和导出。
- 相比 OpenReel Video，Obscura 第一版明确避免 CapCut 式范围、模板系统、社交发布和高级时间线编辑。
- 相比 ffmpeg-webCLI，Obscura 把本地媒体处理包进可视化创作者工作流，而不是偏处理工具箱或命令式界面。

一句话说，Obscura 聚焦于隐私优先、图片优先的媒体工作台，并补足日常创作者清理短视频所需的基础能力。

## MVP 范围

图片工作流：

- 上传并预览本地图片。
- 使用社交平台比例预设裁剪，旋转、翻转、调整尺寸，并对比原图与编辑结果。
- 调整亮度、对比度、饱和度和本地滤镜预设。
- 添加简单标注和可移动水印层。
- 在本地运行基础自动背景移除。
- 在浏览器和已记录的本地格式能力范围内导出图片。

视频工作流：

- 一次选择并预览一个视频。
- 通过开始/结束时间精确裁剪。
- 调整播放/导出速度，并提供重置控制。
- 手动添加字幕片段。
- 在可行时为裁剪或转换流程生成本地派生预览。
- 导出时展示进度、可恢复失败、重试、技术可行时的取消能力，以及可读错误原因。

工作台工作流：

- 导入混合图片和视频资产。
- 在会话媒体库里浏览缩略图和元数据。
- 按全部、图片、视频筛选。
- 在工作台里切换上一个/下一个资产。
- 将编辑状态保留在当前浏览器会话内。

## 非目标

Obscura v1 不包含：

- 账号、登录、云存储或远程媒体库。
- 后端上传或服务端媒体处理。
- 团队协作、评论、审批或共享项目。
- 多轨视频时间线、高级关键帧、转场或合成。
- CapCut 风格模板、社交发布或模板市场。
- AI 视频生成或自动字幕。
- Photoshop 式完整图层编辑。

## 隐私边界

v1 的产品承诺是本地优先媒体处理：

- 应用只处理用户明确选择或拖入工作台的文件。
- v1 不得把用户媒体上传到后端或第三方 API。
- 不得把原始用户媒体静默长期保存到 IndexedDB、OPFS、localStorage 或云存储。
- 只有在文档明确记录时，才可以保存轻量草稿元数据，并且不得包含原始媒体字节。
- 背景移除模型或运行时资产可以作为应用资产加载；用户图片仍保留在本地。

## 技术栈

- 运行时和工作区：Node.js 24 LTS、pnpm workspace。
- 前端：React 19、TypeScript、Vite。
- UI：Tailwind CSS v4、shadcn/ui 和 Radix UI 模式、Material Symbols SVG React。
- 状态和校验：Zustand、zundo、Zod。
- 图片编辑：Canvas API、Cropper.js、Konva/react-konva。
- 背景移除：`@imgly/background-removal`，并记录 AGPL/许可证 caveat。
- 视频处理：在 Web Worker 中运行 ffmpeg.wasm，并通过 Comlink 协调。
- 测试：Vitest、React Testing Library、Playwright。

## 仓库结构

```text
.
├── apps/
│   └── web/              # React + Vite 媒体工作台
├── packages/
│   ├── media-core/       # 媒体编辑状态、辅助函数和共享媒体逻辑
│   └── shared/           # Zod schema 和共享 TypeScript 类型
├── docs/                 # 产品、架构、流程和运维源文档
└── AGENTS.md             # Agent/项目工作规则
```

## 本地开发

前置要求：

- Node.js 24 LTS
- pnpm 10+

安装依赖：

```bash
pnpm install
```

启动 Web 应用：

```bash
pnpm dev
```

运行标准项目检查：

```bash
pnpm check
```

运行浏览器测试：

```bash
pnpm test:e2e
```

## 文档地图

- [项目章程](docs/project/PROJECT_CHARTER.md)：产品目的、MVP 范围、非目标、风险和验收标准。
- [技术栈](docs/architecture/TECH_STACK.md)：已批准架构、依赖、媒体管线和被拒绝的替代方案。
- [工程基线](docs/architecture/ENGINEERING_BASELINE.md)：脚本、质量门禁、测试层级和安全规则。
- [前端计划](docs/architecture/FRONTEND_PLAN.md)：源码树、组件边界、UI 质量门禁和交互契约。
- [数据库设计](docs/architecture/DATABASE_DESIGN.md)：v1 无数据库决策和本地持久化边界。
- [后端规范](docs/architecture/BACKEND_SPEC.md)：v1 无后端决策和浏览器 Worker-facing 契约。
- [AI 工作流](docs/workflow/AI_WORKFLOW.md)：规划、实现、确认和验证规则。
- [工具政策](docs/ops/TOOL_POLICY.md)：允许的工具、确认要求和禁止操作。
- [部署](docs/ops/DEPLOYMENT.md)：静态部署模型、浏览器要求、响应头和发布检查。

## 路线图

当前：

- 完成第一个本地媒体工作台切片。
- 强化图片导出、背景移除和单视频导出路径。
- 为上传、预览、编辑、导出、失败和隐私路径补充聚焦的单元、组件和浏览器覆盖。

后续：

- 经用户批准的持久本地工作区。
- 可选的视频定位波形预览。
- 手动背景移除细化。
- 只有在源文档扩展范围后，才加入更高级的视频编辑能力。

v1 明确不做：

- 云处理、账号、远程同步、协作、多轨编辑、AI 视频生成和模板市场。

## 贡献说明

修改行为前，请先阅读 [AGENTS.md](AGENTS.md) 和 `docs/` 下的相关源文档。

如果要改变产品范围、架构、依赖、持久化、后端/API 边界、部署行为、工具权限或隐私规则，请先更新对应文档。除非源文档和项目 owner 明确批准新的方向，否则媒体处理必须保持本地优先。

## 许可证

Obscura 项目代码基于 [MIT License](LICENSE) 授权。

第三方依赖的许可证仍然适用。尤其是 `@imgly/background-removal` 带有已记录的 AGPL/许可证 caveat，在公开发布、闭源分发或商业分发前必须重新审查。
