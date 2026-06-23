import type { CSSProperties } from "react";
import type { ImageEditAction, ImageFilterPreset } from "@local-media-studio/media-core";
import { imageFilterPresets } from "../../config/media";
import type { Copy } from "../../i18n";

export function FilterPresetGrid({
  activePreset,
  onApply,
  strength,
  t,
}: {
  activePreset: ImageFilterPreset;
  onApply: (action: ImageEditAction) => void;
  strength: number;
  t: Copy;
}) {
  const rangeStyle = { "--range-progress": `${strength}%` } as CSSProperties;

  return (
    <div className="filter-control">
      <p className="field-label">{t.filters}</p>
      <div aria-label={t.filters} className="filter-preset-grid" role="group">
        {imageFilterPresets.map((preset) => (
          <button
            aria-pressed={activePreset === preset.id}
            className="filter-preset-card"
            key={preset.id}
            onClick={() => onApply({ preset: preset.id, type: "set-filter-preset" })}
            type="button"
          >
            <span className={`filter-preset-swatch ${preset.swatchClass}`} />
            <span>{preset.label(t)}</span>
          </button>
        ))}
      </div>

      <div className="adjustment-control">
        <div className="adjustment-label-row">
          <label htmlFor="filter-strength">{t.filterStrength}</label>
          <output htmlFor="filter-strength">{strength}%</output>
        </div>
        <input
          disabled={activePreset === "none"}
          id="filter-strength"
          max={100}
          min={0}
          onChange={(event) =>
            onApply({
              strength: Number(event.currentTarget.value),
              type: "set-filter-strength",
            })
          }
          style={rangeStyle}
          type="range"
          value={strength}
        />
      </div>
    </div>
  );
}
