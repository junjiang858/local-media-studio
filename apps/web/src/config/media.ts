import type {
  ImageCropAspect,
  ImageExportFormat,
  ImageFilterPreset,
  VideoExportFormat,
} from "@obscura/media-core";
import type { Copy } from "../i18n";
import type { StudioIconName } from "../icons/studio-icons";

export type CropPreset = {
  aspect: ImageCropAspect;
  label: (t: Copy) => string;
  icon: StudioIconName;
  previewClass: string;
};

export type FilterPreset = {
  id: ImageFilterPreset;
  label: (t: Copy) => string;
  swatchClass: string;
};

export const cropPresets: CropPreset[] = [
  { aspect: "free", label: (t) => t.original, icon: "aspectRatio", previewClass: "free" },
  { aspect: "custom", label: (t) => t.custom, icon: "crop", previewClass: "custom" },
  { aspect: "1:1", label: (t) => t.square, icon: "crop", previewClass: "square" },
  { aspect: "4:5", label: (t) => t.portrait, icon: "cropPortrait", previewClass: "portrait" },
  { aspect: "16:9", label: (t) => t.landscape, icon: "cropLandscape", previewClass: "landscape" },
  { aspect: "9:16", label: (t) => t.story, icon: "fitScreen", previewClass: "story" },
];

export const imageExportFormats: ImageExportFormat[] = [
  "png",
  "jpeg",
  "webp",
  "avif",
  "bmp",
  "gif",
  "tiff",
];
export const videoExportFormats: VideoExportFormat[] = ["mp4", "webm", "mov", "mkv", "avi"];
export const lossyImageExportFormats = new Set<ImageExportFormat>(["jpeg", "webp", "avif"]);

export const imageFilterPresets: FilterPreset[] = [
  { id: "none", label: (t) => t.filterNone, swatchClass: "none" },
  { id: "vivid", label: (t) => t.filterVivid, swatchClass: "vivid" },
  { id: "warm", label: (t) => t.filterWarm, swatchClass: "warm" },
  { id: "cool", label: (t) => t.filterCool, swatchClass: "cool" },
  { id: "mono", label: (t) => t.filterMono, swatchClass: "mono" },
  { id: "film", label: (t) => t.filterFilm, swatchClass: "film" },
  { id: "fade", label: (t) => t.filterFade, swatchClass: "fade" },
];

export const defaultImageExportFormat: ImageExportFormat = "png";
export const defaultImageQuality = 86;

export type ImageExportSettings = {
  format: ImageExportFormat;
  quality: number;
};

export function getDefaultImageExportSettings(mimeType?: string): ImageExportSettings {
  return {
    format: getImageExportFormatFromMimeType(mimeType),
    quality: defaultImageQuality,
  };
}

export function getImageExportFormatFromMimeType(mimeType?: string): ImageExportFormat {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return "jpeg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/avif") {
    return "avif";
  }

  if (mimeType === "image/bmp") {
    return "bmp";
  }

  if (mimeType === "image/gif") {
    return "gif";
  }

  if (mimeType === "image/tiff") {
    return "tiff";
  }

  return defaultImageExportFormat;
}

export function supportsImageQuality(format: ImageExportFormat) {
  return lossyImageExportFormats.has(format);
}

export function getVideoExportFormatFromMimeType(mimeType?: string): VideoExportFormat {
  if (mimeType === "video/webm") {
    return "webm";
  }

  if (mimeType === "video/quicktime" || mimeType === "video/mov") {
    return "mov";
  }

  if (mimeType === "video/x-matroska" || mimeType === "video/matroska") {
    return "mkv";
  }

  if (mimeType === "video/x-msvideo" || mimeType === "video/avi") {
    return "avi";
  }

  return "mp4";
}
