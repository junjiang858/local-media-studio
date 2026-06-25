# Third-Party Notices

Last reviewed: 2026-06-25.

Obscura project code is licensed under the MIT License in `LICENSE`. Third-party
dependencies keep their own licenses. This notice summarizes the public release
evidence for the first open-source MVP and highlights dependencies with
important redistribution or runtime obligations.

## Public Source And Build Evidence

- Public source repository: https://github.com/junjiang858/obscura
- Package manager: pnpm workspace, pinned through `packageManager` in
  `package.json`.
- Build instructions:
  1. Install dependencies with `pnpm install`.
  2. Run quality checks with `pnpm check`.
  3. Build the static web app with `pnpm build`.
- Dependency versions are recorded in `package.json`, `apps/web/package.json`,
  package manifests under `packages/`, and `pnpm-lock.yaml`.

## Key Runtime Dependencies

| Dependency                  | Installed version at review | License notice                                                                           | Release note                                                                                                                                                                                                                                                                         |
| --------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@imgly/background-removal` | 1.7.0                       | AGPL-3.0 unless separately licensed by IMG.LY; installed package points to `LICENSE.md`. | Used for browser-local automatic image background removal. Obscura is released as an open-source project through an AGPL-compatible public release path. Closed-source or commercial distribution must obtain a separate IMG.LY/commercial license or replace this dependency/model. |
| `@ffmpeg/core`              | 0.12.9                      | GPL-2.0-or-later                                                                         | Used by ffmpeg.wasm for browser-local video processing. Users and redistributors must comply with the ffmpeg/core license terms in addition to Obscura's MIT license.                                                                                                                |
| `@ffmpeg/ffmpeg`            | 0.12.15                     | MIT                                                                                      | Browser ffmpeg wrapper.                                                                                                                                                                                                                                                              |
| `@ffmpeg/util`              | 0.12.2                      | MIT                                                                                      | Browser ffmpeg utilities.                                                                                                                                                                                                                                                            |
| `@vercel/analytics`         | 2.0.1                       | MIT                                                                                      | Page analytics only; no custom media-related events are approved in v1.                                                                                                                                                                                                              |
| `@vercel/speed-insights`    | 2.0.0                       | Apache-2.0                                                                               | Core Web Vitals and page performance telemetry only.                                                                                                                                                                                                                                 |
| `react` / `react-dom`       | 19.2.7                      | MIT                                                                                      | Frontend UI runtime.                                                                                                                                                                                                                                                                 |
| `vite`                      | 7.x                         | MIT                                                                                      | Static web build tool.                                                                                                                                                                                                                                                               |
| `konva` / `react-konva`     | 10.3.0 / 19.2.5             | MIT                                                                                      | Image annotation and layer canvas interaction.                                                                                                                                                                                                                                       |
| `zustand` / `zundo`         | 5.0.14 / 2.3.0              | MIT                                                                                      | Local client state and approved undo/redo fallback.                                                                                                                                                                                                                                  |
| `zod`                       | 4.4.3                       | MIT                                                                                      | Runtime validation.                                                                                                                                                                                                                                                                  |

For the full dependency graph, inspect `pnpm-lock.yaml` and each installed
package's license file.

## Background Removal Model Assets

The first public production release intentionally uses the pinned IMG.LY static
CDN asset base for `@imgly/background-removal-data@1.7.0`:

```text
https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/
```

This downloads model/runtime assets in the browser. It does not upload user
images or videos. User media remains local to the browser runtime.

Self-hosting the matching background-removal data bundle through
`VITE_BACKGROUND_REMOVAL_PUBLIC_PATH` remains an approved later hardening path.

## Observability Boundary

Vercel Web Analytics and Vercel Speed Insights are approved for page and
performance telemetry in the first public release. Do not add custom analytics
events, browser replay, log drains, error-reporting vendors, or third-party RUM
tools that can capture media file names, subtitles, object URLs, local paths,
image/video metadata, or private user content without a source-of-truth update.
