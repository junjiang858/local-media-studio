import type {
  VideoEditAction,
  VideoEditState,
  VideoExportFormat,
} from "@local-media-studio/media-core";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";

const speedOptions = [0.5, 1, 1.25, 1.5, 2] as const;
const formatOptions: VideoExportFormat[] = ["mp4", "webm"];

export function VideoEditorPanel({
  activeTab,
  duration,
  onApply,
  t,
  videoState,
}: {
  activeTab: string;
  duration: number | null;
  onApply: (action: VideoEditAction) => void;
  t: Copy;
  videoState: VideoEditState;
}) {
  return (
    <section aria-label={t.imageEditControls} className="editor-panel-content">
      {activeTab === "trim" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="contentCut" size={18} />
            <h3>{t.trimRange}</h3>
          </div>
          <p className="export-helper">{t.trimPlanned}</p>
          <div className="tool-grid two-col">
            <div className="form-field">
              <label htmlFor="video-trim-start">{t.trimStart}</label>
              <input
                id="video-trim-start"
                min={0}
                onChange={(event) =>
                  onApply({
                    endTime: videoState.trimEnd,
                    startTime: Number(event.currentTarget.value),
                    type: "set-trim",
                  })
                }
                step={0.1}
                type="number"
                value={videoState.trimStart}
              />
            </div>
            <div className="form-field">
              <label htmlFor="video-trim-end">{t.trimEnd}</label>
              <input
                id="video-trim-end"
                max={duration ?? undefined}
                min={0.1}
                onChange={(event) =>
                  onApply({
                    endTime: event.currentTarget.value ? Number(event.currentTarget.value) : null,
                    startTime: videoState.trimStart,
                    type: "set-trim",
                  })
                }
                placeholder={duration ? String(Math.round(duration * 10) / 10) : "Auto"}
                step={0.1}
                type="number"
                value={videoState.trimEnd ?? ""}
              />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "speed" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="speed" size={18} />
            <h3>{t.speed}</h3>
          </div>
          <p className="export-helper">{t.speedDetail}</p>
          <div className="form-field">
            <label htmlFor="video-speed">{t.playbackSpeed}</label>
            <select
              id="video-speed"
              onChange={(event) =>
                onApply({ speed: Number(event.currentTarget.value), type: "set-speed" })
              }
              value={videoState.speed}
            >
              {speedOptions.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {activeTab === "subtitles" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="subtitles" size={18} />
            <h3>{t.manualSubtitles}</h3>
          </div>
          <p className="export-helper">{t.subtitleDetail}</p>
          <button
            className="primary-button full-width"
            onClick={() => onApply({ cue: createSubtitleCue(videoState, t), type: "add-subtitle" })}
            type="button"
          >
            <StudioIcon name="subtitles" size={20} />
            <span>{t.addSubtitleCue}</span>
          </button>
          <div className="subtitle-cue-list">
            {videoState.subtitles.length === 0 ? (
              <p className="empty-panel-copy">{t.noSubtitles}</p>
            ) : (
              videoState.subtitles.map((cue) => (
                <div className="subtitle-cue-row" key={cue.id}>
                  <div className="tool-grid two-col">
                    <div className="form-field">
                      <label htmlFor={`${cue.id}-start`}>{t.subtitleStart}</label>
                      <input
                        id={`${cue.id}-start`}
                        min={0}
                        onChange={(event) =>
                          onApply({
                            cueId: cue.id,
                            patch: { startTime: Number(event.currentTarget.value) },
                            type: "update-subtitle",
                          })
                        }
                        step={0.1}
                        type="number"
                        value={cue.startTime}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`${cue.id}-end`}>{t.subtitleEnd}</label>
                      <input
                        id={`${cue.id}-end`}
                        min={0.1}
                        onChange={(event) =>
                          onApply({
                            cueId: cue.id,
                            patch: { endTime: Number(event.currentTarget.value) },
                            type: "update-subtitle",
                          })
                        }
                        step={0.1}
                        type="number"
                        value={cue.endTime}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor={`${cue.id}-text`}>{t.subtitleText}</label>
                    <input
                      id={`${cue.id}-text`}
                      onChange={(event) =>
                        onApply({
                          cueId: cue.id,
                          patch: { text: event.currentTarget.value },
                          type: "update-subtitle",
                        })
                      }
                      type="text"
                      value={cue.text}
                    />
                  </div>
                  <button
                    className="secondary-button full-width"
                    onClick={() => onApply({ cueId: cue.id, type: "remove-subtitle" })}
                    type="button"
                  >
                    <StudioIcon name="delete" size={18} />
                    <span>{t.removeSubtitleCue}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "format" ? (
        <div className="tool-section">
          <div className="tool-section-heading">
            <StudioIcon name="formatPaint" size={18} />
            <h3>{t.formatTab}</h3>
          </div>
          <div className="form-field">
            <label htmlFor="video-format">{t.videoFormat}</label>
            <select
              id="video-format"
              onChange={(event) =>
                onApply({
                  format: event.currentTarget.value as VideoExportFormat,
                  type: "set-format",
                })
              }
              value={videoState.exportFormat}
            >
              {formatOptions.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <p className="export-helper">{t.videoExportNext}</p>
        </div>
      ) : null}
    </section>
  );
}

function createSubtitleCue(videoState: VideoEditState, t: Copy) {
  const startTime = videoState.trimStart;
  const endTime = videoState.trimEnd ?? startTime + 3;

  return {
    endTime,
    id: `cue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    startTime,
    text: t.subtitleText,
  };
}
