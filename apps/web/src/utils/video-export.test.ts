import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialVideoEditState, updateVideoEditState } from "@obscura/media-core";
import {
  buildVideoArgs,
  getInputExtension,
  getVideoMimeType,
  isBrowserPreviewSafeVideoFormat,
  isLargeVideoForLocalProcessing,
} from "./video-processing";

describe("video export utility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds ffmpeg args with trim, speed, subtitle, and format settings", () => {
    const videoState = updateVideoEditState(
      updateVideoEditState(initialVideoEditState(12), {
        endTime: 8,
        startTime: 2,
        type: "set-trim",
      }),
      { speed: 1.5, type: "set-speed" },
    );
    const finalState = updateVideoEditState(
      updateVideoEditState(videoState, {
        cue: { endTime: 4, id: "cue-1", startTime: 2, text: "Hello" },
        type: "add-subtitle",
      }),
      { format: "webm", type: "set-format" },
    );

    expect(buildVideoArgs("input.mp4", "output.webm", finalState)).toEqual(
      expect.arrayContaining([
        "-ss",
        "2",
        "-i",
        "input.mp4",
        "-t",
        "6",
        "-filter:v",
        "setpts=0.6667*PTS",
        "-i",
        "subtitles.vtt",
        "-c:s",
        "webvtt",
        "output.webm",
      ]),
    );
  });

  it("transcodes when only the output video format changes", () => {
    const state = updateVideoEditState(initialVideoEditState(12), {
      format: "webm",
      type: "set-format",
    });

    expect(buildVideoArgs("input.mp4", "output.webm", state)).toEqual(
      expect.arrayContaining(["-c:v", "libvpx-vp9", "-c:a", "libopus", "output.webm"]),
    );
  });

  it("remuxes compatible container-only exports without re-encoding", () => {
    const state = updateVideoEditState(initialVideoEditState(12), {
      format: "mkv",
      type: "set-format",
    });

    const mp4Args = buildVideoArgs("input.mp4", "output.mkv", state);
    const webmArgs = buildVideoArgs("input.webm", "output.mkv", state);

    expect(mp4Args).toEqual(expect.arrayContaining(["-c:v", "copy", "-c:a", "copy", "output.mkv"]));
    expect(mp4Args).not.toEqual(expect.arrayContaining(["-c:v", "libx264"]));
    expect(webmArgs).toEqual(
      expect.arrayContaining(["-c:v", "copy", "-c:a", "copy", "output.mkv"]),
    );
  });

  it("supports AVI container export with a compatible local transcode", () => {
    const source = new File(["video"], "clip.mp4", { type: "video/mp4" });
    const state = updateVideoEditState(initialVideoEditState(12), {
      format: "avi",
      type: "set-format",
    });

    expect(buildVideoArgs("input.mp4", "output.avi", state)).toEqual(
      expect.arrayContaining(["-c:v", "mpeg4", "-c:a", "mp3", "output.avi"]),
    );
    expect(getInputExtension(source)).toBe("mp4");
    expect(getVideoMimeType("avi")).toBe("video/x-msvideo");
  });

  it("flags large local video jobs before expensive processing", () => {
    expect(
      isLargeVideoForLocalProcessing({
        duration: 181,
        size: 1024,
      }),
    ).toBe(true);
    expect(
      isLargeVideoForLocalProcessing({
        duration: 12,
        size: 80 * 1024 * 1024,
      }),
    ).toBe(true);
    expect(
      isLargeVideoForLocalProcessing({
        duration: 12,
        size: 12 * 1024 * 1024,
      }),
    ).toBe(false);
  });

  it("identifies which output containers are safe for browser preview", () => {
    expect(isBrowserPreviewSafeVideoFormat("mp4")).toBe(true);
    expect(isBrowserPreviewSafeVideoFormat("webm")).toBe(true);
    expect(isBrowserPreviewSafeVideoFormat("mov")).toBe(false);
    expect(isBrowserPreviewSafeVideoFormat("mkv")).toBe(false);
    expect(isBrowserPreviewSafeVideoFormat("avi")).toBe(false);
  });
});
