import { create } from "zustand";
import {
  applyImageEditAction,
  classifyMediaKind,
  getNextAssetId,
  initialImageEditHistory,
  initialVideoEditState,
  updateVideoEditState,
} from "@local-media-studio/media-core";
import type {
  ImageEditAction,
  ImageEditHistory,
  VideoEditAction,
  VideoEditState,
} from "@local-media-studio/media-core";
import type { MediaAsset, MediaKind } from "@local-media-studio/shared";
import {
  getDefaultImageExportSettings,
  getVideoExportFormatFromMimeType,
  type ImageExportSettings,
} from "../config/media";

export type MediaFilter = "all" | MediaKind;
export type WorkspaceAsset = MediaAsset & { file: File };
export type MediaMetadataUpdate = Pick<MediaAsset, "width" | "height" | "duration">;

type MediaStore = {
  assets: WorkspaceAsset[];
  selectedAssetId: string | null;
  filter: MediaFilter;
  imageExportSettings: Record<string, ImageExportSettings>;
  imageHistories: Record<string, ImageEditHistory>;
  videoEdits: Record<string, VideoEditState>;
  addFiles: (files: File[]) => void;
  selectAsset: (assetId: string) => void;
  selectAdjacent: (direction: 1 | -1) => void;
  setFilter: (filter: MediaFilter) => void;
  updateImageExportSettings: (assetId: string, patch: Partial<ImageExportSettings>) => void;
  applyImageAction: (assetId: string, action: ImageEditAction) => void;
  applyVideoAction: (assetId: string, action: VideoEditAction) => void;
  updateAssetMetadata: (assetId: string, metadata: MediaMetadataUpdate) => void;
  removeSelected: () => void;
};

export const useMediaStore = create<MediaStore>((set, get) => ({
  assets: [],
  selectedAssetId: null,
  filter: "all",
  imageExportSettings: {},
  imageHistories: {},
  videoEdits: {},
  addFiles: (files) => {
    const acceptedAssets = files.map(createMediaAsset);
    const newImageHistories = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "image")
        .map((asset) => [asset.id, initialImageEditHistory()]),
    );
    const newImageExportSettings = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "image")
        .map((asset) => [asset.id, getDefaultImageExportSettings(asset.mimeType)]),
    );
    const newVideoEdits = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "video")
        .map((asset) => [
          asset.id,
          initialVideoEditState(asset.duration, getVideoExportFormatFromMimeType(asset.mimeType)),
        ]),
    );

    set((state) => ({
      assets: [...state.assets, ...acceptedAssets],
      imageExportSettings: { ...state.imageExportSettings, ...newImageExportSettings },
      imageHistories: { ...state.imageHistories, ...newImageHistories },
      videoEdits: { ...state.videoEdits, ...newVideoEdits },
      selectedAssetId: acceptedAssets[0]?.id ?? state.selectedAssetId,
    }));
  },
  selectAsset: (assetId) => {
    set({ selectedAssetId: assetId });
  },
  selectAdjacent: (direction) => {
    const state = get();
    const visibleIds = getVisibleAssets(state.assets, state.filter).map((asset) => asset.id);
    const nextId = getNextAssetId(visibleIds, state.selectedAssetId, direction);

    if (nextId) {
      set({ selectedAssetId: nextId });
    }
  },
  setFilter: (filter) => {
    const state = get();
    const visibleAssets = getVisibleAssets(state.assets, filter);
    const selectedStillVisible = visibleAssets.some((asset) => asset.id === state.selectedAssetId);

    set({
      filter,
      selectedAssetId: selectedStillVisible
        ? state.selectedAssetId
        : (visibleAssets[0]?.id ?? null),
    });
  },
  updateImageExportSettings: (assetId, patch) => {
    set((state) => {
      const asset = state.assets.find((item) => item.id === assetId);
      const currentSettings =
        state.imageExportSettings[assetId] ?? getDefaultImageExportSettings(asset?.mimeType);

      return {
        imageExportSettings: {
          ...state.imageExportSettings,
          [assetId]: {
            ...currentSettings,
            ...patch,
          },
        },
      };
    });
  },
  applyImageAction: (assetId, action) => {
    set((state) => {
      const history = state.imageHistories[assetId] ?? initialImageEditHistory();

      return {
        imageHistories: {
          ...state.imageHistories,
          [assetId]: applyImageEditAction(history, action),
        },
      };
    });
  },
  applyVideoAction: (assetId, action) => {
    set((state) => {
      const videoState = state.videoEdits[assetId] ?? initialVideoEditState();

      return {
        videoEdits: {
          ...state.videoEdits,
          [assetId]: updateVideoEditState(videoState, action),
        },
      };
    });
  },
  updateAssetMetadata: (assetId, metadata) => {
    set((state) => {
      const nextAssets = state.assets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              ...metadata,
            }
          : asset,
      );

      return {
        assets: nextAssets,
        videoEdits:
          typeof metadata.duration === "number" &&
          state.videoEdits[assetId] &&
          state.videoEdits[assetId].trimEnd === null
            ? {
                ...state.videoEdits,
                [assetId]: {
                  ...state.videoEdits[assetId],
                  trimEnd: Math.round(metadata.duration * 100) / 100,
                },
              }
            : state.videoEdits,
      };
    });
  },
  removeSelected: () => {
    const state = get();
    const selectedAsset = state.assets.find((asset) => asset.id === state.selectedAssetId);

    if (selectedAsset) {
      URL.revokeObjectURL(selectedAsset.objectUrl);
    }

    const remainingAssets = state.assets.filter((asset) => asset.id !== state.selectedAssetId);
    const visibleAssets = getVisibleAssets(remainingAssets, state.filter);
    const remainingHistories = { ...state.imageHistories };
    const remainingImageExportSettings = { ...state.imageExportSettings };
    const remainingVideoEdits = { ...state.videoEdits };

    if (state.selectedAssetId) {
      delete remainingHistories[state.selectedAssetId];
      delete remainingImageExportSettings[state.selectedAssetId];
      delete remainingVideoEdits[state.selectedAssetId];
    }

    set({
      assets: remainingAssets,
      imageExportSettings: remainingImageExportSettings,
      imageHistories: remainingHistories,
      videoEdits: remainingVideoEdits,
      selectedAssetId: visibleAssets[0]?.id ?? null,
    });
  },
}));

export function createMediaAsset(file: File, index: number): WorkspaceAsset {
  const kind = classifyMediaKind(file.type);
  const fallbackKind: MediaKind = file.type.startsWith("video/") ? "video" : "image";

  return {
    id: `asset-${Date.now()}-${index}-${file.name}`,
    kind: kind ?? fallbackKind,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    objectUrl: URL.createObjectURL(file),
    status: kind ? "ready" : "unsupported",
    file,
    ...(kind ? {} : { error: "Unsupported media type" }),
  };
}

export function getVisibleAssets(
  assets: readonly WorkspaceAsset[],
  filter: MediaFilter,
): WorkspaceAsset[] {
  if (filter === "all") {
    return [...assets];
  }

  return assets.filter((asset) => asset.kind === filter);
}
