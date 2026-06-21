import { describe, expect, it } from "vitest";
import {
  applyImageEditAction,
  buildImageExportPlan,
  classifyMediaKind,
  formatDuration,
  formatFileSize,
  getCurrentImageEditState,
  getNextAssetId,
  initialImageEditHistory,
  serializeWebVtt,
} from "./index";

describe("media core helpers", () => {
  it("classifies supported local media from MIME types", () => {
    expect(classifyMediaKind("image/png")).toBe("image");
    expect(classifyMediaKind("video/mp4")).toBe("video");
    expect(classifyMediaKind("text/plain")).toBeNull();
  });

  it("selects the next asset id with wraparound", () => {
    const ids = ["first", "second", "third"];

    expect(getNextAssetId(ids, "first", 1)).toBe("second");
    expect(getNextAssetId(ids, "third", 1)).toBe("first");
    expect(getNextAssetId(ids, "first", -1)).toBe("third");
    expect(getNextAssetId([], "missing", 1)).toBeNull();
  });

  it("formats file sizes and durations for compact media cards", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatDuration(74.2)).toBe("1:14");
  });

  it("serializes manual subtitle cues to WebVTT text", () => {
    expect(
      serializeWebVtt([
        {
          id: "cue-1",
          startTime: 1.5,
          endTime: 3,
          text: "Hello local editor",
        },
      ]),
    ).toContain("00:00:01.500 --> 00:00:03.000");
  });

  it("applies image edit actions with undo, redo, and reset history", () => {
    const initialHistory = initialImageEditHistory();
    const rotatedHistory = applyImageEditAction(initialHistory, { type: "rotate-clockwise" });
    const adjustedHistory = applyImageEditAction(rotatedHistory, {
      type: "set-adjustment",
      adjustment: "brightness",
      value: 18,
    });
    const undoneHistory = applyImageEditAction(adjustedHistory, { type: "undo" });
    const redoneHistory = applyImageEditAction(undoneHistory, { type: "redo" });
    const resetHistory = applyImageEditAction(redoneHistory, { type: "reset" });

    expect(getCurrentImageEditState(rotatedHistory).rotation).toBe(90);
    expect(getCurrentImageEditState(adjustedHistory).adjustments.brightness).toBe(18);
    expect(getCurrentImageEditState(undoneHistory).adjustments.brightness).toBe(0);
    expect(getCurrentImageEditState(redoneHistory).adjustments.brightness).toBe(18);
    expect(getCurrentImageEditState(resetHistory)).toEqual(
      getCurrentImageEditState(initialHistory),
    );
  });

  it("builds centered crop and resize plans for image export", () => {
    const history = applyImageEditAction(
      applyImageEditAction(initialImageEditHistory(), {
        type: "set-crop-aspect",
        aspect: "1:1",
      }),
      { type: "set-resize-width", width: 600 },
    );

    const plan = buildImageExportPlan({
      sourceName: "cover photo.png",
      sourceWidth: 1200,
      sourceHeight: 800,
      state: getCurrentImageEditState(history),
      format: "jpeg",
      quality: 82,
    });

    expect(plan.crop).toEqual({ x: 200, y: 0, width: 800, height: 800 });
    expect(plan.outputWidth).toBe(600);
    expect(plan.outputHeight).toBe(600);
    expect(plan.mimeType).toBe("image/jpeg");
    expect(plan.suggestedFilename).toBe("cover-photo-edited.jpg");
  });
});
