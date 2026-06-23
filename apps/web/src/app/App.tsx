import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  getCurrentImageEditState,
  initialImageEditHistory,
  initialVideoEditState,
  type ImageEditAction,
  type VideoEditAction,
} from "@obscura/media-core";
import { EditorRail } from "../components/editor/EditorRail";
import { MediaLibraryPanel } from "../components/media-library/MediaLibraryPanel";
import { PreviewStage } from "../components/preview/PreviewStage";
import type { PreviewBackground } from "../components/preview/types";
import { MobileTabs } from "../components/studio/MobileTabs";
import { TopToolbar } from "../components/studio/TopToolbar";
import { emptyWorkspaceTabs, populatedWorkspaceTabs } from "../config/workspace";
import { getDefaultImageExportSettings } from "../config/media";
import { detectInitialLanguage, messages, type Language } from "../i18n";
import { useJobStore } from "../stores/job-store";
import { getVisibleAssets, useMediaStore, type WorkspaceAsset } from "../stores/media-store";
import {
  getBackgroundRemovalErrorMessage,
  runImageBackgroundRemoval,
} from "../utils/background-removal";
import { readAssetMetadata } from "../utils/media-metadata";
import { generateVideoThumbnails, type VideoThumbnail } from "../utils/video-thumbnails";
import type { MobileTab } from "./types";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("preview");
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [imagePreviewRequestKey, setImagePreviewRequestKey] = useState(0);
  const [previewBackground, setPreviewBackground] = useState<PreviewBackground>("transparent");
  const [videoPreviewRequestKey, setVideoPreviewRequestKey] = useState(0);
  const [videoThumbnailsByAsset, setVideoThumbnailsByAsset] = useState<
    Record<string, VideoThumbnail[]>
  >({});
  const [zoom, setZoom] = useState(100);
  const videoThumbnailsRef = useRef(videoThumbnailsByAsset);
  const t = messages[language];

  const assets = useMediaStore((state) => state.assets);
  const selectedAssetId = useMediaStore((state) => state.selectedAssetId);
  const filter = useMediaStore((state) => state.filter);
  const imageExportSettings = useMediaStore((state) => state.imageExportSettings);
  const imageHistories = useMediaStore((state) => state.imageHistories);
  const videoEdits = useMediaStore((state) => state.videoEdits);
  const addFiles = useMediaStore((state) => state.addFiles);
  const selectAsset = useMediaStore((state) => state.selectAsset);
  const selectAdjacent = useMediaStore((state) => state.selectAdjacent);
  const setFilter = useMediaStore((state) => state.setFilter);
  const updateImageExportSettings = useMediaStore((state) => state.updateImageExportSettings);
  const applyImageAction = useMediaStore((state) => state.applyImageAction);
  const applyVideoAction = useMediaStore((state) => state.applyVideoAction);
  const updateAssetMetadata = useMediaStore((state) => state.updateAssetMetadata);
  const removeSelected = useMediaStore((state) => state.removeSelected);
  const jobs = useJobStore((state) => state.jobs);
  const queueJob = useJobStore((state) => state.queueJob);
  const updateJob = useJobStore((state) => state.updateJob);
  const completeJob = useJobStore((state) => state.completeJob);
  const failJob = useJobStore((state) => state.failJob);

  const visibleAssets = useMemo(() => getVisibleAssets(assets, filter), [assets, filter]);
  const selectedAsset = useMemo<WorkspaceAsset | null>(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );
  const selectedImageState =
    selectedAsset?.kind === "image"
      ? getCurrentImageEditState(imageHistories[selectedAsset.id] ?? initialImageEditHistory())
      : null;
  const selectedImageExportSettings =
    selectedAsset?.kind === "image"
      ? (imageExportSettings[selectedAsset.id] ??
        getDefaultImageExportSettings(selectedAsset.mimeType))
      : null;
  const selectedVideoState =
    selectedAsset?.kind === "video"
      ? (videoEdits[selectedAsset.id] ?? initialVideoEditState(selectedAsset.duration))
      : null;
  const selectedVideoThumbnails =
    selectedAsset?.kind === "video" ? (videoThumbnailsByAsset[selectedAsset.id] ?? []) : [];
  const backgroundRemovalJob =
    selectedAsset?.kind === "image"
      ? (jobs[getBackgroundRemovalJobId(selectedAsset.id)] ?? null)
      : null;
  const canEditSelectedImage = selectedAsset?.kind === "image" && Boolean(selectedImageState);
  const workspaceTabs = assets.length ? populatedWorkspaceTabs : emptyWorkspaceTabs;
  const currentMobileTab = workspaceTabs.includes(activeMobileTab) ? activeMobileTab : "preview";
  const showCompareOriginal = compareOriginal && selectedAsset?.kind === "image";

  useEffect(() => {
    const assetsNeedingMetadata = assets.filter(
      (asset) => asset.status === "ready" && (!asset.width || !asset.height),
    );

    for (const asset of assetsNeedingMetadata) {
      void readAssetMetadata(asset)
        .then((metadata) => updateAssetMetadata(asset.id, metadata))
        .catch(() => {
          // Metadata is helpful for the info popover, but edit/export can continue without it.
        });
    }
  }, [assets, updateAssetMetadata]);

  useEffect(() => {
    function handleWorkspaceKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && assets.length > 1) {
        event.preventDefault();
        selectAdjacent(event.key === "ArrowRight" ? 1 : -1);
        return;
      }

      if (selectedAsset?.kind !== "image") {
        return;
      }

      const modifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifierPressed && key === "z") {
        event.preventDefault();
        applyImageAction(selectedAsset.id, { type: event.shiftKey ? "redo" : "undo" });
      }

      if (modifierPressed && key === "y") {
        event.preventDefault();
        applyImageAction(selectedAsset.id, { type: "redo" });
      }
    }

    window.addEventListener("keydown", handleWorkspaceKeyDown);
    return () => window.removeEventListener("keydown", handleWorkspaceKeyDown);
  }, [applyImageAction, assets.length, selectAdjacent, selectedAsset]);

  useEffect(() => {
    videoThumbnailsRef.current = videoThumbnailsByAsset;
  }, [videoThumbnailsByAsset]);

  useEffect(() => {
    return () => {
      for (const thumbnails of Object.values(videoThumbnailsRef.current)) {
        revokeVideoThumbnails(thumbnails);
      }
    };
  }, []);

  useEffect(() => {
    if (
      selectedAsset?.kind !== "video" ||
      selectedAsset.status !== "ready" ||
      videoThumbnailsByAsset[selectedAsset.id]
    ) {
      return undefined;
    }

    const duration = selectedAsset.duration ?? selectedVideoState?.trimEnd;

    if (!duration) {
      return undefined;
    }

    let canceled = false;

    void generateVideoThumbnails({
      duration,
      sourceUrl: selectedAsset.objectUrl,
    })
      .then((thumbnails) => {
        if (canceled) {
          revokeVideoThumbnails(thumbnails);
          return;
        }

        setVideoThumbnailsByAsset((currentThumbnails) => {
          if (currentThumbnails[selectedAsset.id]) {
            revokeVideoThumbnails(thumbnails);
            return currentThumbnails;
          }

          return {
            ...currentThumbnails,
            [selectedAsset.id]: thumbnails,
          };
        });
      })
      .catch(() => {
        // The trim controls remain usable if the browser cannot decode thumbnail frames.
      });

    return () => {
      canceled = true;
    };
  }, [selectedAsset, selectedVideoState?.trimEnd, videoThumbnailsByAsset]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    addFiles(Array.from(fileList));
    setActiveMobileTab("preview");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleApplyImageAction(action: ImageEditAction) {
    if (selectedAsset?.kind !== "image") {
      return;
    }

    applyImageAction(selectedAsset.id, action);
  }

  function handleApplyVideoAction(action: VideoEditAction) {
    if (selectedAsset?.kind !== "video") {
      return;
    }

    applyVideoAction(selectedAsset.id, action);
  }

  async function handleRemoveBackground() {
    if (selectedAsset?.kind !== "image") {
      return;
    }

    const asset = selectedAsset;
    const jobId = getBackgroundRemovalJobId(asset.id);

    if (isActiveJob(jobs[jobId])) {
      return;
    }

    queueJob(jobId, "background-removal", t.backgroundRemovalRunning);

    try {
      const result = await runImageBackgroundRemoval({
        onProgress: (update) => updateJob(jobId, update),
        source: asset.file,
      });

      completeJob(jobId, t.backgroundRemovalComplete);
      addFiles([result.file]);
    } catch (error) {
      failJob(jobId, {
        code: "background-removal-failed",
        message: getBackgroundRemovalErrorMessage(error, t.backgroundRemovalFailed),
        recoverable: true,
      });
    }
  }

  function handleRemoveSelectedAsset() {
    if (selectedAssetId) {
      setVideoThumbnailsByAsset((currentThumbnails) => {
        const thumbnails = currentThumbnails[selectedAssetId];

        if (!thumbnails) {
          return currentThumbnails;
        }

        const remainingThumbnails = { ...currentThumbnails };

        delete remainingThumbnails[selectedAssetId];
        revokeVideoThumbnails(thumbnails);
        return remainingThumbnails;
      });
    }

    removeSelected();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="workspace" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <input
        ref={fileInputRef}
        aria-label={t.chooseMedia}
        className="sr-only"
        multiple
        onChange={(event) => handleFiles(event.currentTarget.files)}
        type="file"
        accept="image/*,video/*"
      />

      <TopToolbar
        canEditSelectedImage={canEditSelectedImage}
        language={language}
        onApplyImageAction={handleApplyImageAction}
        onLanguageChange={setLanguage}
        onSelectAdjacent={selectAdjacent}
        selectedAsset={selectedAsset}
        t={t}
        totalAssets={assets.length}
      />

      <MobileTabs
        activeTab={currentMobileTab}
        onChange={setActiveMobileTab}
        tabs={workspaceTabs}
        t={t}
      />

      <div
        className={`workspace-grid mobile-tab-${currentMobileTab} ${
          assets.length ? "" : "is-empty"
        }`}
      >
        <MediaLibraryPanel
          activeFilter={filter}
          assets={visibleAssets}
          isVisible={currentMobileTab === "library"}
          onAddMedia={openFilePicker}
          onFilterChange={setFilter}
          onRemoveSelected={handleRemoveSelectedAsset}
          onSelectAsset={(assetId) => {
            selectAsset(assetId);
            setActiveMobileTab("preview");
          }}
          selectedAssetId={selectedAssetId}
          t={t}
          totalAssets={assets.length}
        />

        <PreviewStage
          compareOriginal={showCompareOriginal}
          imageExportSettings={selectedImageExportSettings}
          imagePreviewRequestKey={imagePreviewRequestKey}
          imageState={selectedImageState}
          isFullscreen={isPreviewFullscreen}
          isVisible={currentMobileTab === "preview"}
          onAddMedia={openFilePicker}
          onApplyImageAction={handleApplyImageAction}
          onCompareToggle={() => setCompareOriginal((value) => !value)}
          onFullscreenToggle={() => setIsPreviewFullscreen((value) => !value)}
          onPreviewBackgroundChange={setPreviewBackground}
          onZoomChange={setZoom}
          previewBackground={previewBackground}
          selectedAsset={selectedAsset}
          t={t}
          videoState={selectedVideoState}
          videoPreviewRequestKey={videoPreviewRequestKey}
          zoom={zoom}
        />

        {assets.length ? (
          <EditorRail
            backgroundRemovalJob={backgroundRemovalJob}
            imageExportSettings={selectedImageExportSettings}
            imageState={selectedImageState}
            isVisible={currentMobileTab === "edit" || currentMobileTab === "export"}
            onApplyImageAction={handleApplyImageAction}
            onApplyVideoAction={handleApplyVideoAction}
            onImageExportSettingsChange={(patch) => {
              if (selectedAsset?.kind === "image") {
                updateImageExportSettings(selectedAsset.id, patch);
              }
            }}
            onGenerateImagePreview={() => setImagePreviewRequestKey((key) => key + 1)}
            onGenerateVideoPreview={() => setVideoPreviewRequestKey((key) => key + 1)}
            onRemoveBackground={() => void handleRemoveBackground()}
            selectedAsset={selectedAsset}
            t={t}
            videoState={selectedVideoState}
            videoThumbnails={selectedVideoThumbnails}
          />
        ) : null}
      </div>
    </div>
  );
}

function getBackgroundRemovalJobId(assetId: string) {
  return `background-removal:${assetId}`;
}

function isActiveJob(job: ReturnType<typeof useJobStore.getState>["jobs"][string] | undefined) {
  return job?.status === "queued" || job?.status === "loading" || job?.status === "processing";
}

function revokeVideoThumbnails(thumbnails: readonly VideoThumbnail[]) {
  for (const thumbnail of thumbnails) {
    URL.revokeObjectURL(thumbnail.url);
  }
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
