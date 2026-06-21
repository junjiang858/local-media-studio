import { subtitleCueSchema, type MediaKind, type SubtitleCue } from "@local-media-studio/shared";

const byteUnits = ["B", "KB", "MB", "GB", "TB"] as const;

export type ImageCropAspect = "free" | "1:1" | "4:5" | "9:16" | "16:9";
export type ImageAdjustment = "brightness" | "contrast" | "saturation";
export type ImageExportFormat = "png" | "jpeg" | "webp";

export type ImageEditState = {
  cropAspect: ImageCropAspect;
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  resizeWidth: number | null;
  watermarkText: string;
  adjustments: Record<ImageAdjustment, number>;
};

export type ImageEditHistory = {
  past: ImageEditState[];
  present: ImageEditState;
  future: ImageEditState[];
};

export type ImageEditAction =
  | { type: "set-crop-aspect"; aspect: ImageCropAspect }
  | { type: "rotate-clockwise" }
  | { type: "rotate-counterclockwise" }
  | { type: "toggle-flip-horizontal" }
  | { type: "toggle-flip-vertical" }
  | { type: "set-resize-width"; width: number | null }
  | { type: "set-watermark"; text: string }
  | { type: "set-adjustment"; adjustment: ImageAdjustment; value: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

export type ImageExportPlan = {
  crop: { x: number; y: number; width: number; height: number };
  outputWidth: number;
  outputHeight: number;
  mimeType: `image/${ImageExportFormat}`;
  quality: number;
  suggestedFilename: string;
};

const defaultImageEditState: ImageEditState = {
  cropAspect: "free",
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  resizeWidth: null,
  watermarkText: "",
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
  },
};

export function classifyMediaKind(mimeType: string): MediaKind | null {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return null;
}

export function getNextAssetId(
  assetIds: readonly string[],
  currentAssetId: string | null,
  direction: 1 | -1,
): string | null {
  if (assetIds.length === 0) {
    return null;
  }

  const currentIndex = currentAssetId ? assetIds.indexOf(currentAssetId) : -1;
  const startingIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (startingIndex + direction + assetIds.length) % assetIds.length;

  return assetIds[nextIndex] ?? null;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < byteUnits.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;

  return `${rounded} ${byteUnits[unitIndex]}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function serializeWebVtt(cues: readonly SubtitleCue[]): string {
  const lines = ["WEBVTT", ""];

  cues.forEach((cue, index) => {
    const parsedCue = subtitleCueSchema.parse(cue);

    lines.push(String(index + 1));
    lines.push(`${formatTimestamp(parsedCue.startTime)} --> ${formatTimestamp(parsedCue.endTime)}`);
    lines.push(parsedCue.text);
    lines.push("");
  });

  return lines.join("\n");
}

export function initialImageEditHistory(): ImageEditHistory {
  return {
    past: [],
    present: cloneImageEditState(defaultImageEditState),
    future: [],
  };
}

export function getCurrentImageEditState(history: ImageEditHistory): ImageEditState {
  return cloneImageEditState(history.present);
}

export function applyImageEditAction(
  history: ImageEditHistory,
  action: ImageEditAction,
): ImageEditHistory {
  if (action.type === "undo") {
    const previous = history.past.at(-1);

    if (!previous) {
      return history;
    }

    return {
      past: history.past.slice(0, -1),
      present: cloneImageEditState(previous),
      future: [cloneImageEditState(history.present), ...history.future],
    };
  }

  if (action.type === "redo") {
    const next = history.future[0];

    if (!next) {
      return history;
    }

    return {
      past: [...history.past, cloneImageEditState(history.present)],
      present: cloneImageEditState(next),
      future: history.future.slice(1),
    };
  }

  if (action.type === "reset") {
    return initialImageEditHistory();
  }

  const next = reduceImageEditState(history.present, action);

  if (JSON.stringify(next) === JSON.stringify(history.present)) {
    return history;
  }

  return {
    past: [...history.past, cloneImageEditState(history.present)],
    present: next,
    future: [],
  };
}

export function buildImageExportPlan({
  sourceName,
  sourceWidth,
  sourceHeight,
  state,
  format,
  quality,
}: {
  sourceName: string;
  sourceWidth: number;
  sourceHeight: number;
  state: ImageEditState;
  format: ImageExportFormat;
  quality: number;
}): ImageExportPlan {
  const crop = getCenteredCrop(sourceWidth, sourceHeight, state.cropAspect);
  const rotated = state.rotation === 90 || state.rotation === 270;
  const naturalWidth = rotated ? crop.height : crop.width;
  const naturalHeight = rotated ? crop.width : crop.height;
  const outputWidth = state.resizeWidth ?? naturalWidth;
  const outputHeight = Math.round((outputWidth / naturalWidth) * naturalHeight);

  return {
    crop,
    outputWidth,
    outputHeight,
    mimeType: `image/${format}`,
    quality: clamp(quality, 1, 100),
    suggestedFilename: `${sanitizeBaseName(sourceName)}-edited.${format === "jpeg" ? "jpg" : format}`,
  };
}

function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return (
    [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      wholeSeconds.toString().padStart(2, "0"),
    ].join(":") + `.${milliseconds.toString().padStart(3, "0")}`
  );
}

function reduceImageEditState(
  state: ImageEditState,
  action: Exclude<ImageEditAction, { type: "undo" | "redo" | "reset" }>,
): ImageEditState {
  switch (action.type) {
    case "set-crop-aspect":
      return { ...cloneImageEditState(state), cropAspect: action.aspect };
    case "rotate-clockwise":
      return { ...cloneImageEditState(state), rotation: rotate(state.rotation, 90) };
    case "rotate-counterclockwise":
      return { ...cloneImageEditState(state), rotation: rotate(state.rotation, -90) };
    case "toggle-flip-horizontal":
      return { ...cloneImageEditState(state), flipHorizontal: !state.flipHorizontal };
    case "toggle-flip-vertical":
      return { ...cloneImageEditState(state), flipVertical: !state.flipVertical };
    case "set-resize-width":
      return {
        ...cloneImageEditState(state),
        resizeWidth: action.width ? Math.round(clamp(action.width, 16, 12000)) : null,
      };
    case "set-watermark":
      return { ...cloneImageEditState(state), watermarkText: action.text.slice(0, 120) };
    case "set-adjustment":
      return {
        ...cloneImageEditState(state),
        adjustments: {
          ...state.adjustments,
          [action.adjustment]: clamp(action.value, -100, 100),
        },
      };
  }
}

function cloneImageEditState(state: ImageEditState): ImageEditState {
  return {
    ...state,
    adjustments: { ...state.adjustments },
  };
}

function rotate(current: ImageEditState["rotation"], delta: 90 | -90): ImageEditState["rotation"] {
  return ((((current + delta) % 360) + 360) % 360) as ImageEditState["rotation"];
}

function getCenteredCrop(
  sourceWidth: number,
  sourceHeight: number,
  aspect: ImageCropAspect,
): ImageExportPlan["crop"] {
  const targetAspect = parseAspectRatio(aspect);

  if (!targetAspect) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  const sourceAspect = sourceWidth / sourceHeight;

  if (sourceAspect > targetAspect) {
    const width = Math.round(sourceHeight * targetAspect);
    return {
      x: Math.round((sourceWidth - width) / 2),
      y: 0,
      width,
      height: sourceHeight,
    };
  }

  const height = Math.round(sourceWidth / targetAspect);

  return {
    x: 0,
    y: Math.round((sourceHeight - height) / 2),
    width: sourceWidth,
    height,
  };
}

function parseAspectRatio(aspect: ImageCropAspect): number | null {
  if (aspect === "free") {
    return null;
  }

  const [width, height] = aspect.split(":").map(Number);

  if (!width || !height) {
    return null;
  }

  return width / height;
}

function sanitizeBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "media";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
