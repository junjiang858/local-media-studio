import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { expose } from "comlink";
import type { VideoEditState, WorkerJobProgressUpdate } from "@obscura/media-core";
import {
  buildVideoArgs,
  getInputExtension,
  getSubtitleFile,
  getVideoMimeType,
  sanitizeBaseName,
} from "./video-processing";

const ffmpegCoreUrl = new URL(
  "../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js",
  import.meta.url,
).href;
const ffmpegCoreWasmUrl = new URL(
  "../../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm",
  import.meta.url,
).href;

export type VideoWorkerExportResult = {
  blob: Blob;
  filename: string;
  size: number;
};

export type VideoWorkerExportRequest = {
  jobId: string;
  source: File;
  state: VideoEditState;
};

export type VideoWorkerApi = {
  cancelVideoJob: (jobId: string) => void;
  runVideoExport: (
    request: VideoWorkerExportRequest,
    onProgress: (update: WorkerJobProgressUpdate) => void,
  ) => Promise<VideoWorkerExportResult>;
};

let activeJob: { controller: AbortController; ffmpeg: FFmpeg; jobId: string } | null = null;

export const videoWorkerApi: VideoWorkerApi = {
  cancelVideoJob(jobId) {
    if (activeJob?.jobId !== jobId) {
      return;
    }

    activeJob.controller.abort();
    activeJob.ffmpeg.terminate();
    activeJob = null;
  },
  async runVideoExport({ jobId, source, state }, onProgress) {
    const ffmpeg = new FFmpeg();
    const controller = new AbortController();
    const inputName = `input.${getInputExtension(source)}`;
    const outputName = `output.${state.exportFormat}`;

    activeJob = { controller, ffmpeg, jobId };
    onProgress({ message: "Loading FFmpeg", progress: 4, status: "loading" });
    ffmpeg.on("progress", ({ progress }) => {
      onProgress({
        message: "Encoding video",
        progress: Math.round(clamp(progress * 100, 12, 98)),
        status: "processing",
      });
    });

    try {
      await ffmpeg.load(
        {
          coreURL: ffmpegCoreUrl,
          wasmURL: ffmpegCoreWasmUrl,
        },
        { signal: controller.signal },
      );
      onProgress({ message: "Preparing video", progress: 12, status: "processing" });
      await ffmpeg.writeFile(inputName, await fetchFile(source), {
        signal: controller.signal,
      });

      if (state.subtitles.length > 0) {
        await ffmpeg.writeFile("subtitles.vtt", getSubtitleFile(state.subtitles), {
          signal: controller.signal,
        });
      }

      const exitCode = await ffmpeg.exec(buildVideoArgs(inputName, outputName, state), undefined, {
        signal: controller.signal,
      });

      if (exitCode !== 0) {
        throw new Error(`FFmpeg exited with code ${exitCode}`);
      }

      const data = await ffmpeg.readFile(outputName, undefined, { signal: controller.signal });
      const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
      const copiedBytes = new Uint8Array(bytes.byteLength);
      copiedBytes.set(bytes);
      const arrayBuffer = copiedBytes.buffer.slice(
        copiedBytes.byteOffset,
        copiedBytes.byteOffset + copiedBytes.byteLength,
      );
      const blob = new Blob([arrayBuffer], { type: getVideoMimeType(state.exportFormat) });

      return {
        blob,
        filename: `${sanitizeBaseName(source.name)}-edited.${state.exportFormat}`,
        size: blob.size,
      };
    } finally {
      if (activeJob?.jobId === jobId) {
        activeJob = null;
      }
    }
  },
};

expose(videoWorkerApi);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
