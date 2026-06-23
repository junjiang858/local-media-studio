import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialVideoEditState, updateVideoEditState } from "@local-media-studio/media-core";
import { exportEditedVideo } from "./video-export";

const { ffmpegInstance, fetchFileMock } = vi.hoisted(() => ({
  fetchFileMock: vi.fn(),
  ffmpegInstance: {
    exec: vi.fn(),
    load: vi.fn(),
    on: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: vi.fn(function FFmpeg() {
    return ffmpegInstance;
  }),
}));

vi.mock("@ffmpeg/util", () => ({
  fetchFile: fetchFileMock,
}));

describe("video export utility", () => {
  beforeEach(() => {
    fetchFileMock.mockReset();
    ffmpegInstance.exec.mockReset();
    ffmpegInstance.load.mockReset();
    ffmpegInstance.on.mockReset();
    ffmpegInstance.readFile.mockReset();
    ffmpegInstance.writeFile.mockReset();
  });

  it("runs ffmpeg with trim, speed, subtitle, and format settings", async () => {
    const source = new File(["video"], "clip.mp4", { type: "video/mp4" });
    const progress = vi.fn();
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

    fetchFileMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    ffmpegInstance.load.mockResolvedValue(true);
    ffmpegInstance.exec.mockResolvedValue(0);
    ffmpegInstance.readFile.mockResolvedValue(new Uint8Array([4, 5, 6]));

    const result = await exportEditedVideo({
      onProgress: progress,
      source,
      state: finalState,
    });

    expect(ffmpegInstance.load).toHaveBeenCalled();
    expect(ffmpegInstance.writeFile).toHaveBeenCalledWith("input.mp4", new Uint8Array([1, 2, 3]));
    expect(ffmpegInstance.writeFile).toHaveBeenCalledWith(
      "subtitles.vtt",
      expect.stringContaining("WEBVTT"),
    );
    expect(ffmpegInstance.exec).toHaveBeenCalledWith(
      expect.arrayContaining([
        "-ss",
        "2",
        "-i",
        "input.mp4",
        "-t",
        "6",
        "-filter:v",
        "setpts=0.6667*PTS",
        "output.webm",
      ]),
    );
    expect(result.filename).toBe("clip-edited.webm");
    expect(result.blob.type).toBe("video/webm");
    expect(progress).toHaveBeenCalledWith({
      message: "Loading FFmpeg",
      progress: 4,
      status: "loading",
    });
  });

  it("transcodes when only the output video format changes", async () => {
    const source = new File(["video"], "clip.mp4", { type: "video/mp4" });
    const state = updateVideoEditState(initialVideoEditState(12), {
      format: "webm",
      type: "set-format",
    });

    fetchFileMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    ffmpegInstance.load.mockResolvedValue(true);
    ffmpegInstance.exec.mockResolvedValue(0);
    ffmpegInstance.readFile.mockResolvedValue(new Uint8Array([4, 5, 6]));

    await exportEditedVideo({
      source,
      state,
    });

    expect(ffmpegInstance.exec).toHaveBeenCalledWith(
      expect.arrayContaining(["-c:v", "libvpx-vp9", "-c:a", "libopus", "output.webm"]),
    );
  });

  it("supports AVI container export with a compatible local transcode", async () => {
    const source = new File(["video"], "clip.mp4", { type: "video/mp4" });
    const state = updateVideoEditState(initialVideoEditState(12), {
      format: "avi",
      type: "set-format",
    });

    fetchFileMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    ffmpegInstance.load.mockResolvedValue(true);
    ffmpegInstance.exec.mockResolvedValue(0);
    ffmpegInstance.readFile.mockResolvedValue(new Uint8Array([4, 5, 6]));

    const result = await exportEditedVideo({
      source,
      state,
    });

    expect(ffmpegInstance.exec).toHaveBeenCalledWith(
      expect.arrayContaining(["-c:v", "mpeg4", "-c:a", "mp3", "output.avi"]),
    );
    expect(result.filename).toBe("clip-edited.avi");
    expect(result.blob.type).toBe("video/x-msvideo");
  });
});
