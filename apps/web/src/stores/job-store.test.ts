import { describe, expect, it } from "vitest";
import { useJobStore } from "./job-store";

describe("job store", () => {
  it("queues, progresses, completes, fails, and clears local worker jobs", () => {
    useJobStore.getState().resetJobs();

    useJobStore.getState().queueJob("job-1", "background-removal", "Loading model");
    useJobStore.getState().updateJob("job-1", {
      message: "Removing background",
      progress: 42,
      status: "processing",
    });

    expect(useJobStore.getState().jobs["job-1"]).toMatchObject({
      message: "Removing background",
      progress: 42,
      status: "processing",
      type: "background-removal",
    });

    useJobStore.getState().completeJob("job-1", "Background removed");
    expect(useJobStore.getState().jobs["job-1"]?.status).toBe("completed");

    useJobStore.getState().queueJob("job-2", "video-export", "Preparing video");
    useJobStore.getState().failJob("job-2", {
      code: "codec-unsupported",
      message: "Unsupported codec",
      recoverable: true,
    });
    expect(useJobStore.getState().jobs["job-2"]).toMatchObject({
      error: {
        code: "codec-unsupported",
        message: "Unsupported codec",
        recoverable: true,
      },
      status: "failed",
    });

    useJobStore.getState().clearJob("job-1");
    expect(useJobStore.getState().jobs["job-1"]).toBeUndefined();
  });
});
