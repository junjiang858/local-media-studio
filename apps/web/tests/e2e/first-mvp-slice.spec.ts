import path from "node:path";
import { expect, test } from "@playwright/test";

test("edits and downloads an image without external media upload requests", async ({ page }) => {
  const externalRequests: string[] = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";

    if (isHttp && !isLocal) {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /create privately/i })).toBeVisible();

  await page
    .getByLabel(/choose media files/i)
    .setInputFiles(path.join(import.meta.dirname, "../fixtures/local-image.svg"));
  await expect(page.getByRole("button", { name: /local-image\.svg/i })).toBeVisible();

  await page.getByLabel(/crop preset/i).selectOption("1:1");
  await page.getByRole("button", { name: /rotate 90/i }).click();
  await page.getByRole("button", { name: /flip horizontal/i }).click();
  await page.getByLabel(/output width/i).fill("512");
  await page.getByLabel(/brightness/i).fill("14");
  await page.getByLabel(/watermark text/i).fill("Draft");

  await page.getByRole("button", { name: /prepare export/i }).click();
  await expect(page.getByText(/download ready/i)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /download local-image-edited.png/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("local-image-edited.png");
  expect(externalRequests).toEqual([]);
});

test("uses Chinese for Chinese browsers and allows manual English switching", async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: "zh-CN" });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /私密创作/i })).toBeVisible();

  await page.getByLabel(/语言/i).selectOption("en");
  await expect(page.getByRole("heading", { name: /create privately/i })).toBeVisible();

  await context.close();
});
