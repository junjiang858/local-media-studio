import { proxy, wrap, type Remote } from "comlink";
import type { VideoEditState, WorkerJobProgressUpdate } from "@obscura/media-core";
import { getVideoMimeTypeFromExtension } from "./video-processing";
import type { VideoWorkerApi } from "./video-worker";

export type VideoExportResult = {
  blob: Blob;
  filename: string;
  size: number;
  url: string;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    accept: Record<string, string[]>;
    description: string;
  }>;
};

type SaveFilePickerHandle = {
  createWritable: () => Promise<{
    close: () => Promise<void> | void;
    write: (data: Blob) => Promise<void> | void;
  }>;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>;
};

let videoWorkerApi: Remote<VideoWorkerApi> | null = null;

export async function exportEditedVideo({
  onProgress,
  signal,
  source,
  state,
}: {
  onProgress?: (update: WorkerJobProgressUpdate) => void;
  signal?: AbortSignal;
  source: File;
  state: VideoEditState;
}): Promise<VideoExportResult> {
  const api = getVideoWorkerApi();
  const jobId = `video-job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const abort = () => {
    void api.cancelVideoJob(jobId);
  };

  signal?.addEventListener("abort", abort, { once: true });

  try {
    if (signal?.aborted) {
      throw new DOMException("Video export canceled", "AbortError");
    }

    const result = await api.runVideoExport(
      { jobId, source, state },
      proxy((update) => onProgress?.(update)),
    );

    if (signal?.aborted) {
      throw new DOMException("Video export canceled", "AbortError");
    }

    return {
      ...result,
      url: URL.createObjectURL(result.blob),
    };
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

export async function saveVideoExport(result: VideoExportResult) {
  const savePicker = (window as SaveFilePickerWindow).showSaveFilePicker;
  const extension = `.${result.filename.split(".").at(-1) ?? "mp4"}`;
  const mimeType = result.blob.type || getVideoMimeTypeFromExtension(extension);

  if (savePicker && window.isSecureContext) {
    try {
      const handle = await savePicker({
        suggestedName: result.filename,
        types: [
          {
            accept: {
              [mimeType]: [extension],
            },
            description: `${extension.slice(1).toUpperCase()} video`,
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(result.blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }

  const link = document.createElement("a");
  link.download = result.filename;
  link.href = result.url;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

export function getVideoExportErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getVideoWorkerApi() {
  if (!videoWorkerApi) {
    const worker = new Worker(new URL("./video-worker.ts", import.meta.url), { type: "module" });
    videoWorkerApi = wrap<VideoWorkerApi>(worker);
  }

  return videoWorkerApi;
}
