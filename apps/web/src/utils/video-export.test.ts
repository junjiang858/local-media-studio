import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialVideoEditState, updateVideoEditState } from "@obscura/media-core";
import { buildVideoArgs, getInputExtension, getVideoMimeType } from "./video-processing";

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
});
