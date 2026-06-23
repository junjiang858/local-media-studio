import { toast } from "sonner";

export function showStudioError(message: string) {
  toast.error(message);
}

export function showStudioInfo(message: string) {
  toast.info(message);
}

export function showStudioSuccess(message: string) {
  toast.success(message);
}
