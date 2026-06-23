import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { serializeWebVtt } from "@local-media-studio/media-core";
import type { VideoEditState, WorkerJobProgressUpdate } from "@local-media-studio/media-core";

export type VideoExportResult = {
  blob: Blob;
  filename: string;
  size: number;
  url: string;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    accept: Record<string, string[]>;
    description: string;
  }>;
};

type SaveFilePickerHandle = {
  createWritable: () => Promise<{
    close: () => Promise<void> | void;
    write: (data: Blob) => Promise<void> | void;
  }>;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>;
};

export async function exportEditedVideo({
  onProgress,
  signal,
  source,
  state,
}: {
  onProgress?: (update: WorkerJobProgressUpdate) => void;
  signal?: AbortSignal;
  source: File;
  state: VideoEditState;
}): Promise<VideoExportResult> {
  const ffmpeg = new FFmpeg();
  const inputName = `input.${getInputExtension(source)}`;
  const outputName = `output.${state.exportFormat}`;

  onProgress?.({ message: "Loading FFmpeg", progress: 4, status: "loading" });
  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.({
      message: "Encoding video",
      progress: Math.round(clamp(progress * 100, 12, 98)),
      status: "processing",
    });
  });

  if (signal) {
    await ffmpeg.load(undefined, { signal });
  } else {
    await ffmpeg.load();
  }
  onProgress?.({ message: "Preparing video", progress: 12, status: "processing" });
  await ffmpeg.writeFile(inputName, await fetchFile(source));

  if (state.subtitles.length > 0) {
    await ffmpeg.writeFile("subtitles.vtt", serializeWebVtt(state.subtitles));
  }

  const exitCode = await ffmpeg.exec(buildVideoArgs(inputName, outputName, state));

  if (exitCode !== 0) {
    throw new Error(`FFmpeg exited with code ${exitCode}`);
  }

  const data = await ffmpeg.readFile(outputName);
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const copiedBytes = new Uint8Array(bytes.byteLength);
  copiedBytes.set(bytes);
  const arrayBuffer = copiedBytes.buffer.slice(
    copiedBytes.byteOffset,
    copiedBytes.byteOffset + copiedBytes.byteLength,
  );
  const blob = new Blob([arrayBuffer], { type: getVideoMimeType(state.exportFormat) });
  const filename = `${sanitizeBaseName(source.name)}-edited.${state.exportFormat}`;

  return {
    blob,
    filename,
    size: blob.size,
    url: URL.createObjectURL(blob),
  };
}

export async function saveVideoExport(result: VideoExportResult) {
  const savePicker = (window as SaveFilePickerWindow).showSaveFilePicker;
  const extension = `.${result.filename.split(".").at(-1) ?? "mp4"}`;
  const mimeType = result.blob.type || getVideoMimeTypeFromExtension(extension);

  if (savePicker && window.isSecureContext) {
    try {
      const handle = await savePicker({
        suggestedName: result.filename,
        types: [
          {
            accept: {
              [mimeType]: [extension],
            },
            description: `${extension.slice(1).toUpperCase()} video`,
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(result.blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }

  const link = document.createElement("a");
  link.download = result.filename;
  link.href = result.url;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

export function getVideoExportErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function buildVideoArgs(inputName: string, outputName: string, state: VideoEditState): string[] {
  const args: string[] = [];
  const inputFormat = getInputFormat(inputName);
  const needsTranscode = state.speed !== 1 || inputFormat !== state.exportFormat;

  if (state.trimStart > 0) {
    args.push("-ss", String(state.trimStart));
  }

  args.push("-i", inputName);

  if (state.trimEnd !== null) {
    args.push("-t", String(Math.max(0.1, state.trimEnd - state.trimStart)));
  }

  if (state.subtitles.length > 0) {
    args.push("-i", "subtitles.vtt");
  }

  args.push("-map", "0:v:0", "-map", "0:a?");

  if (state.subtitles.length > 0) {
    args.push("-map", "1:0");
  }

  if (state.speed !== 1) {
    args.push("-filter:v", `setpts=${(1 / state.speed).toFixed(4)}*PTS`);
    args.push("-filter:a", `atempo=${state.speed}`);
  }

  if (needsTranscode) {
    args.push(...getTranscodeArgs(state.exportFormat));
  } else {
    args.push("-c:v", "copy", "-c:a", "copy");
  }

  if (state.subtitles.length > 0) {
    args.push("-c:s", state.exportFormat === "mp4" ? "mov_text" : "webvtt");
  }

  args.push(outputName);
  return args;
}

function getTranscodeArgs(format: VideoEditState["exportFormat"]) {
  if (format === "webm") {
    return ["-c:v", "libvpx-vp9", "-c:a", "libopus"];
  }

  if (format === "avi") {
    return ["-c:v", "mpeg4", "-c:a", "mp3"];
  }

  return ["-c:v", "libx264", "-c:a", "aac"];
}

function getInputFormat(inputName: string): VideoEditState["exportFormat"] {
  const lowerInputName = inputName.toLowerCase();

  if (lowerInputName.endsWith(".webm")) {
    return "webm";
  }

  if (lowerInputName.endsWith(".mov")) {
    return "mov";
  }

  if (lowerInputName.endsWith(".mkv")) {
    return "mkv";
  }

  if (lowerInputName.endsWith(".avi")) {
    return "avi";
  }

  return "mp4";
}

function getInputExtension(source: File) {
  const extension = source.name.split(".").at(-1)?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  return source.type.includes("webm") ? "webm" : "mp4";
}

function getVideoMimeType(format: VideoEditState["exportFormat"]) {
  if (format === "webm") {
    return "video/webm";
  }

  if (format === "mov") {
    return "video/quicktime";
  }

  if (format === "mkv") {
    return "video/x-matroska";
  }

  if (format === "avi") {
    return "video/x-msvideo";
  }

  return "video/mp4";
}

function getVideoMimeTypeFromExtension(extension: string) {
  if (extension === ".webm") {
    return "video/webm";
  }

  if (extension === ".mov") {
    return "video/quicktime";
  }

  if (extension === ".mkv") {
    return "video/x-matroska";
  }

  if (extension === ".avi") {
    return "video/x-msvideo";
  }

  return "video/mp4";
}

function sanitizeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "video";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
