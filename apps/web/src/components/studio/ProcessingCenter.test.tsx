import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import type { ComponentType } from "react";
import type { WorkerJob } from "@obscura/shared";
import { en } from "../../i18n/messages/en";
import { ProcessingCenter } from "./ProcessingCenter";

const ProcessingCenterWithActions = ProcessingCenter as unknown as ComponentType<{
  jobs: WorkerJob[];
  onCancelJob: (jobId: string) => void;
  onOpenResult: (assetId: string) => void;
  onRetryJob: (jobId: string) => void;
  t: typeof en;
}>;

it("exposes cancel, retry, and open-result actions for background jobs", async () => {
  const user = userEvent.setup();
  const onCancelJob = vi.fn();
  const onOpenResult = vi.fn();
  const onRetryJob = vi.fn();

  render(
    <ProcessingCenterWithActions
      jobs={[
        {
          id: "video-export:1",
          progress: 32,
          sourceAssetId: "asset-video",
          sourceAssetKind: "video",
          sourceAssetName: "clip.webm",
          status: "processing",
          title: "Export - MP4",
          type: "video-export",
        },
        {
          error: {
            code: "video-preview-failed",
            message: "Codec failed",
            recoverable: true,
          },
          id: "video-preview:1",
          sourceAssetId: "asset-video",
          sourceAssetKind: "video",
          sourceAssetName: "clip.webm",
          status: "failed",
          title: "Format conversion - MKV",
          type: "video-preview",
        },
        {
          id: "image-preview:1",
          resultAssetId: "asset-generated",
          sourceAssetId: "asset-image",
          sourceAssetKind: "image",
          sourceAssetName: "cover.png",
          status: "completed",
          title: "Format preview - WEBP",
          type: "image-preview",
        },
      ]}
      onCancelJob={onCancelJob}
      onOpenResult={onOpenResult}
      onRetryJob={onRetryJob}
      t={en}
    />,
  );

  await user.click(screen.getByRole("button", { name: /cancel task: export - mp4/i }));
  await user.click(screen.getByRole("button", { name: /retry task: format conversion - mkv/i }));
  await user.click(screen.getByRole("button", { name: /open result: format preview - webp/i }));

  expect(onCancelJob).toHaveBeenCalledWith("video-export:1");
  expect(onRetryJob).toHaveBeenCalledWith("video-preview:1");
  expect(onOpenResult).toHaveBeenCalledWith("asset-generated");
});
