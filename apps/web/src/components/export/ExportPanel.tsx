import { useEffect, useState } from "react";
import type {
  ImageEditState,
  ImageExportFormat,
  VideoEditAction,
  VideoEditState,
  VideoExportFormat,
} from "@local-media-studio/media-core";
import {
  defaultImageExportFormat,
  defaultImageQuality,
  imageExportFormats,
  videoExportFormats,
} from "../../config/media";
import type { Copy } from "../../i18n";
import { StudioIcon } from "../../icons/studio-icons";
import { useJobStore } from "../../stores/job-store";
import type { WorkspaceAsset } from "../../stores/media-store";
import {
  exportEditedImage,
  getImageExportAvailability,
  getExportErrorMessage,
  isAbortError,
  saveImageExport,
  type ImageExportAvailability,
  type ImageExportResult,
} from "../../utils/image-export";
import {
  exportEditedVideo,
  getVideoExportErrorMessage,
  saveVideoExport,
  type VideoExportResult,
} from "../../utils/video-export";

type ExportStatus = "idle" | "busy" | "ready" | "saved" | "canceled" | "failed";

export function ExportPanel({
  imageState,
  onApplyVideoAction,
  selectedAsset,
  t,
  videoState,
}: {
  imageState: ImageEditState | null;
  onApplyVideoAction: (action: VideoEditAction) => void;
  selectedAsset: WorkspaceAsset | null;
  t: Copy;
  videoState: VideoEditState | null;
}) {
  const [format, setFormat] = useState<ImageExportFormat>(defaultImageExportFormat);
  const [quality, setQuality] = useState(defaultImageQuality);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImageExportResult | VideoExportResult | null>(null);
  const [imageAvailability, setImageAvailability] = useState<
    Partial<Record<ImageExportFormat, ImageExportAvailability>>
  >({});
  const jobs = useJobStore((state) => state.jobs);
  const queueJob = useJobStore((state) => state.queueJob);
  const updateJob = useJobStore((state) => state.updateJob);
  const completeJob = useJobStore((state) => state.completeJob);
  const failJob = useJobStore((state) => state.failJob);
  const canExportImage =
    selectedAsset?.kind === "image" && selectedAsset.status === "ready" && Boolean(imageState);
  const canExportVideo =
    selectedAsset?.kind === "video" && selectedAsset.status === "ready" && Boolean(videoState);
  const canExport = canExportImage || canExportVideo;
  const videoJobId = selectedAsset?.kind === "video" ? `video-export:${selectedAsset.id}` : null;
  const videoJob = videoJobId ? (jobs[videoJobId] ?? null) : null;
  const activeFormat = selectedAsset?.kind === "video" ? videoState?.exportFormat : format;
  const exportFormats = selectedAsset?.kind === "video" ? videoExportFormats : imageExportFormats;
  const activeImageAvailability =
    selectedAsset?.kind === "image" ? imageAvailability[format] : null;

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  useEffect(() => {
    let canceled = false;

    if (selectedAsset?.kind !== "image") {
      return undefined;
    }

    void getImageExportAvailability(imageExportFormats, t).then((availability) => {
      if (canceled) {
        return;
      }

      setImageAvailability(availability);

      if (!availability[format]?.available) {
        const nextFormat = imageExportFormats.find((exportFormat) => {
          return availability[exportFormat]?.available;
        });

        if (nextFormat) {
          setFormat(nextFormat);
        }
      }
    });

    return () => {
      canceled = true;
    };
  }, [format, selectedAsset?.kind, t]);

  async function handleExport() {
    if (!selectedAsset) {
      return;
    }

    if (selectedAsset.kind === "video") {
      await handleVideoExport(selectedAsset);
      return;
    }

    if (!imageState) {
      setStatus("failed");
      setMessage(t.imageExportFailed);
      return;
    }

    if (activeImageAvailability && !activeImageAvailability.available) {
      setStatus("failed");
      setMessage(activeImageAvailability.reason ?? t.imageExportFormatUnsupported);
      return;
    }

    setStatus("busy");
    setMessage(t.preparingImageExport);

    try {
      const nextResult = await exportEditedImage({
        asset: selectedAsset,
        format,
        quality,
        state: imageState,
        t,
      });

      if (result) {
        URL.revokeObjectURL(result.url);
      }

      setResult(nextResult);
      setStatus("ready");
      setMessage(t.downloadReady);
      await saveImageExport(nextResult, format);
      setStatus("saved");
      setMessage(t.exportSaved);
    } catch (error) {
      if (isAbortError(error)) {
        setStatus("canceled");
        setMessage(t.exportCanceled);
        return;
      }

      setStatus("failed");
      setMessage(getExportErrorMessage(error, t));
    }
  }

  async function handleVideoExport(asset: WorkspaceAsset) {
    if (!videoState || !videoJobId) {
      setStatus("failed");
      setMessage(t.videoExportNext);
      return;
    }

    setStatus("busy");
    setMessage(t.videoExportNext);
    queueJob(videoJobId, "video-export", t.videoExportNext);

    try {
      const nextResult = await exportEditedVideo({
        onProgress: (update) => updateJob(videoJobId, update),
        source: asset.file,
        state: videoState,
      });

      if (result) {
        URL.revokeObjectURL(result.url);
      }

      setResult(nextResult);
      completeJob(videoJobId, t.downloadReady);
      setStatus("ready");
      setMessage(t.downloadReady);
      await saveVideoExport(nextResult);
      setStatus("saved");
      setMessage(t.exportSaved);
    } catch (error) {
      if (isAbortError(error)) {
        setStatus("canceled");
        setMessage(t.exportCanceled);
        return;
      }

      const errorMessage = getVideoExportErrorMessage(error, t.videoExportNext);
      failJob(videoJobId, {
        code: "video-export-failed",
        message: errorMessage,
        recoverable: true,
      });
      setStatus("failed");
      setMessage(errorMessage);
    }
  }

  return (
    <div className="export-panel-content">
      <div className="form-field">
        <label htmlFor="export-format">{t.format}</label>
        <select
          id="export-format"
          onChange={(event) => {
            if (selectedAsset?.kind === "video") {
              onApplyVideoAction({
                format: event.currentTarget.value as VideoExportFormat,
                type: "set-format",
              });
              return;
            }

            setFormat(event.currentTarget.value as ImageExportFormat);
          }}
          value={activeFormat}
        >
          {exportFormats.map((exportFormat) => {
            const availability =
              selectedAsset?.kind === "image"
                ? imageAvailability[exportFormat as ImageExportFormat]
                : null;
            const disabled = availability ? !availability.available : false;

            return (
              <option disabled={disabled} key={exportFormat} value={exportFormat}>
                {`${exportFormat.toUpperCase()}${disabled ? ` - ${t.unsupportedFormat}` : ""}`}
              </option>
            );
          })}
        </select>
      </div>
      {selectedAsset?.kind !== "video" ? (
        <div className="form-field">
          <label htmlFor="export-quality">{t.quality}</label>
          <input
            id="export-quality"
            max={100}
            min={1}
            onChange={(event) => setQuality(Number(event.currentTarget.value))}
            type="number"
            value={quality}
          />
        </div>
      ) : null}
      <p className="export-helper">
        {selectedAsset?.kind === "video"
          ? t.videoExportHelper
          : (activeImageAvailability?.reason ?? t.imageExportHelper)}
      </p>
      <button
        className="primary-button full-width"
        disabled={!canExport || status === "busy"}
        onClick={() => void handleExport()}
        type="button"
      >
        <StudioIcon name="download" size={20} />
        <span>{status === "busy" ? t.prepareExport : t.exportCurrentAsset}</span>
      </button>
      {message || videoJob ? (
        <div className={`job-message ${videoJob?.status ?? status}`}>
          <StudioIcon
            name={(videoJob?.status ?? status) === "failed" ? "warning" : "checkCircle"}
            size={17}
          />
          <span>
            {status === "saved" || status === "canceled" || status === "failed"
              ? message
              : (videoJob?.error?.message ?? videoJob?.message ?? message)}
          </span>
        </div>
      ) : null}
      {videoJob?.status === "loading" || videoJob?.status === "processing" ? (
        <div
          aria-label={videoJob.message ?? t.videoExportNext}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(videoJob.progress ?? 0)}
          className="job-progress"
          role="progressbar"
        >
          <span style={{ width: `${videoJob.progress ?? 0}%` }} />
        </div>
      ) : null}
      {result && status === "ready" ? (
        <a className="download-link" download={result.filename} href={result.url}>
          {`${t.download} ${result.filename}`}
        </a>
      ) : null}
    </div>
  );
}
