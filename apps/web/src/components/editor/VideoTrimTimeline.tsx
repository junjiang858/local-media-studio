import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { formatDuration, type VideoEditAction, type VideoEditState } from "@obscura/media-core";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import type { VideoThumbnail } from "../../utils/video-thumbnails";

type TrimHandle = "start" | "end";

export function VideoTrimTimeline({
  duration,
  onApply,
  onGeneratePreview,
  t,
  videoState,
  videoThumbnails,
}: {
  duration: number | null;
  onApply: (action: VideoEditAction) => void;
  onGeneratePreview: () => void;
  t: Copy;
  videoState: VideoEditState;
  videoThumbnails: VideoThumbnail[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<TrimHandle | null>(null);
  const timelineDuration = getTimelineDuration(duration, videoState);
  const trimEnd = Math.min(videoState.trimEnd ?? timelineDuration, timelineDuration);
  const trimStart = Math.min(videoState.trimStart, Math.max(0, trimEnd - 0.1));
  const startPercent = (trimStart / timelineDuration) * 100;
  const endPercent = (trimEnd / timelineDuration) * 100;
  const trackStyle = {
    "--trim-end": `${endPercent}%`,
    "--trim-start": `${startPercent}%`,
  } as CSSProperties;

  function beginDrag(handle: TrimHandle, event: PointerEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof trackRef.current?.setPointerCapture === "function") {
      trackRef.current.setPointerCapture(event.pointerId);
    }
    setActiveHandle(handle);
    updateTrim(handle, event.clientX);
  }

  function beginTrackDrag(event: PointerEvent<HTMLDivElement>) {
    const seconds = getSecondsFromPointer(event.clientX);
    const nextHandle =
      Math.abs(seconds - trimStart) <= Math.abs(seconds - trimEnd) ? "start" : "end";

    beginDrag(nextHandle, event);
  }

  function updateTrim(handle: TrimHandle, clientX: number) {
    const seconds = getSecondsFromPointer(clientX);

    if (handle === "start") {
      onApply({
        endTime: trimEnd,
        startTime: Math.min(seconds, trimEnd - 0.1),
        type: "set-trim",
      });
      return;
    }

    onApply({
      endTime: Math.max(seconds, trimStart + 0.1),
      startTime: trimStart,
      type: "set-trim",
    });
  }

  function getSecondsFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect?.width) {
      return 0;
    }

    const progress = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(progress * timelineDuration * 100) / 100;
  }

  return (
    <div className="video-trim-control">
      <div className="video-timeline-label-row">
        <span>{t.trimTimeline}</span>
        <output>{`${formatDuration(trimStart)} - ${formatDuration(trimEnd)}`}</output>
      </div>
      <div
        ref={trackRef}
        aria-label={t.trimTimeline}
        className="video-trim-track"
        onPointerCancel={() => setActiveHandle(null)}
        onPointerDown={beginTrackDrag}
        onPointerMove={(event) => {
          if (activeHandle) {
            updateTrim(activeHandle, event.clientX);
          }
        }}
        onPointerUp={(event) => {
          if (
            typeof trackRef.current?.hasPointerCapture === "function" &&
            trackRef.current.hasPointerCapture(event.pointerId)
          ) {
            trackRef.current.releasePointerCapture(event.pointerId);
          }
          setActiveHandle(null);
        }}
        role="group"
        style={trackStyle}
        tabIndex={0}
      >
        {videoThumbnails.length ? (
          <div aria-hidden="true" className="video-thumbnail-strip">
            {videoThumbnails.map((thumbnail) => (
              <img
                alt=""
                className="video-thumbnail-frame"
                data-testid="video-thumbnail-frame"
                draggable={false}
                key={thumbnail.id}
                src={thumbnail.url}
                title={formatDuration(thumbnail.time)}
              />
            ))}
          </div>
        ) : null}
        <div className="video-trim-selection" />
        <button
          aria-label={t.trimStartHandle}
          className="video-trim-handle start"
          onPointerDown={(event) => beginDrag("start", event)}
          style={{ left: `${startPercent}%` }}
          type="button"
        />
        <button
          aria-label={t.trimEndHandle}
          className="video-trim-handle end"
          onPointerDown={(event) => beginDrag("end", event)}
          style={{ left: `${endPercent}%` }}
          type="button"
        />
      </div>
      <div className="video-timeline-actions">
        <button className="secondary-button" onClick={onGeneratePreview} type="button">
          <StudioIcon name="checkCircle" size={17} />
          <span>{t.generateVideoPreview}</span>
        </button>
        <button
          className="secondary-button"
          onClick={() => onApply({ duration: timelineDuration, type: "reset-trim" })}
          type="button"
        >
          <StudioIcon name="restartAlt" size={17} />
          <span>{t.resetTrim}</span>
        </button>
      </div>
    </div>
  );
}

function getTimelineDuration(duration: number | null, videoState: VideoEditState) {
  const fallback = videoState.trimEnd ?? Math.max(5, videoState.trimStart + 5);

  return Math.max(0.1, duration ?? fallback);
}
