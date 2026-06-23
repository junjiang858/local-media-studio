import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import { en } from "../../i18n/messages/en";
import { VideoTrimTimeline } from "./VideoTrimTimeline";

it("resets trim to the visible timeline duration when asset duration is not available yet", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();

  render(
    <VideoTrimTimeline
      duration={null}
      onApply={onApply}
      onGeneratePreview={vi.fn()}
      t={en}
      videoState={{
        exportFormat: "mp4",
        speed: 1,
        subtitles: [],
        trimEnd: 8.4,
        trimStart: 1.2,
      }}
      videoThumbnails={[]}
    />,
  );

  await user.click(screen.getByRole("button", { name: /reset trim/i }));

  expect(onApply).toHaveBeenCalledWith({ duration: 8.4, type: "reset-trim" });
});
