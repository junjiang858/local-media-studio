import { describe, expect, it } from "vitest";
import {
  classifyMediaKind,
  formatDuration,
  formatFileSize,
  getNextAssetId,
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
});
