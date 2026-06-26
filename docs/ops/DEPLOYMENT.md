# DEPLOYMENT

## Document Status

- Project charter confirmed: Yes, `docs/project/PROJECT_CHARTER.md`.
- Tech stack confirmed: Yes, `docs/architecture/TECH_STACK.md`.
- User approved writing this document: Yes, selected accelerated path B in chat on 2026-06-22.
- Last reviewed: 2026-06-26.
- Current background-removal release review: `@imgly/background-removal@1.7.0` is AGPL-3.0 unless separately licensed. The project owner confirmed Obscura is open source and selected the AGPL-compatible public release path.
- Current public release preparation: The project owner selected Vercel GitHub integration for build/deploy and explicitly accepted using the pinned IMG.LY CDN background-removal model/runtime asset path for the initial public production release. Self-hosting remains an approved later hardening option.
- Current public metadata update: The canonical public URL is `https://obscura-rouge.vercel.app/`. The static app ships Open Graph/Twitter metadata, a share preview image, `robots.txt`, `sitemap.xml`, English and Simplified Chinese static SEO acquisition pages, and a basic installable web app manifest without adding a service worker.

## Deployment Summary

The first MVP is a static client-side web app built with React + Vite and deployed through Vercel's GitHub integration. It has no backend server, no database, no server-side media upload endpoint, and no runtime secrets in v1.

Deployment must support static assets for the app, ffmpeg.wasm assets, background-removal model/runtime assets, and any cross-origin isolation headers required by the selected WASM path.

## Environments

| Environment | Purpose                                  | URL or command                           | Notes                                             |
| ----------- | ---------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| Local       | Development and browser verification     | `pnpm dev` after scaffolding             | Starts Vite dev server for `apps/web`.            |
| Test        | Local automated checks                   | `pnpm check` and later `pnpm test:e2e`   | Uses tiny fixture media only.                     |
| Staging     | Preview deploy for browser/device checks | Vercel Git preview deployment            | Requires approval before external preview deploy. |
| Production  | Public static web app                    | Vercel production deployment from `main` | Requires explicit production deploy confirmation. |

## Vercel GitHub Project Settings

When importing the GitHub repository into Vercel, keep the project rooted at the repository root and let Vercel detect pnpm from `packageManager` and `pnpm-lock.yaml`.

| Setting                   | Value                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Git branch for production | `main`                                                                                                  |
| Framework preset          | Vite                                                                                                    |
| Root directory            | Repository root                                                                                         |
| Install command           | Vercel default package-manager detection                                                                |
| Build command             | `pnpm build`                                                                                            |
| Output directory          | `apps/web/dist`                                                                                         |
| Node.js version           | Vercel default latest LTS, currently 24.x; select 24.x manually if the dashboard does not default to it |

The versioned `vercel.json` keeps the build command, output directory, framework preset, COOP/COEP headers, and immutable caching for Vite content-hashed assets in source control.

After the Vercel project is created from GitHub:

- Enable Web Analytics in the Vercel project dashboard.
- Enable Speed Insights in the Vercel project dashboard.
- Do not enable BotID, Log Drains, browser replay, or third-party error/RUM integrations for v1 without a source-of-truth update.

## Environment Variables

No runtime secrets are required in v1.

| Name                                  | Required | Scope                        | Notes                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | -------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_BACKGROUND_REMOVAL_PUBLIC_PATH` | Optional | Public build-time asset path | Public base URL for the `@imgly/background-removal` model/WASM asset bundle. It is not a secret. The initial public production release may omit it and use the pinned IMG.LY static asset base explicitly accepted by the project owner. Set it to a self-hosted static path such as `/background-removal/` only when the matching asset bundle is provisioned. |

Future public build-time flags, model asset base paths, analytics keys, cloud endpoints, or API URLs require source-of-truth updates before implementation.

## Static Assets

- App assets are produced by the Vite build.
- Vite content-hashed build assets under `/assets/*` may be served with `Cache-Control: public, max-age=31536000, immutable`.
- HTML entry files, root metadata files, `robots.txt`, `manifest.webmanifest`, and share preview images must not receive the `/assets/*` immutable cache rule unless their URLs become content-hashed.
- The app's current public metadata assets are:
  - `/og-image.svg` for Open Graph/Twitter previews.
  - `/robots.txt` with `User-agent: *`, `Allow: /`, and the canonical sitemap URL.
  - `/sitemap.xml` with the canonical home page, static SEO acquisition pages, and language alternates when a page has English and Simplified Chinese variants.
  - `/manifest.webmanifest` for basic install metadata.
- Static SEO acquisition pages may live under `/features/*/`, `/privacy/*/`, and `/zh/*/` for Simplified Chinese variants. They must be plain static content pages that link into the app and must not add backend, SSR, service worker, or media upload behavior.
- Do not add a service worker in this release. Any service worker or runtime cache strategy must be documented here before implementation because it can complicate WASM, static asset, and app-shell freshness behavior.
- ffmpeg.wasm core/worker assets must be served from a reliable path documented during implementation.
- Background-removal model/runtime assets use the pinned IMG.LY static CDN base for the initial public production release. User media is not sent to IMG.LY; the browser only downloads static model/runtime assets.
- Optional production self-hosting procedure for `@imgly/background-removal@1.7.0`:
  1. Download the matching data package from `https://staticimgly.com/@imgly/background-removal-data/1.7.0/package.tgz`.
  2. Extract the archive outside Git history.
  3. Copy the extracted `package/dist/` contents to the production static asset directory served as `/background-removal/` or an equivalent immutable asset base.
  4. Set `VITE_BACKGROUND_REMOVAL_PUBLIC_PATH=/background-removal/` for the production build.
  5. Verify that `/background-removal/resources.json`, model files, and WASM files load with CORS/CORP-compatible headers under COOP/COEP.
- Do not commit the downloaded model/runtime bundle to Git unless the project owner explicitly accepts repository size, update, and license obligations. The 2026-06-25 HEAD check for the pinned `1.7.0` package reported `Content-Length: 284706412` for `package.tgz`.
- User media is not a deployment asset and must not be uploaded as part of deployment.
- Test fixture media must remain tiny, non-private, and license-safe.

## Headers And Browser Requirements

- If ffmpeg.wasm or related processing requires `SharedArrayBuffer` or multi-threaded WASM, deployment must set cross-origin isolation headers:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- The `/assets/*` immutable cache rule must preserve the same COOP/COEP behavior as the rest of the app.
- Local Vite dev and preview servers must use the same COOP/COEP headers so background-removal and ffmpeg browser verification matches the release runtime.
- Asset sources must be compatible with COOP/COEP. Cross-origin model/WASM assets may need CORS/CORP-compatible hosting.
- Heavy WASM/model libraries must not be imported into the first-load app chunk when they can be loaded at point of use. Current expectation:
  - ffmpeg is loaded from the video Worker path only when a video export/derived preview job starts.
  - background removal is dynamically imported when the user starts an image background-removal job.
- If a selected library works without SharedArrayBuffer in a slower mode, the deployment doc must note the mode and performance tradeoff before release.
- Target browser support for first implementation should prioritize Chromium-based browsers unless a later doc update broadens support.

## Deployment Flow

1. Confirm source-of-truth documents are up to date.
2. Run `pnpm check` once scripts exist.
3. Run `pnpm test:e2e` once browser workflows exist.
4. Build the app with `pnpm build`.
5. Verify the static metadata files exist in the build output:
   - `index.html` contains canonical, Open Graph, Twitter, manifest, and theme-color metadata.
   - `robots.txt` returns the intended allow-all policy.
   - `sitemap.xml` includes only canonical 200-status URLs.
   - `manifest.webmanifest` is present.
   - `og-image.svg` is present.
6. Verify static asset paths for WASM/model files, including the effective background-removal `publicPath`. The initial production target is the pinned IMG.LY CDN asset path unless `VITE_BACKGROUND_REMOVAL_PUBLIC_PATH` is set for self-hosting.
7. Verify build chunks so ffmpeg and background-removal libraries are not synchronously pulled into the first-load app chunk.
8. Verify COOP/COEP headers when required.
9. Verify `/assets/*` target deploy responses include `Cache-Control: public, max-age=31536000, immutable`.
10. Verify the AGPL-compatible open-source release evidence for background removal: public source URL, build instructions, dependency versions, and third-party license notices. If the release is closed-source or commercial, stop until a separate IMG.LY/commercial license or approved replacement exists.
11. Run browser smoke checks on the target deploy:
    - app loads,
    - upload fixture media works,
    - image preview/edit/export smoke works,
    - video preview/export smoke works where feasible,
    - no user media upload path appears in network inspection.
12. Run hosted E2E against the preview URL:
    - `PLAYWRIGHT_BASE_URL=<preview-url> pnpm test:e2e`
    - `RUN_REAL_BACKGROUND_REMOVAL=1 PLAYWRIGHT_BASE_URL=<preview-url> pnpm --filter @obscura/web test:e2e tests/e2e/background-removal-real.spec.ts --project=chromium`
13. Verify target headers, metadata files, and cross-origin isolation:
    - `curl -I <preview-or-production-url>`
    - `curl -I <preview-or-production-url>/robots.txt`
    - `curl -I <preview-or-production-url>/sitemap.xml`
    - `curl -I <preview-or-production-url>/manifest.webmanifest`
    - `curl -I <preview-or-production-url>/assets/<hashed-asset-file>`
    - `globalThis.crossOriginIsolated === true` in the browser.
14. Verify Vercel/Open Graph preview tooling can read the share metadata and no longer reports a missing `twitter:card`.
15. For production, request explicit confirmation before deploying or promoting.

## Health Checks

- App health: Static app loads at `/`, workspace renders, and no fatal console errors appear on first load.
- API health: Not applicable in v1 because no backend API exists.
- Database connectivity: Not applicable in v1 because no database exists.
- Media health:
  - Image fixture can be imported and previewed.
  - Video fixture can be imported and previewed.
  - ffmpeg/background-removal engine loading shows a visible status and does not freeze the UI.
- Privacy health:
  - Upload/edit/export flows do not send user media to a backend or third-party API.

## Logs And Observability

- Local/browser logs may include non-sensitive job state and error codes.
- Logs must not include raw media, file contents, subtitles, local paths, full object URLs, tokens, secrets, or private user metadata.
- Vercel Web Analytics and Vercel Speed Insights are approved for the initial public production release.
- Analytics must remain page/performance telemetry only in v1. Do not add custom events that include media file names, subtitles, object URLs, local paths, image/video metadata, or private user content.
- Vercel runtime logs are expected to be minimal because v1 is a static SPA without backend functions. Log Drains, browser error replay, session recording, or third-party RUM/error vendors require a source-of-truth update before use.
- Browser error reporting services are deferred because they may collect sensitive context; any introduction requires tool/deployment/privacy review.

## Rollback

- Rollback trigger:
  - App fails to load.
  - Static assets for WASM/model files are unavailable.
  - COOP/COEP headers break media processing.
  - A release introduces media upload or unsafe persistence.
  - Critical edit/export flows fail on target browsers.
- Rollback command or procedure:
  - Before Git is initialized: no deployment rollback exists; do not production deploy.
  - After Git and static hosting are configured: redeploy or promote the previous known-good static deployment.
  - For Vercel: use dashboard/CLI to roll back or promote the previous deployment after explicit confirmation.
- Data rollback note:
  - No server data exists in v1.
  - Local browser session data is user-local and cannot be centrally rolled back.

## Pre-Launch Checklist

This checklist is evidence-sensitive. Checked items reflect the latest local MVP closure verification in the current working tree. Production or hosted-environment items stay unchecked until they are verified on the target deployment.

- [x] All source-of-truth docs are current for the MVP closure review.
- [x] `pnpm check` or equivalent passes. Latest evidence: `pnpm check` passed on 2026-06-25.
- [x] Build passes. Latest evidence: `pnpm check` ran the production Vite build successfully on 2026-06-25.
- [x] Browser smoke tests pass for upload, preview, edit, and export. Latest evidence: `pnpm test:e2e` passed on 2026-06-25.
- [x] Real background-removal browser smoke passes. Latest evidence: `RUN_REAL_BACKGROUND_REMOVAL=1 pnpm --filter @obscura/web test:e2e tests/e2e/background-removal-real.spec.ts --project=chromium` passed on 2026-06-25.
- [x] Required env vars are documented; v1 should have no secrets.
- [x] Secrets are not committed in tracked env/config files. Latest evidence: tracked secret/env filename scan only found `.env.example` on 2026-06-25.
- [x] Vercel build/output/header configuration is versioned in `vercel.json`.
- [ ] Target deployment static WASM/model asset paths are verified, including the effective background-removal CDN or `VITE_BACKGROUND_REMOVAL_PUBLIC_PATH` path.
- [x] Local Vite dev/preview COOP/COEP headers are configured and verified for browser tests.
- [ ] Target deploy COOP/COEP headers are configured and verified if required.
- [x] Open-source AGPL-compatible release evidence is prepared in repository docs: public source URL, build instructions, dependency versions, and third-party license notices.
- [x] Closed-source or commercial distribution is not in scope for this release; any future such distribution remains blocked until a separate IMG.LY/commercial license or approved replacement for `@imgly/background-removal` exists.
- [x] Production background-removal model/runtime asset strategy is owner-accepted: initial public production uses the pinned IMG.LY CDN static asset path; self-hosting remains optional later hardening.
- [x] Privacy check confirms user media is not uploaded. Latest evidence: default E2E and real background-removal E2E network assertions passed on 2026-06-25.
- [x] Local health checks pass. Latest evidence: app build, browser smoke, image fixture, video fixture, ffmpeg path, and background-removal path passed in local automated verification on 2026-06-25.
- [ ] Vercel Web Analytics and Speed Insights are verified on a preview or production deployment.
- [x] Rollback path is documented.
- [ ] Rollback path is tested for preview/staging before production.

## Change Rule

- Update this document before changing local run commands, build scripts, deployment host, environment variables, static asset strategy, headers, logging, rollback, production release process, or cloud/analytics behavior.
- Any production deploy or rollback requires explicit confirmation.
