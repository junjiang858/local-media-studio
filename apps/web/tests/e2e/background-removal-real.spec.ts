import { Buffer } from "node:buffer";
import { expect, test, type Page } from "@playwright/test";

const runRealBackgroundRemoval = process.env.RUN_REAL_BACKGROUND_REMOVAL === "1";
const realBackgroundRemovalTimeoutMs = 600_000;

test.skip(
  !runRealBackgroundRemoval,
  "Set RUN_REAL_BACKGROUND_REMOVAL=1 to verify the real background-removal model path.",
);

test("runs real background removal and keeps user media local", async ({ page }) => {
  test.setTimeout(realBackgroundRemovalTimeoutMs + 30_000);
  const browserMessages: string[] = [];
  const externalRequests: Array<{ method: string; url: string }> = [];
  const pageErrors: string[] = [];
  const requestFailures: Array<{ errorText: string; method: string; url: string }> = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      browserMessages.push(`[${message.type()}] ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("request", (request) => {
    const url = new URL(request.url());
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";

    if (isHttp && !isLocal) {
      externalRequests.push({
        method: request.method(),
        url: request.url(),
      });
    }
  });

  page.on("requestfailed", (request) => {
    requestFailures.push({
      errorText: request.failure()?.errorText ?? "",
      method: request.method(),
      url: request.url(),
    });
  });

  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => globalThis.crossOriginIsolated), { timeout: 5_000 })
    .toBe(true);

  const pngBase64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    context.fillStyle = "#f8fbff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#121826";
    context.beginPath();
    context.arc(48, 48, 30, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#7cd7ff";
    context.fillRect(39, 22, 18, 52);

    const encodedPng = canvas.toDataURL("image/png").split(",")[1];

    if (!encodedPng) {
      throw new Error("Generated PNG data URL is empty.");
    }

    return encodedPng;
  });

  await page.getByLabel(/choose media files/i).setInputFiles({
    buffer: Buffer.from(pngBase64, "base64"),
    mimeType: "image/png",
    name: "closure-real.png",
  });

  await page.getByRole("tab", { name: /background/i }).click();
  await page.getByRole("button", { name: /remove background/i }).click();

  await expect(page.getByText(/removing background/i)).toBeVisible({ timeout: 30_000 });
  await waitForBackgroundRemoval(page, {
    browserMessages,
    pageErrors,
    requestFailures,
    timeout: realBackgroundRemovalTimeoutMs,
  });

  await page
    .getByRole("button", { name: /processing queue/i })
    .hover()
    .catch(() => undefined);
  const openResultButton = page.getByRole("button", {
    name: /open result: background removal - transparent png/i,
  });

  if (await openResultButton.isVisible().catch(() => false)) {
    await openResultButton.click();
  }

  await expect(
    page.getByRole("button", { name: /closure-real-background-removed\.png/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /closure-real-background-removed\.png/i }),
  ).toBeVisible({ timeout: 30_000 });

  const disallowedMediaUploads = externalRequests.filter(
    (request) => !["GET", "HEAD", "OPTIONS"].includes(request.method),
  );
  const filenameLeaks = externalRequests.filter((request) =>
    /closure-real|background-removed/i.test(request.url),
  );

  expect(disallowedMediaUploads).toEqual([]);
  expect(filenameLeaks).toEqual([]);
});

async function waitForBackgroundRemoval(
  page: Page,
  diagnostics: {
    browserMessages: string[];
    pageErrors: string[];
    requestFailures: Array<{ errorText: string; method: string; url: string }>;
    timeout: number;
  },
) {
  const resultButton = page.getByRole("button", {
    name: /closure-real-background-removed\.png/i,
  });
  const openResultButton = page.getByRole("button", {
    name: /open result: background removal - transparent png/i,
  });
  const queueButton = page.getByRole("button", { name: /processing queue/i });

  try {
    await expect
      .poll(
        async () => {
          if (await resultButton.isVisible().catch(() => false)) {
            return "completed";
          }

          await queueButton.hover().catch(() => undefined);

          if (await openResultButton.isVisible().catch(() => false)) {
            return "completed";
          }

          const failureText = await page
            .locator(".processing-job-error")
            .first()
            .textContent()
            .catch(() => null);

          if (failureText?.trim()) {
            return `failed: ${failureText.trim()}`;
          }

          const statusText =
            (await page
              .locator(".processing-job-title-row")
              .first()
              .textContent()
              .catch(() => "")) ?? "";

          if (/new result|completed/i.test(statusText)) {
            return "completed";
          }

          const progress = await page
            .locator(".job-progress")
            .first()
            .getAttribute("aria-valuenow")
            .catch(() => null);

          return `pending: ${statusText.trim()} ${progress ?? ""}`.trim();
        },
        {
          intervals: [1_000, 2_000, 5_000],
          timeout: diagnostics.timeout,
        },
      )
      .toBe("completed");
  } catch (error) {
    await queueButton.hover().catch(() => undefined);

    if (
      (await resultButton.isVisible().catch(() => false)) ||
      (await openResultButton.isVisible().catch(() => false))
    ) {
      return;
    }

    const statusText =
      (await page
        .locator(".processing-job-title-row")
        .first()
        .textContent()
        .catch(() => "")) ?? "";

    if (/new result|completed/i.test(statusText)) {
      return;
    }

    const queueText = await page
      .locator(".processing-center")
      .textContent()
      .catch(() => "");
    const editorText = await page
      .locator(".job-message")
      .textContent()
      .catch(() => "");
    const details = [
      error instanceof Error ? error.message : String(error),
      "",
      "Background removal diagnostics:",
      `Queue: ${queueText?.trim() ?? "(unavailable)"}`,
      `Editor job message: ${editorText?.trim() || "(none)"}`,
      `Console warnings/errors: ${formatDiagnostics(diagnostics.browserMessages)}`,
      `Page errors: ${formatDiagnostics(diagnostics.pageErrors)}`,
      `Request failures: ${formatDiagnostics(
        diagnostics.requestFailures.map(
          (request) => `${request.method} ${request.url} ${request.errorText}`,
        ),
      )}`,
    ];

    throw new Error(details.join("\n"));
  }
}

function formatDiagnostics(entries: string[]) {
  return entries.length ? entries.slice(-8).join(" | ") : "(none)";
}
