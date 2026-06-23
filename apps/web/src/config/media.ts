import type {
  ImageCropAspect,
  ImageExportFormat,
  ImageFilterPreset,
  VideoExportFormat,
} from "@local-media-studio/media-core";
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
export const videoExportFormats: VideoExportFormat[] = ["mp4", "webm"];

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
