import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  formatDuration,
  formatFileSize,
  getActiveSubtitleCue,
} from "@local-media-studio/media-core";
import type {
  ImageEditAction,
  ImageEditState,
  VideoEditState,
} from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import { getKindLabel } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { WorkspaceAsset } from "../../stores/media-store";
import { ImagePreviewPane, type PreviewBounds } from "./ImagePreviewPane";
import { PreviewToolbar } from "./PreviewToolbar";

export function SelectedPreview({
  asset,
  compareOriginal,
  imageState,
  isFullscreen,
  onApplyImageAction,
  onCompareToggle,
  onFullscreenToggle,
  onZoomChange,
  t,
  videoState,
  zoom,
}: {
  asset: WorkspaceAsset;
  compareOriginal: boolean;
  imageState: ImageEditState | null;
  isFullscreen: boolean;
  onApplyImageAction: (action: ImageEditAction) => void;
  onCompareToggle: () => void;
  onFullscreenToggle: () => void;
  onZoomChange: (zoom: number) => void;
  t: Copy;
  videoState: VideoEditState | null;
  zoom: number;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [previewBounds, setPreviewBounds] = useState<PreviewBounds | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef({
    isDragging: false,
    panX: 0,
    panY: 0,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      const nextBounds = getPreviewBounds(frame);
      setPreviewBounds((currentBounds) =>
        areSameBounds(currentBounds, nextBounds) ? currentBounds : nextBounds,
      );
    });

    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !videoState) {
      return;
    }

    video.playbackRate = videoState.speed;
  }, [videoState?.speed, videoState]);

  const activeSubtitleCue = videoState ? getActiveSubtitleCue(videoState, currentVideoTime) : null;

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const sensitivity = event.ctrlKey ? 0.9 : 0.14;
    const nextZoom = clamp(zoom - event.deltaY * sensitivity, 40, 320);
    onZoomChange(Math.round(nextZoom));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || isPreviewControl(event.target)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragRef.current = {
      isDragging: true,
      panX: pan.x,
      panY: pan.y,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.isDragging) {
      return;
    }

    const maxPan = Math.max(240, zoom * 5);
    setPan({
      x: clamp(dragRef.current.panX + event.clientX - dragRef.current.startX, -maxPan, maxPan),
      y: clamp(dragRef.current.panY + event.clientY - dragRef.current.startY, -maxPan, maxPan),
    });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current.isDragging = false;
    setIsDragging(false);
  }

  return (
    <section className="selected-preview">
      <div className="preview-meta">
        <div>
          <span>{getKindLabel(asset.kind, t)}</span>
          <h1>{asset.name}</h1>
        </div>
        <div className="preview-meta-actions">
          <MediaInfo asset={asset} t={t} />
        </div>
      </div>

      <div
        ref={frameRef}
        className="preview-frame"
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
      >
        {asset.status === "unsupported" ? (
          <div className="unsupported-preview">
            <StudioIcon name="warning" size={36} />
            <strong>{t.unsupportedFormat}</strong>
          </div>
        ) : asset.kind === "image" ? (
          <div
            className={`preview-canvas-layer ${isDragging ? "is-dragging" : ""}`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})`,
            }}
          >
            <ImagePreviewPane
              asset={asset}
              compareOriginal={compareOriginal}
              imageState={imageState}
              onApplyImageAction={onApplyImageAction}
              previewBounds={previewBounds}
              t={t}
            />
          </div>
        ) : (
          <div
            className={`preview-canvas-layer ${isDragging ? "is-dragging" : ""}`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})`,
            }}
          >
            <video
              ref={videoRef}
              className="video-preview"
              controls
              onLoadedMetadata={(event) => {
                if (videoState?.trimStart) {
                  event.currentTarget.currentTime = videoState.trimStart;
                }
              }}
              onTimeUpdate={(event) => {
                const currentTime = event.currentTarget.currentTime;
                setCurrentVideoTime(currentTime);

                if (videoState?.trimEnd && currentTime >= videoState.trimEnd) {
                  event.currentTarget.pause();
                  event.currentTarget.currentTime = videoState.trimStart;
                }
              }}
              src={asset.objectUrl}
            >
              <track kind="captions" />
            </video>
            {activeSubtitleCue ? (
              <div className="video-subtitle-overlay">{activeSubtitleCue.text}</div>
            ) : null}
          </div>
        )}

        <PreviewToolbar
          compareOriginal={compareOriginal}
          isFullscreen={isFullscreen}
          onCompareToggle={onCompareToggle}
          onFullscreenToggle={onFullscreenToggle}
          onZoomChange={onZoomChange}
          t={t}
          zoom={zoom}
        />
      </div>
    </section>
  );
}

function MediaInfo({ asset, t }: { asset: WorkspaceAsset; t: Copy }) {
  const dimensions =
    asset.width && asset.height
      ? `${Math.round(asset.width)} x ${Math.round(asset.height)}`
      : t.notAvailable;
  const duration =
    typeof asset.duration === "number" ? formatDuration(asset.duration) : t.notAvailable;

  return (
    <div className="media-info">
      <button aria-label={t.mediaInfo} className="icon-button" title={t.mediaInfo} type="button">
        <StudioIcon name="info" size={18} />
      </button>
      <dl className="media-info-popover" role="tooltip">
        <div>
          <dt>{t.fileName}</dt>
          <dd>{asset.name}</dd>
        </div>
        <div>
          <dt>{t.fileSize}</dt>
          <dd>{formatFileSize(asset.size)}</dd>
        </div>
        <div>
          <dt>{t.dimensions}</dt>
          <dd>{dimensions}</dd>
        </div>
        <div>
          <dt>{t.mimeType}</dt>
          <dd>{asset.mimeType}</dd>
        </div>
        {asset.kind === "video" ? (
          <div>
            <dt>{t.duration}</dt>
            <dd>{duration}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPreviewBounds(frame: HTMLDivElement): PreviewBounds {
  const style = getComputedStyle(frame);
  const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

  return {
    height: Math.max(0, frame.clientHeight - verticalPadding),
    width: Math.max(0, frame.clientWidth - horizontalPadding),
  };
}

function areSameBounds(currentBounds: PreviewBounds | null, nextBounds: PreviewBounds) {
  return currentBounds?.width === nextBounds.width && currentBounds.height === nextBounds.height;
}

function isPreviewControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest("button, input, select, textarea, a, video, .preview-toolbar, .media-info"),
    )
  );
}
