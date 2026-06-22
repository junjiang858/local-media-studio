import { create } from "zustand";
import {
  cancelWorkerJob,
  completeWorkerJob,
  createWorkerJob,
  failWorkerJob,
  updateWorkerJobProgress,
  type WorkerJobProgressUpdate,
} from "@local-media-studio/media-core";
import type { WorkerJob } from "@local-media-studio/shared";

type JobStore = {
  jobs: Record<string, WorkerJob>;
  queueJob: (id: string, type: WorkerJob["type"], message?: string) => void;
  updateJob: (id: string, update: WorkerJobProgressUpdate) => void;
  completeJob: (id: string, message?: string) => void;
  failJob: (id: string, error: NonNullable<WorkerJob["error"]>) => void;
  cancelJob: (id: string, message?: string) => void;
  clearJob: (id: string) => void;
  resetJobs: () => void;
};

export const useJobStore = create<JobStore>((set) => ({
  jobs: {},
  queueJob: (id, type, message) => {
    set((state) => ({
      jobs: {
        ...state.jobs,
        [id]: createWorkerJob(id, type, message),
      },
    }));
  },
  updateJob: (id, update) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: updateWorkerJobProgress(job, update),
        },
      };
    });
  },
  completeJob: (id, message) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: completeWorkerJob(job, message),
        },
      };
    });
  },
  failJob: (id, error) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: failWorkerJob(job, error),
        },
      };
    });
  },
  cancelJob: (id, message) => {
    set((state) => {
      const job = state.jobs[id];

      if (!job) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [id]: cancelWorkerJob(job, message),
        },
      };
    });
  },
  clearJob: (id) => {
    set((state) => {
      const nextJobs = { ...state.jobs };
      delete nextJobs[id];

      return { jobs: nextJobs };
    });
  },
  resetJobs: () => set({ jobs: {} }),
}));
