import { formatDuration, type VideoEditState } from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";

export function SubtitleTimeline({
  duration,
  t,
  videoState,
}: {
  duration: number | null;
  t: Copy;
  videoState: VideoEditState;
}) {
  const timelineDuration = Math.max(
    0.1,
    duration ?? videoState.trimEnd ?? videoState.subtitles.at(-1)?.endTime ?? 5,
  );

  return (
    <div className="subtitle-timeline" aria-label={t.subtitleTimeline}>
      <div className="video-timeline-label-row">
        <span>{t.subtitleTimeline}</span>
        <output>{formatDuration(timelineDuration)}</output>
      </div>
      <div className="subtitle-timeline-track">
        {videoState.subtitles.length === 0 ? (
          <span className="subtitle-timeline-empty">{t.noSubtitles}</span>
        ) : (
          videoState.subtitles.map((cue, index) => {
            const left = Math.min(100, Math.max(0, (cue.startTime / timelineDuration) * 100));
            const width = Math.max(
              2,
              Math.min(100 - left, ((cue.endTime - cue.startTime) / timelineDuration) * 100),
            );

            return (
              <span
                className="subtitle-timeline-cue"
                key={cue.id}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={cue.text}
              >
                {index + 1}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
