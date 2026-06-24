import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const imageFixture = path.join(import.meta.dirname, "../fixtures/local-image.svg");

test("pans the image preview from the visible image surface", async ({ page }) => {
  await openImageEditor(page);

  const center = await getImagePreviewCenter(page);
  const before = await getPreviewLayerTranslation(page);
  const cursor = await getCursorAtPoint(page, center);

  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 84, center.y + 32, { steps: 8 });
  await page.mouse.up();

  const after = await getPreviewLayerTranslation(page);

  expect(cursor).toBe("grab");
  expect(Math.round(after.x - before.x)).toBeGreaterThanOrEqual(70);
  expect(Math.round(after.y - before.y)).toBeGreaterThanOrEqual(24);
});

test("resizes selected crop and rectangle layers from transformer handles", async ({ page }) => {
  await openImageEditor(page);

  await page.getByRole("button", { name: /custom/i }).click();
  await expect(page.locator(".image-layer-canvas canvas")).toBeVisible();

  await selectCropLayer(page);
  const cropBefore = await getEditableRectGeometry(page);
  const cropHandle = await getTransformerAnchorCenter(page, "top-left");

  await drag(page, cropHandle, -36, -24);

  const cropAfter = await getEditableRectGeometry(page);
  expect(cropAfter.width).toBeGreaterThan(cropBefore.width + 20);
  expect(cropAfter.height).toBeGreaterThan(cropBefore.height + 14);

  await openImageEditor(page);
  await page.getByRole("tab", { name: /layers/i }).click();
  await page.getByRole("button", { name: /add rectangle/i }).click();
  await selectRectangleLayer(page);
  const rectangleBefore = await getEditableRectGeometry(page);
  const rectangleHandle = await getTransformerAnchorCenter(page, "top-left");

  await drag(page, rectangleHandle, -32, -22);

  const rectangleAfter = await getEditableRectGeometry(page);
  expect(rectangleAfter.width).toBeGreaterThan(rectangleBefore.width + 18);
  expect(rectangleAfter.height).toBeGreaterThan(rectangleBefore.height + 12);
});

async function openImageEditor(page: Page) {
  await page.goto("/");
  await page.getByLabel(/choose media files/i).setInputFiles(imageFixture);
  await expect(page.locator(".image-layer-canvas canvas")).toBeVisible();
}

async function getImagePreviewCenter(page: Page) {
  return page.evaluate(() => {
    const crop = document.querySelector(".image-preview-crop");
    if (!crop) {
      throw new Error("Image preview crop frame was not found.");
    }

    const rect = crop.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
}

async function getCursorAtPoint(page: Page, point: Point) {
  return page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return element ? getComputedStyle(element).cursor : null;
  }, point);
}

async function getPreviewLayerTranslation(page: Page) {
  return page.evaluate(() => {
    const layer = document.querySelector(".preview-canvas-layer");
    if (!layer) {
      throw new Error("Preview canvas layer was not found.");
    }

    const transform = getComputedStyle(layer).transform;
    if (!transform || transform === "none") {
      return { x: 0, y: 0 };
    }

    const matrix = new DOMMatrixReadOnly(transform);
    return { x: matrix.m41, y: matrix.m42 };
  });
}

async function selectCropLayer(page: Page) {
  const center = await getImagePreviewCenter(page);
  await page.mouse.click(center.x, center.y);
  await waitForTransformerAnchor(page, "top-left");
}

async function selectRectangleLayer(page: Page) {
  const center = await page.evaluate(() => {
    const crop = document.querySelector(".image-preview-crop");
    if (!crop) {
      throw new Error("Image preview crop frame was not found.");
    }

    const rect = crop.getBoundingClientRect();
    return {
      x: rect.left + rect.width * (0.18 + 0.34 / 2),
      y: rect.top + rect.height * (0.2 + 0.26 / 2),
    };
  });

  await page.mouse.click(center.x, center.y);
  await waitForTransformerAnchor(page, "top-left");
}

async function waitForTransformerAnchor(page: Page, anchorName: string) {
  await page.waitForFunction((name) => {
    const stages = (window as KonvaWindow).Konva?.stages?.filter(
      (stage) => stage.content?.isConnected,
    );
    const targetAnchor = String(name);

    return Boolean(
      stages?.some((stage) =>
        stage
          .find("Rect")
          .some((node) => node.name().startsWith(targetAnchor) && node.name().includes("_anchor")),
      ),
    );
  }, anchorName);
}

async function getTransformerAnchorCenter(page: Page, anchorName: string) {
  return page.evaluate((name) => {
    const stages = (window as KonvaWindow).Konva?.stages?.filter(
      (stage) => stage.content?.isConnected,
    );
    const targetAnchor = String(name);
    const stage =
      stages?.find((candidate) => {
        return candidate
          .find("Rect")
          .some((node) => node.name().startsWith(targetAnchor) && node.name().includes("_anchor"));
      }) ?? stages?.[stages.length - 1];
    if (!stage) {
      throw new Error("Konva stage was not found.");
    }

    const anchor = stage
      .find("Rect")
      .find((node) => node.name().startsWith(targetAnchor) && node.name().includes("_anchor"));
    if (!anchor) {
      throw new Error(`Transformer anchor ${targetAnchor} was not found.`);
    }

    const stageBox = stage.content.getBoundingClientRect();
    const anchorBox = anchor.getClientRect({ relativeTo: stage });
    return {
      x: stageBox.left + anchorBox.x + anchorBox.width / 2,
      y: stageBox.top + anchorBox.y + anchorBox.height / 2,
    };
  }, anchorName);
}

async function getEditableRectGeometry(page: Page) {
  return page.evaluate(() => {
    const stages = (window as KonvaWindow).Konva?.stages?.filter(
      (stage) => stage.content?.isConnected,
    );
    const stage = stages?.[stages.length - 1];
    if (!stage) {
      throw new Error("Konva stage was not found.");
    }

    const editableRect = stage
      .find("Rect")
      .filter(
        (node) =>
          !node.name() &&
          node.draggable() &&
          node.getClientRect({ relativeTo: stage }).width > 20 &&
          node.getClientRect({ relativeTo: stage }).height > 20,
      )
      .sort(
        (a, b) =>
          b.getClientRect({ relativeTo: stage }).width *
            b.getClientRect({ relativeTo: stage }).height -
          a.getClientRect({ relativeTo: stage }).width *
            a.getClientRect({ relativeTo: stage }).height,
      )[0];

    if (!editableRect) {
      throw new Error("No editable Konva rectangle was found.");
    }

    const box = editableRect.getClientRect({ relativeTo: stage });
    return {
      height: box.height,
      width: box.width,
      x: box.x,
      y: box.y,
    };
  });
}

async function drag(page: Page, start: Point, deltaX: number, deltaY: number) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + deltaX, start.y + deltaY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(160);
}

type Point = {
  x: number;
  y: number;
};

type KonvaNode = {
  draggable: () => boolean;
  getClientRect: (config: { relativeTo: unknown }) => RectGeometry;
  name: () => string;
};

type KonvaStage = {
  content: HTMLElement;
  find: (selector: string | ((node: KonvaNode) => boolean)) => KonvaNode[];
};

type KonvaWindow = Window &
  typeof globalThis & {
    Konva?: {
      stages?: KonvaStage[];
    };
  };

type RectGeometry = {
  height: number;
  width: number;
  x: number;
  y: number;
};
