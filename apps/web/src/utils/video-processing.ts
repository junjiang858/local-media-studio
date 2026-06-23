import { serializeWebVtt } from "@obscura/media-core";
import type { VideoEditState } from "@obscura/media-core";

export function buildVideoArgs(inputName: string, outputName: string, state: VideoEditState) {
  const args: string[] = [];
  const inputFormat = getInputFormat(inputName);
  const needsTranscode =
    state.speed !== 1 || inputFormat !== state.exportFormat || state.subtitles.length > 0;

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

export function getInputExtension(source: File) {
  const extension = source.name.split(".").at(-1)?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  return source.type.includes("webm") ? "webm" : "mp4";
}

export function getVideoMimeType(format: VideoEditState["exportFormat"]) {
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

export function getVideoMimeTypeFromExtension(extension: string) {
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

export function getSubtitleFile(cues: VideoEditState["subtitles"]) {
  return serializeWebVtt(cues);
}

export function sanitizeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "video";
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
