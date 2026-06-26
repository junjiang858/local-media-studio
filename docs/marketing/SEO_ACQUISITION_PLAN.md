# SEO_ACQUISITION_PLAN

## Status

- Last reviewed: 2026-06-26.
- Canonical public URL: `https://obscura-rouge.vercel.app/`.
- Current architecture: Vite static app plus crawlable static HTML acquisition pages in `apps/web/public/`.

## Goal

Grow organic search traffic for Obscura without adding SSR, a backend, accounts, cloud media upload, a service worker, or analytics that inspect user media.

The first acquisition surface focuses on high-intent users who want a private browser workflow for images and short videos. Static pages should move users into the editor with one clear action and reinforce that v1 media stays local to the browser.

## Search Console Checklist

These external account steps are owner actions because they require Google/Bing account access.

1. Add `https://obscura-rouge.vercel.app/` to Google Search Console as a URL-prefix property.
2. Verify ownership with either a Google-hosted HTML file or a meta tag supplied by Search Console.
3. Submit `https://obscura-rouge.vercel.app/sitemap.xml`.
4. Use URL Inspection for `/`, `/features/private-image-editor/`, `/zh/`, and the first guide URLs.
5. Add the same property to Bing Webmaster Tools and submit the sitemap there.
6. Review indexing reports weekly for discovered pages, excluded pages, impressions, clicks, and country/language split.

## Keyword Map

| Intent                          | English target query                      | English URL                                          | Chinese target query | Chinese URL                                             |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------- | -------------------- | ------------------------------------------------------- |
| Remove backgrounds privately    | remove image background without uploading | `/guides/remove-image-background-without-uploading/` | 无需上传图片去背景   | `/zh/guides/remove-image-background-without-uploading/` |
| Trim short videos locally       | trim video in browser                     | `/guides/trim-video-in-browser/`                     | 浏览器本地裁剪视频   | `/zh/guides/trim-video-in-browser/`                     |
| Convert image formats privately | convert images locally                    | `/guides/convert-images-locally/`                    | 本地转换图片格式     | `/zh/guides/convert-images-locally/`                    |

## Content Rules

- Each page must be direct HTML content, not client-rendered marketing copy.
- Each page must include title, description, canonical, Open Graph, Twitter card, and language alternates.
- Equivalent English and Simplified Chinese pages must link to each other with `hreflang`.
- Pages should use FAQPage or HowTo JSON-LD only when the visible page content supports it.
- Internal links should connect guide pages to feature pages, privacy pages, and related guides.
- Do not claim server-side processing, cloud storage, accounts, AI video generation, or automatic subtitles in v1.
- Mention that model/runtime assets may load as application resources where relevant, while user media remains in the browser workflow.

## First Batch

The first batch adds 6 static guide URLs:

- `/guides/remove-image-background-without-uploading/`
- `/guides/trim-video-in-browser/`
- `/guides/convert-images-locally/`
- `/zh/guides/remove-image-background-without-uploading/`
- `/zh/guides/trim-video-in-browser/`
- `/zh/guides/convert-images-locally/`

## Measurement

Use Google Search Console and Bing Webmaster Tools as the first measurement layer. Do not add custom event analytics for media names, local paths, subtitles, file metadata, object URLs, or user-generated content.
