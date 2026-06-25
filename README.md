<div align="center">
  <img src="apps/web/public/favicon.svg" width="96" height="96" alt="Obscura logo" />
  <h1>Obscura</h1>
  <p><strong>Local-first media workspace for images and short videos.</strong></p>
  <p>
    <strong>English</strong>
    ·
    <a href="README.zh-CN.md">简体中文</a>
  </p>
  <p>
    <a href="https://github.com/junjiang858/obscura/actions/workflows/check.yml">
      <img alt="Check" src="https://github.com/junjiang858/obscura/actions/workflows/check.yml/badge.svg" />
    </a>
    <a href="LICENSE">
      <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-62e0c1?style=flat-square" />
    </a>
    <img alt="Local-first" src="https://img.shields.io/badge/local--first-browser-7cd7ff?style=flat-square" />
    <img alt="Privacy-first" src="https://img.shields.io/badge/privacy--first-no%20uploads-9fe870?style=flat-square" />
    <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?style=flat-square" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square" />
    <img alt="pnpm" src="https://img.shields.io/badge/pnpm-10-f69220?style=flat-square" />
  </p>
  <p>
    <sub>
      Tags: local-first · privacy-first · browser media editor · image editor · short video editor · React · Vite · TypeScript
    </sub>
  </p>
  <p>
    <a href="#-overview">Overview</a>
    ·
    <a href="#-mvp-scope">MVP Scope</a>
    ·
    <a href="#-privacy-boundary">Privacy</a>
    ·
    <a href="#-tech-stack">Tech Stack</a>
    ·
    <a href="#-getting-started">Getting Started</a>
    ·
    <a href="#-documentation-map">Docs</a>
    ·
    <a href="#-roadmap">Roadmap</a>
    ·
    <a href="#-contributing">Contributing</a>
  </p>
</div>

Obscura is a local-first web media workspace for personal creators to preview, edit, manage, and export images and short videos in the browser without uploading private media.

## ✨ Overview

Obscura is built for quick, private media cleanup. It combines a media library, a large preview stage, image editing tools, a single-video editing workbench, and export controls in one browser-based workspace.

The first version is image-first and single-video focused. It is intentionally not a cloud editor, account system, collaboration suite, multi-track timeline, or template marketplace.

## 🎯 Why Obscura

Creators often move between desktop editors, online converters, background-removal sites, and video tools just to prepare one image or short clip. That workflow is slow, fragmented, and often asks users to upload private media.

Obscura keeps the first MVP local-first: user-selected media stays in the browser session, heavy processing is planned behind explicit Worker-facing APIs, and exported files are generated locally before download.

## 🧭 How Obscura Fits In

Obscura is designed alongside several excellent open-source media editing projects, but it takes a narrower local-first workspace path:

- Compared with TUI Image Editor, Obscura is not only a Canvas image editor. It adds a session media library, a large preview workspace, export flow, and a first-version path for short-video handling.
- Compared with Filerobot Image Editor, Obscura is not an embeddable image-editor SDK first. It is a standalone creator workspace shaped around local files, quick edits, and privacy boundaries.
- Compared with FreeCut, Obscura does not aim to be a professional multi-track video editor in v1. It keeps video editing to single-asset preview, trim, speed, manual subtitles, and export.
- Compared with OpenReel Video, Obscura deliberately avoids CapCut-style scope, templates, social publishing, and advanced timeline editing in the first version.
- Compared with ffmpeg-webCLI, Obscura wraps local media processing in a visual creator workflow instead of exposing a processing-toolbox or command-style interface.

In short, Obscura focuses on a privacy-first, image-first media workspace with enough short-video editing to cover everyday creator cleanup tasks.

## 🧩 MVP Scope

Image workflow:

- Upload and preview local images.
- Crop with social presets, rotate, flip, resize, and compare original versus edited output.
- Adjust brightness, contrast, saturation, and local filter presets.
- Add simple annotations and movable watermark layers.
- Run basic automatic background removal locally.
- Export to browser-native and documented local formats where supported.

Video workflow:

- Upload and preview one selected video at a time.
- Trim by start/end time with precise controls.
- Adjust playback/export speed with reset controls.
- Add manual subtitle cues.
- Generate derived local previews for trim or conversion flows where feasible.
- Export with progress, retry, cancel where technically feasible, and readable failures.

Workspace workflow:

- Import mixed image and video assets.
- Browse a session media library with thumbnails and metadata.
- Filter by all, images, or videos.
- Switch previous/next assets from the workspace.
- Keep edit state local to the active browser session.

## 🚫 Non-Goals

Obscura v1 does not include:

- Accounts, login, cloud storage, or remote media libraries.
- Backend uploads or server-side media processing.
- Team collaboration, comments, approvals, or shared projects.
- Multi-track video timelines, advanced keyframes, transitions, or compositing.
- CapCut-style templates, social publishing, or marketplace features.
- AI video generation or automatic subtitles.
- Photoshop-like layer editing.

## 🔒 Privacy Boundary

The v1 product promise is local-first media handling:

- The app processes files that the user explicitly selects or drops into the workspace.
- User media must not be uploaded to a backend or third-party API in v1.
- Raw user media must not be silently persisted long-term in IndexedDB, OPFS, localStorage, or cloud storage.
- Lightweight draft metadata may be stored only when documented and must not contain raw media bytes.
- Background-removal model/runtime assets may load as application assets; user images remain local.

## 🛠️ Tech Stack

- Runtime and workspace: Node.js 24 LTS, pnpm workspace.
- Frontend: React 19, TypeScript, Vite.
- UI: Tailwind CSS v4, shadcn/ui and Radix UI patterns, Material Symbols SVG React.
- State and validation: Zustand, zundo, Zod.
- Image editing: Canvas API, Cropper.js, Konva/react-konva.
- Background removal: `@imgly/background-removal`, AGPL-3.0 unless separately licensed, used through Obscura's open-source AGPL-compatible release path.
- Video processing: ffmpeg.wasm in Web Workers coordinated through Comlink.
- Testing: Vitest, React Testing Library, Playwright.

## 🗂️ Repository Layout

```text
.
├── apps/
│   └── web/              # React + Vite media workspace
├── packages/
│   ├── media-core/       # Media edit state, helpers, and shared media logic
│   └── shared/           # Zod schemas and shared TypeScript types
├── docs/                 # Source-of-truth product, architecture, workflow, and ops docs
└── AGENTS.md             # Agent/project working rules
```

## 🚀 Getting Started

Prerequisites:

- Node.js 24 LTS
- pnpm 10+

Install dependencies:

```bash
pnpm install
```

Start the web app:

```bash
pnpm dev
```

Run the standard project check:

```bash
pnpm check
```

Run browser tests:

```bash
pnpm test:e2e
```

## 📚 Documentation Map

- [Project charter](docs/project/PROJECT_CHARTER.md): product purpose, MVP scope, non-goals, risks, and acceptance criteria.
- [Tech stack](docs/architecture/TECH_STACK.md): approved architecture, dependencies, media pipeline, and rejected alternatives.
- [Engineering baseline](docs/architecture/ENGINEERING_BASELINE.md): scripts, quality gates, testing layers, and security rules.
- [Frontend plan](docs/architecture/FRONTEND_PLAN.md): source tree, component boundaries, UI quality gate, and interaction contract.
- [Database design](docs/architecture/DATABASE_DESIGN.md): v1 no-database decision and local persistence boundary.
- [Backend spec](docs/architecture/BACKEND_SPEC.md): v1 no-backend decision and browser Worker-facing contracts.
- [AI workflow](docs/workflow/AI_WORKFLOW.md): planning, implementation, confirmation, and verification rules.
- [Tool policy](docs/ops/TOOL_POLICY.md): allowed tools, confirmation requirements, and forbidden operations.
- [Deployment](docs/ops/DEPLOYMENT.md): static deployment model, browser requirements, headers, and rollout checks.

## 🗺️ Roadmap

Now:

- Finish the first local media workspace slice.
- Harden image export, background removal, and single-video export paths.
- Add focused unit, component, and browser coverage for upload, preview, edit, export, failure, and privacy paths.

Later:

- Optional persistent local workspace through user-approved storage.
- Optional waveform preview for video positioning.
- Manual background-removal refinement.
- More advanced video editing only after the source-of-truth docs expand the scope.

Explicitly out of scope for v1:

- Cloud processing, accounts, remote sync, collaboration, multi-track editing, AI video generation, and template marketplaces.

## 🤝 Contributing

Before changing behavior, read [AGENTS.md](AGENTS.md) and the relevant source-of-truth documents under `docs/`.

Update the appropriate document before changing product scope, architecture, dependencies, persistence, backend/API boundaries, deployment behavior, tool permissions, or privacy rules. Keep media processing local-first unless the source-of-truth documents and project owner explicitly approve a different direction.

## 📄 License

Obscura project code is licensed under the [MIT License](LICENSE).

Third-party dependency licenses still apply. In particular, `@imgly/background-removal` is AGPL-3.0 unless separately licensed by IMG.LY. Obscura is an open-source project and uses this dependency through an AGPL-compatible public release path: keep corresponding source, build instructions, dependency versions, and third-party license notices available for the public app. Closed-source distribution or commercial distribution would require a separate IMG.LY/commercial license or replacement with an approved dependency/model.

Production builds should also self-host the matching `@imgly/background-removal-data` asset bundle and set `VITE_BACKGROUND_REMOVAL_PUBLIC_PATH`, rather than relying on the package default CDN path, unless the project owner explicitly accepts that production dependency.
