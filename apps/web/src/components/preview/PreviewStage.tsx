import type { ImageEditState, VideoEditState } from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import type { WorkspaceAsset } from "../../stores/media-store";
import { EmptyPreview } from "./EmptyPreview";
import { SelectedPreview } from "./SelectedPreview";

export function PreviewStage({
  compareOriginal,
  imageState,
  isFullscreen,
  isVisible,
  onAddMedia,
  onCompareToggle,
  onFullscreenToggle,
  onZoomChange,
  selectedAsset,
  t,
  videoState,
  zoom,
}: {
  compareOriginal: boolean;
  imageState: ImageEditState | null;
  isFullscreen: boolean;
  isVisible: boolean;
  onAddMedia: () => void;
  onCompareToggle: () => void;
  onFullscreenToggle: () => void;
  onZoomChange: (zoom: number) => void;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  videoState: VideoEditState | null;
  zoom: number;
}) {
  return (
    <main
      className={`preview-stage ${isFullscreen ? "is-fullscreen" : ""} ${isVisible ? "is-mobile-visible" : ""}`}
    >
      {selectedAsset ? (
        <SelectedPreview
          asset={selectedAsset}
          compareOriginal={compareOriginal}
          imageState={imageState}
          isFullscreen={isFullscreen}
          key={`${selectedAsset.id}-${imageState?.cropAspect ?? "video"}-${compareOriginal ? "compare" : "single"}`}
          onCompareToggle={onCompareToggle}
          onFullscreenToggle={onFullscreenToggle}
          onZoomChange={onZoomChange}
          t={t}
          videoState={videoState}
          zoom={zoom}
        />
      ) : (
        <EmptyPreview onAddMedia={onAddMedia} t={t} />
      )}
    </main>
  );
}
