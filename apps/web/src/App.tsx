import {
  ChevronLeft,
  ChevronRight,
  Download,
  FlipHorizontal,
  FlipVertical,
  FileImage,
  FileVideo,
  Filter,
  ImagePlus,
  Redo2,
  RotateCcw,
  RotateCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Subtitles,
  Undo2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import {
  applyImageEditAction,
  buildImageExportPlan,
  classifyMediaKind,
  formatDuration,
  formatFileSize,
  getCurrentImageEditState,
  getNextAssetId,
  initialImageEditHistory,
} from "@local-media-studio/media-core";
import type {
  ImageCropAspect,
  ImageEditAction,
  ImageEditHistory,
  ImageEditState,
  ImageExportFormat,
} from "@local-media-studio/media-core";
import type { MediaAsset, MediaKind } from "@local-media-studio/shared";

type MediaFilter = "all" | MediaKind;
type MobileTab = "library" | "preview" | "edit" | "export";
type Language = "en" | "zh";
type WorkspaceAsset = MediaAsset & { file: File };
type ImageExportResult = {
  url: string;
  filename: string;
  size: number;
};

const copy = {
  en: {
    brand: "Local Media Studio",
    brandTitle: "Private media studio",
    heroTitle: "Create privately. Export in seconds.",
    heroSubtitle:
      "Import local images or short clips, make focused edits, and download clean results without sending media away.",
    addMedia: "Add media",
    chooseMedia: "Choose media files",
    previousAsset: "Previous asset",
    nextAsset: "Next asset",
    language: "Language",
    english: "English",
    chinese: "中文",
    privacy: "No media leaves this browser.",
    privacyStatus: "Privacy status",
    localOnly: "local only",
    flowLabel: "Creation flow",
    stepImport: "Import",
    stepImportDetail: "Choose local media",
    stepEdit: "Edit",
    stepEditDetail: "Tune the selected asset",
    stepExport: "Export",
    stepExportDetail: "Download the result",
    workspaceSections: "Workspace sections",
    library: "Media",
    noAsset: "No asset",
    preview: "Preview",
    edit: "Edit",
    output: "Output",
    export: "Export",
    assets: "assets",
    filterMediaType: "Filter media type",
    all: "All",
    image: "Image",
    video: "Video",
    emptyLibrary: "Your imported media will appear here.",
    remove: "Remove",
    privateDefault: "Private by default",
    emptyPreviewTitle: "Start with local media",
    emptyPreviewBody:
      "Drop files here or choose media. The preview stays centered while the next best action stays close.",
    compareOriginal: "Compare original",
    showEdited: "Show edited",
    selectAssetToEdit: "Select a media asset to reveal image or video tools.",
    cropPreset: "Crop preset",
    original: "Original",
    square: "1:1 Square",
    portrait: "4:5 Portrait",
    story: "9:16 Story",
    wide: "16:9 Wide",
    undoImageEdit: "Undo image edit",
    redoImageEdit: "Redo image edit",
    reset: "Reset",
    rotateMinus: "Rotate -90",
    rotatePlus: "Rotate 90",
    flipHorizontal: "Flip horizontal",
    flipVertical: "Flip vertical",
    outputWidth: "Output width",
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    watermarkText: "Watermark text",
    optional: "Optional",
    imageEditHelper:
      "Image edits are previewed locally and applied to a temporary export blob only when you prepare a download.",
    imageEditControls: "Image edit controls",
    trimRange: "Trim range",
    trimPlanned: "Start/end inputs planned",
    speed: "Speed",
    speedDetail: "Preset and custom controls",
    manualSubtitles: "Manual subtitles",
    subtitleDetail: "Cue editor and WebVTT export",
    format: "Format",
    quality: "Quality",
    prepareExport: "Prepare export",
    preparingImageExport: "Preparing local image export...",
    downloadReady: "Download ready.",
    videoExportNext: "Video export is the next local worker slice.",
    imageExportFailed: "Image export failed.",
    canvasUnavailable: "Canvas export is not available in this browser.",
    imageLoadFailed: "Image preview could not be loaded for export.",
    canvasExportFailed: "Canvas export failed.",
    imageExportHelper: "Image export runs in this browser and does not upload media.",
    download: "Download",
    previewOf: "Preview of",
  },
  zh: {
    brand: "Local Media Studio",
    brandTitle: "本地媒体创作",
    heroTitle: "私密创作，快速导出。",
    heroSubtitle: "导入本地图片或短视频，完成聚焦编辑，再下载干净成品；素材不会离开你的浏览器。",
    addMedia: "添加媒体",
    chooseMedia: "选择媒体文件",
    previousAsset: "上一个素材",
    nextAsset: "下一个素材",
    language: "语言",
    english: "English",
    chinese: "中文",
    privacy: "媒体不会离开这个浏览器。",
    privacyStatus: "隐私状态",
    localOnly: "仅本地",
    flowLabel: "创作流程",
    stepImport: "导入",
    stepImportDetail: "选择本地素材",
    stepEdit: "编辑",
    stepEditDetail: "调整当前素材",
    stepExport: "导出",
    stepExportDetail: "下载处理结果",
    workspaceSections: "工作区分区",
    library: "媒体",
    noAsset: "未选择素材",
    preview: "预览",
    edit: "编辑",
    output: "输出",
    export: "导出",
    assets: "个素材",
    filterMediaType: "筛选媒体类型",
    all: "全部",
    image: "图片",
    video: "视频",
    emptyLibrary: "导入的素材会出现在这里。",
    remove: "移除",
    privateDefault: "默认私密",
    emptyPreviewTitle: "从本地素材开始",
    emptyPreviewBody: "拖入文件或选择媒体。预览保持居中，下一步操作保持在手边。",
    compareOriginal: "对比原图",
    showEdited: "显示编辑后",
    selectAssetToEdit: "选择一个素材后即可显示图片或视频工具。",
    cropPreset: "裁剪比例",
    original: "原始",
    square: "1:1 方图",
    portrait: "4:5 竖图",
    story: "9:16 故事",
    wide: "16:9 宽屏",
    undoImageEdit: "撤销图片编辑",
    redoImageEdit: "重做图片编辑",
    reset: "重置",
    rotateMinus: "左转 90",
    rotatePlus: "右转 90",
    flipHorizontal: "水平翻转",
    flipVertical: "垂直翻转",
    outputWidth: "导出宽度",
    brightness: "亮度",
    contrast: "对比度",
    saturation: "饱和度",
    watermarkText: "水印文字",
    optional: "可选",
    imageEditHelper: "图片编辑只在本地预览，准备下载时才生成临时导出文件。",
    imageEditControls: "图片编辑控制",
    trimRange: "裁剪区间",
    trimPlanned: "开始/结束输入待实现",
    speed: "速度",
    speedDetail: "预设和自定义控制",
    manualSubtitles: "手动字幕",
    subtitleDetail: "字幕段编辑与 WebVTT 导出",
    format: "格式",
    quality: "质量",
    prepareExport: "准备导出",
    preparingImageExport: "正在准备本地图片导出...",
    downloadReady: "下载已准备好。",
    videoExportNext: "视频导出会在下一个本地 Worker 切片实现。",
    imageExportFailed: "图片导出失败。",
    canvasUnavailable: "当前浏览器不支持 Canvas 导出。",
    imageLoadFailed: "无法加载图片预览用于导出。",
    canvasExportFailed: "Canvas 导出失败。",
    imageExportHelper: "图片导出在浏览器本地完成，不会上传媒体。",
    download: "下载",
    previewOf: "预览",
  },
} as const;

type Copy = (typeof copy)[Language];

type MediaStore = {
  assets: WorkspaceAsset[];
  selectedAssetId: string | null;
  filter: MediaFilter;
  imageHistories: Record<string, ImageEditHistory>;
  addFiles: (files: File[]) => void;
  selectAsset: (assetId: string) => void;
  selectAdjacent: (direction: 1 | -1) => void;
  setFilter: (filter: MediaFilter) => void;
  applyImageAction: (assetId: string, action: ImageEditAction) => void;
  removeSelected: () => void;
};

const useMediaStore = create<MediaStore>((set, get) => ({
  assets: [],
  selectedAssetId: null,
  filter: "all",
  imageHistories: {},
  addFiles: (files) => {
    const acceptedAssets = files.map(createMediaAsset);
    const newImageHistories = Object.fromEntries(
      acceptedAssets
        .filter((asset) => asset.kind === "image")
        .map((asset) => [asset.id, initialImageEditHistory()]),
    );

    set((state) => ({
      assets: [...state.assets, ...acceptedAssets],
      imageHistories: { ...state.imageHistories, ...newImageHistories },
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
  removeSelected: () => {
    const state = get();
    const selectedAsset = state.assets.find((asset) => asset.id === state.selectedAssetId);

    if (selectedAsset) {
      URL.revokeObjectURL(selectedAsset.objectUrl);
    }

    const remainingAssets = state.assets.filter((asset) => asset.id !== state.selectedAssetId);
    const visibleAssets = getVisibleAssets(remainingAssets, state.filter);
    const remainingHistories = { ...state.imageHistories };
    if (state.selectedAssetId) {
      delete remainingHistories[state.selectedAssetId];
    }

    set({
      assets: remainingAssets,
      imageHistories: remainingHistories,
      selectedAssetId: visibleAssets[0]?.id ?? null,
    });
  },
}));

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());
  const [activeTab, setActiveTab] = useState<MobileTab>("preview");
  const [isDragActive, setIsDragActive] = useState(false);
  const t = copy[language];
  const assets = useMediaStore((state) => state.assets);
  const selectedAssetId = useMediaStore((state) => state.selectedAssetId);
  const filter = useMediaStore((state) => state.filter);
  const imageHistories = useMediaStore((state) => state.imageHistories);
  const addFiles = useMediaStore((state) => state.addFiles);
  const selectAdjacent = useMediaStore((state) => state.selectAdjacent);
  const setFilter = useMediaStore((state) => state.setFilter);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const visibleAssets = useMemo(() => getVisibleAssets(assets, filter), [assets, filter]);
  const selectedImageState =
    selectedAsset?.kind === "image"
      ? getCurrentImageEditState(imageHistories[selectedAsset.id] ?? initialImageEditHistory())
      : null;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    addFiles(Array.from(files));
  }

  return (
    <main
      className="workspace"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <header className="top-toolbar">
        <div className="brand-lockup" aria-label="Local Media Studio">
          <span className="brand-mark">LM</span>
          <div>
            <p className="eyebrow">{t.brand}</p>
            <p className="brand-title">{t.brandTitle}</p>
          </div>
        </div>

        <div className="toolbar-actions">
          <label className="language-select">
            {t.language}
            <select
              aria-label={t.language}
              value={language}
              onChange={(event) => setLanguage(event.currentTarget.value as Language)}
            >
              <option value="en">{t.english}</option>
              <option value="zh">{t.chinese}</option>
            </select>
          </label>
          <input
            ref={fileInputRef}
            className="sr-only"
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            multiple
            aria-label={t.chooseMedia}
            onChange={(event) => handleFiles(event.currentTarget.files)}
          />
          <button className="primary-button" type="button" onClick={openFilePicker}>
            <Upload size={18} aria-hidden="true" />
            {t.addMedia}
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={t.previousAsset}
            onClick={() => selectAdjacent(-1)}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={t.nextAsset}
            onClick={() => selectAdjacent(1)}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="privacy-strip" aria-label={t.privacyStatus}>
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{t.privacy}</span>
        <strong>{t.localOnly}</strong>
      </section>

      <section className="studio-intro">
        <div className="studio-copy">
          <p className="eyebrow">{t.privateDefault}</p>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
        <ol className="flow-steps" aria-label={t.flowLabel}>
          {[
            { label: t.stepImport, detail: t.stepImportDetail },
            { label: t.stepEdit, detail: t.stepEditDetail },
            { label: t.stepExport, detail: t.stepExportDetail },
          ].map((step, index) => (
            <li key={step.label}>
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <nav className="mobile-tabs" aria-label={t.workspaceSections}>
        {(["library", "preview", "edit", "export"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {getTabLabel(tab, t)}
          </button>
        ))}
      </nav>

      <div className={`workspace-grid ${isDragActive ? "drag-active" : ""}`}>
        <aside className={`panel media-library ${activeTab === "library" ? "mobile-active" : ""}`}>
          <PanelHeader
            eyebrow={`${assets.length} ${t.assets}`}
            title={t.library}
            icon={<Filter size={16} aria-hidden="true" />}
          />
          <div className="segmented-control" aria-label={t.filterMediaType}>
            {(["all", "image", "video"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {getFilterLabel(option, t)}
              </button>
            ))}
          </div>

          {visibleAssets.length === 0 ? (
            <div className="empty-library">
              <ImagePlus size={30} aria-hidden="true" />
              <p>{t.emptyLibrary}</p>
            </div>
          ) : (
            <ul className="asset-list" aria-label={t.library}>
              {visibleAssets.map((asset) => (
                <MediaAssetRow
                  key={asset.id}
                  asset={asset}
                  selected={asset.id === selectedAssetId}
                  t={t}
                />
              ))}
            </ul>
          )}
        </aside>

        <section className={`preview-stage ${activeTab === "preview" ? "mobile-active" : ""}`}>
          {selectedAsset ? (
            <SelectedPreview asset={selectedAsset} imageState={selectedImageState} t={t} />
          ) : (
            <EmptyPreview onAddMedia={openFilePicker} t={t} />
          )}
        </section>

        <aside className={`panel inspector ${activeTab === "edit" ? "mobile-active" : ""}`}>
          <PanelHeader
            eyebrow={selectedAsset ? getKindLabel(selectedAsset.kind, t) : t.noAsset}
            title={t.edit}
            icon={<Scissors size={16} aria-hidden="true" />}
          />
          <EditorPanel asset={selectedAsset} imageState={selectedImageState} t={t} />
        </aside>

        <aside className={`panel export-panel ${activeTab === "export" ? "mobile-active" : ""}`}>
          <PanelHeader
            eyebrow={t.output}
            title={t.export}
            icon={<Download size={16} aria-hidden="true" />}
          />
          <ExportPanel
            key={selectedAsset?.id ?? "empty-export-panel"}
            asset={selectedAsset}
            imageState={selectedImageState}
            t={t}
          />
        </aside>
      </div>
    </main>
  );
}

function PanelHeader({
  eyebrow,
  title,
  icon,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <span className="panel-icon">{icon}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function MediaAssetRow({
  asset,
  selected,
  t,
}: {
  asset: WorkspaceAsset;
  selected: boolean;
  t: Copy;
}) {
  const selectAsset = useMediaStore((state) => state.selectAsset);
  const removeSelected = useMediaStore((state) => state.removeSelected);
  const Icon = asset.kind === "image" ? FileImage : FileVideo;

  return (
    <li>
      <button
        className={`asset-row ${selected ? "selected" : ""}`}
        type="button"
        onClick={() => selectAsset(asset.id)}
      >
        <span className="asset-thumb">
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className="asset-copy">
          <strong>{asset.name}</strong>
          <small>
            {getKindLabel(asset.kind, t)} · {formatFileSize(asset.size)}
            {asset.duration ? ` · ${formatDuration(asset.duration)}` : ""}
          </small>
        </span>
      </button>
      {selected ? (
        <button className="text-button danger" type="button" onClick={removeSelected}>
          {t.remove}
        </button>
      ) : null}
    </li>
  );
}

function EmptyPreview({ onAddMedia, t }: { onAddMedia: () => void; t: Copy }) {
  return (
    <div className="empty-preview">
      <div className="empty-orbit" aria-hidden="true">
        <Upload size={42} />
      </div>
      <p className="eyebrow">{t.privateDefault}</p>
      <h2>{t.emptyPreviewTitle}</h2>
      <p>{t.emptyPreviewBody}</p>
      <button className="primary-button" type="button" onClick={onAddMedia}>
        <Upload size={18} aria-hidden="true" />
        {t.addMedia}
      </button>
    </div>
  );
}

function SelectedPreview({
  asset,
  imageState,
  t,
}: {
  asset: WorkspaceAsset;
  imageState: ImageEditState | null;
  t: Copy;
}) {
  const [compareOriginal, setCompareOriginal] = useState(false);
  const previewState = compareOriginal ? null : imageState;

  return (
    <div className="selected-preview">
      <div className="preview-meta">
        <span>{asset.kind}</span>
        <strong>{asset.name}</strong>
        <span>{formatFileSize(asset.size)}</span>
      </div>
      <div className="preview-frame">
        {asset.kind === "image" ? (
          <figure className="image-preview-stack">
            <div
              className={`image-preview-crop crop-${previewState?.cropAspect.replace(":", "-") ?? "free"}`}
            >
              <img
                src={asset.objectUrl}
                alt={`${t.previewOf} ${asset.name}`}
                style={getImagePreviewStyle(previewState)}
              />
              {previewState?.watermarkText ? (
                <span className="watermark-preview">{previewState.watermarkText}</span>
              ) : null}
            </div>
            <figcaption>
              <button
                className="text-button"
                type="button"
                aria-pressed={compareOriginal}
                onClick={() => setCompareOriginal((current) => !current)}
              >
                {compareOriginal ? t.showEdited : t.compareOriginal}
              </button>
            </figcaption>
          </figure>
        ) : (
          <video src={asset.objectUrl} controls aria-label={`Preview of ${asset.name}`} />
        )}
      </div>
    </div>
  );
}

function EditorPanel({
  asset,
  imageState,
  t,
}: {
  asset: WorkspaceAsset | null;
  imageState: ImageEditState | null;
  t: Copy;
}) {
  if (!asset) {
    return <p className="muted-copy">{t.selectAssetToEdit}</p>;
  }

  if (asset.kind === "image") {
    return <ImageEditorPanel assetId={asset.id} imageState={imageState} t={t} />;
  }

  return (
    <div className="tool-stack">
      <ToolButton
        icon={<Scissors size={16} aria-hidden="true" />}
        label={t.trimRange}
        detail={t.trimPlanned}
      />
      <ToolButton
        icon={<Sparkles size={16} aria-hidden="true" />}
        label={t.speed}
        detail={t.speedDetail}
      />
      <ToolButton
        icon={<Subtitles size={16} aria-hidden="true" />}
        label={t.manualSubtitles}
        detail={t.subtitleDetail}
      />
    </div>
  );
}

function ImageEditorPanel({
  assetId,
  imageState,
  t,
}: {
  assetId: string;
  imageState: ImageEditState | null;
  t: Copy;
}) {
  const applyImageAction = useMediaStore((state) => state.applyImageAction);
  const state = imageState ?? getCurrentImageEditState(initialImageEditHistory());

  function apply(action: ImageEditAction) {
    applyImageAction(assetId, action);
  }

  return (
    <div className="tool-form" aria-label={t.imageEditControls}>
      <div className="tool-row">
        <button
          className="icon-button"
          type="button"
          aria-label={t.undoImageEdit}
          onClick={() => apply({ type: "undo" })}
        >
          <Undo2 size={16} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={t.redoImageEdit}
          onClick={() => apply({ type: "redo" })}
        >
          <Redo2 size={16} aria-hidden="true" />
        </button>
        <button className="text-button" type="button" onClick={() => apply({ type: "reset" })}>
          {t.reset}
        </button>
      </div>

      <label>
        {t.cropPreset}
        <select
          value={state.cropAspect}
          onChange={(event) =>
            apply({ type: "set-crop-aspect", aspect: event.currentTarget.value as ImageCropAspect })
          }
        >
          <option value="free">{t.original}</option>
          <option value="1:1">{t.square}</option>
          <option value="4:5">{t.portrait}</option>
          <option value="9:16">{t.story}</option>
          <option value="16:9">{t.wide}</option>
        </select>
      </label>

      <div className="tool-row">
        <button
          className="tool-button compact"
          type="button"
          onClick={() => apply({ type: "rotate-counterclockwise" })}
        >
          <RotateCcw size={16} aria-hidden="true" />
          <strong>{t.rotateMinus}</strong>
        </button>
        <button
          className="tool-button compact"
          type="button"
          onClick={() => apply({ type: "rotate-clockwise" })}
        >
          <RotateCw size={16} aria-hidden="true" />
          <strong>{t.rotatePlus}</strong>
        </button>
      </div>

      <div className="tool-row">
        <button
          className="tool-button compact"
          type="button"
          onClick={() => apply({ type: "toggle-flip-horizontal" })}
        >
          <FlipHorizontal size={16} aria-hidden="true" />
          <strong>{t.flipHorizontal}</strong>
        </button>
        <button
          className="tool-button compact"
          type="button"
          onClick={() => apply({ type: "toggle-flip-vertical" })}
        >
          <FlipVertical size={16} aria-hidden="true" />
          <strong>{t.flipVertical}</strong>
        </button>
      </div>

      <label>
        {t.outputWidth}
        <input
          inputMode="numeric"
          min="16"
          max="12000"
          type="number"
          value={state.resizeWidth ?? ""}
          placeholder={t.original}
          onChange={(event) =>
            apply({
              type: "set-resize-width",
              width: event.currentTarget.value ? Number(event.currentTarget.value) : null,
            })
          }
        />
      </label>

      <div className="adjustment-grid">
        {(["brightness", "contrast", "saturation"] as const).map((adjustment) => (
          <label key={adjustment}>
            {getAdjustmentLabel(adjustment, t)}
            <input
              min="-100"
              max="100"
              type="number"
              value={state.adjustments[adjustment]}
              onChange={(event) =>
                apply({
                  type: "set-adjustment",
                  adjustment,
                  value: Number(event.currentTarget.value),
                })
              }
            />
          </label>
        ))}
      </div>

      <label>
        {t.watermarkText}
        <input
          type="text"
          value={state.watermarkText}
          placeholder={t.optional}
          onChange={(event) => apply({ type: "set-watermark", text: event.currentTarget.value })}
        />
      </label>

      <p className="muted-copy">{t.imageEditHelper}</p>
    </div>
  );
}

function ExportPanel({
  asset,
  imageState,
  t,
}: {
  asset: WorkspaceAsset | null;
  imageState: ImageEditState | null;
  t: Copy;
}) {
  const [format, setFormat] = useState<ImageExportFormat>("png");
  const [quality, setQuality] = useState(86);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ImageExportResult | null>(null);

  useEffect(() => {
    if (!exportResult) {
      return;
    }

    return () => URL.revokeObjectURL(exportResult.url);
  }, [exportResult]);

  async function handlePrepareExport() {
    if (!asset) {
      return;
    }

    if (asset.kind !== "image" || !imageState) {
      setJobMessage(t.videoExportNext);
      return;
    }

    setJobMessage(t.preparingImageExport);

    try {
      const result = await exportEditedImage({
        asset,
        state: imageState,
        format,
        quality,
        t,
      });

      setExportResult(result);
      setJobMessage(t.downloadReady);
    } catch (error) {
      setJobMessage(error instanceof Error ? error.message : t.imageExportFailed);
    }
  }

  return (
    <div className="export-box">
      <label>
        {t.format}
        <select
          disabled={!asset || asset.kind !== "image"}
          value={asset?.kind === "video" ? "webm" : format}
          onChange={(event) => setFormat(event.currentTarget.value as ImageExportFormat)}
        >
          {asset?.kind === "video" ? (
            <option value="webm">WebM</option>
          ) : (
            <>
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
            </>
          )}
        </select>
      </label>
      <label>
        {t.quality}
        <input
          disabled={!asset || asset.kind !== "image"}
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={(event) => setQuality(Number(event.currentTarget.value))}
        />
      </label>
      <button
        className="primary-button full-width"
        disabled={!asset}
        type="button"
        onClick={() => void handlePrepareExport()}
      >
        <Download size={18} aria-hidden="true" />
        {t.prepareExport}
      </button>
      {jobMessage ? <p className="job-message">{jobMessage}</p> : null}
      {exportResult ? (
        <a className="download-link" href={exportResult.url} download={exportResult.filename}>
          {t.download} {exportResult.filename}
        </a>
      ) : null}
      <p className="muted-copy">{t.imageExportHelper}</p>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <button className="tool-button" type="button">
      <span>{icon}</span>
      <strong>{label}</strong>
      <small>{detail}</small>
    </button>
  );
}

async function exportEditedImage({
  asset,
  state,
  format,
  quality,
  t,
}: {
  asset: WorkspaceAsset;
  state: ImageEditState;
  format: ImageExportFormat;
  quality: number;
  t: Copy;
}): Promise<ImageExportResult> {
  const image = await loadImage(asset.objectUrl, t);
  const plan = buildImageExportPlan({
    sourceName: asset.name,
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
    state,
    format,
    quality,
  });
  const canvas = document.createElement("canvas");
  canvas.width = plan.outputWidth;
  canvas.height = plan.outputHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(t.canvasUnavailable);
  }

  const rotated = state.rotation === 90 || state.rotation === 270;
  const drawWidth = rotated ? plan.outputHeight : plan.outputWidth;
  const drawHeight = rotated ? plan.outputWidth : plan.outputHeight;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.filter = getCanvasFilter(state);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((state.rotation * Math.PI) / 180);
  context.scale(state.flipHorizontal ? -1 : 1, state.flipVertical ? -1 : 1);
  context.drawImage(
    image,
    plan.crop.x,
    plan.crop.y,
    plan.crop.width,
    plan.crop.height,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.restore();

  if (state.watermarkText.trim()) {
    context.save();
    context.globalAlpha = 0.78;
    context.fillStyle = "#ffffff";
    context.font = `${Math.max(16, Math.round(canvas.width * 0.04))}px system-ui, sans-serif`;
    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.fillText(state.watermarkText.trim(), canvas.width - 18, canvas.height - 18);
    context.restore();
  }

  const blob = await canvasToBlob(canvas, plan.mimeType, plan.quality / 100, t);

  return {
    url: URL.createObjectURL(blob),
    filename: plan.suggestedFilename,
    size: blob.size,
  };
}

function loadImage(src: string, t: Copy): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(t.imageLoadFailed));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
  t: Copy,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(t.canvasExportFailed));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function getImagePreviewStyle(state: ImageEditState | null): React.CSSProperties {
  if (!state) {
    return {};
  }

  return {
    filter: getCanvasFilter(state),
    transform: [
      `rotate(${state.rotation}deg)`,
      `scaleX(${state.flipHorizontal ? -1 : 1})`,
      `scaleY(${state.flipVertical ? -1 : 1})`,
    ].join(" "),
  };
}

function getCanvasFilter(state: ImageEditState): string {
  return [
    `brightness(${100 + state.adjustments.brightness}%)`,
    `contrast(${100 + state.adjustments.contrast}%)`,
    `saturate(${100 + state.adjustments.saturation}%)`,
  ].join(" ");
}

function createMediaAsset(file: File, index: number): WorkspaceAsset {
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

function getVisibleAssets(
  assets: readonly WorkspaceAsset[],
  filter: MediaFilter,
): WorkspaceAsset[] {
  if (filter === "all") {
    return [...assets];
  }

  return assets.filter((asset) => asset.kind === filter);
}

function detectInitialLanguage(): Language {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  return "en";
}

function getTabLabel(tab: MobileTab, t: Copy): string {
  if (tab === "library") {
    return t.library;
  }

  if (tab === "preview") {
    return t.preview;
  }

  if (tab === "edit") {
    return t.edit;
  }

  return t.export;
}

function getFilterLabel(filter: MediaFilter, t: Copy): string {
  if (filter === "all") {
    return t.all;
  }

  return getKindLabel(filter, t);
}

function getKindLabel(kind: MediaKind, t: Copy): string {
  return kind === "image" ? t.image : t.video;
}

function getAdjustmentLabel(adjustment: "brightness" | "contrast" | "saturation", t: Copy): string {
  if (adjustment === "brightness") {
    return t.brightness;
  }

  if (adjustment === "contrast") {
    return t.contrast;
  }

  return t.saturation;
}
