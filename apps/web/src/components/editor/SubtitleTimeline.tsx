import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { formatDuration, type VideoEditAction, type VideoEditState } from "@obscura/media-core";
import type { Copy } from "../../i18n";

type SubtitleCue = VideoEditState["subtitles"][number];

export function SubtitleTimeline({
  duration,
  onApply,
  t,
  videoState,
}: {
  duration: number | null;
  onApply: (action: VideoEditAction) => void;
  t: Copy;
  videoState: VideoEditState;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<SubtitleDragState | null>(null);
  const timelineDuration = Math.max(
    0.1,
    duration ?? videoState.trimEnd ?? videoState.subtitles.at(-1)?.endTime ?? 5,
  );

  function beginCueDrag(
    cue: SubtitleCue,
    mode: SubtitleDragMode,
    event: PointerEvent<HTMLElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof trackRef.current?.setPointerCapture === "function") {
      trackRef.current.setPointerCapture(event.pointerId);
    }
    setActiveDrag({
      cueId: cue.id,
      endTime: cue.endTime,
      mode,
      startClientX: event.clientX,
      startTime: cue.startTime,
    });
  }

  function updateCueDrag(event: PointerEvent<HTMLDivElement>) {
    if (!activeDrag) {
      return;
    }

    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect?.width) {
      return;
    }

    const secondsDelta =
      ((event.clientX - activeDrag.startClientX) / rect.width) * timelineDuration;
    applyCueDrag(activeDrag, secondsDelta);
  }

  function endCueDrag(event: PointerEvent<HTMLDivElement>) {
    if (
      typeof trackRef.current?.hasPointerCapture === "function" &&
      trackRef.current.hasPointerCapture(event.pointerId)
    ) {
      trackRef.current.releasePointerCapture(event.pointerId);
    }

    setActiveDrag(null);
  }

  function moveCueWithKeyboard(cue: SubtitleCue, event: KeyboardEvent<HTMLButtonElement>) {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    if (direction === 0) {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? 0.5 : 0.1;
    const cueLength = Math.max(0.1, cue.endTime - cue.startTime);
    const maxStart = Math.max(0, timelineDuration - cueLength);
    const nextStart = clamp(roundSeconds(cue.startTime + direction * step), 0, maxStart);

    onApply({
      cueId: cue.id,
      patch: {
        endTime: roundSeconds(nextStart + cueLength),
        startTime: nextStart,
      },
      type: "update-subtitle",
    });
  }

  function applyCueDrag(dragState: SubtitleDragState, secondsDelta: number) {
    const cueLength = Math.max(0.1, dragState.endTime - dragState.startTime);
    let nextStart = dragState.startTime;
    let nextEnd = dragState.endTime;

    if (dragState.mode === "move") {
      nextStart = clamp(
        roundSeconds(dragState.startTime + secondsDelta),
        0,
        Math.max(0, timelineDuration - cueLength),
      );
      nextEnd = roundSeconds(nextStart + cueLength);
    }

    if (dragState.mode === "start") {
      nextStart = clamp(
        roundSeconds(dragState.startTime + secondsDelta),
        0,
        dragState.endTime - 0.1,
      );
    }

    if (dragState.mode === "end") {
      nextEnd = clamp(
        roundSeconds(dragState.endTime + secondsDelta),
        dragState.startTime + 0.1,
        timelineDuration,
      );
    }

    onApply({
      cueId: dragState.cueId,
      patch: {
        endTime: nextEnd,
        startTime: nextStart,
      },
      type: "update-subtitle",
    });
  }

  return (
    <div className="subtitle-timeline" aria-label={t.subtitleTimeline}>
      <div className="video-timeline-label-row">
        <span>{t.subtitleTimeline}</span>
        <output>{formatDuration(timelineDuration)}</output>
      </div>
      <div
        ref={trackRef}
        className="subtitle-timeline-track"
        onPointerCancel={endCueDrag}
        onPointerMove={updateCueDrag}
        onPointerUp={endCueDrag}
      >
        {videoState.subtitles.length === 0 ? (
          <span className="subtitle-timeline-empty">{t.noSubtitles}</span>
        ) : (
          videoState.subtitles.map((cue, index) => {
            const left = Math.min(100, Math.max(0, (cue.startTime / timelineDuration) * 100));
            const width = Math.max(
              2,
              Math.min(100 - left, ((cue.endTime - cue.startTime) / timelineDuration) * 100),
            );
            const cueStyle = {
              left: `${left}%`,
              width: `${width}%`,
            } as CSSProperties;
            const isDragging = activeDrag?.cueId === cue.id;

            return (
              <button
                aria-label={`${t.subtitleTimeline} ${index + 1}`}
                className={`subtitle-timeline-cue ${isDragging ? "is-dragging" : ""}`}
                data-testid="subtitle-cue-block"
                key={cue.id}
                onKeyDown={(event) => moveCueWithKeyboard(cue, event)}
                onPointerDown={(event) => beginCueDrag(cue, "move", event)}
                style={cueStyle}
                title={cue.text}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="subtitle-cue-resize-handle start"
                  onPointerDown={(event) => beginCueDrag(cue, "start", event)}
                />
                {index + 1}
                <span
                  aria-hidden="true"
                  className="subtitle-cue-resize-handle end"
                  onPointerDown={(event) => beginCueDrag(cue, "end", event)}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

type SubtitleDragMode = "move" | "start" | "end";

type SubtitleDragState = {
  cueId: string;
  endTime: number;
  mode: SubtitleDragMode;
  startClientX: number;
  startTime: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundSeconds(value: number) {
  return Math.round(value * 100) / 100;
}
