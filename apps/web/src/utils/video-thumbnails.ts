export type VideoThumbnail = {
  id: string;
  time: number;
  url: string;
};

export async function generateVideoThumbnails({
  count = 8,
  duration,
  sourceUrl,
}: {
  count?: number;
  duration?: number | null;
  sourceUrl: string;
}): Promise<VideoThumbnail[]> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = sourceUrl;

  await waitForMetadata(video);
  const safeDuration = Math.max(0.1, duration ?? video.duration ?? 0.1);
  const frameCount = Math.max(1, Math.min(count, Math.ceil(safeDuration * 4)));
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Video thumbnail canvas is not available.");
  }

  const thumbnails: VideoThumbnail[] = [];

  for (let index = 0; index < frameCount; index += 1) {
    const time =
      frameCount === 1 ? 0 : Math.min(safeDuration - 0.05, (safeDuration * index) / frameCount);
    await seekVideo(video, Math.max(0, time));
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas);
    thumbnails.push({
      id: `thumb-${index}-${Math.round(time * 100)}`,
      time,
      url: URL.createObjectURL(blob),
    });
  }

  video.removeAttribute("src");
  video.load();
  return thumbnails;
}

function waitForMetadata(video: HTMLVideoElement) {
  return new Promise<void>((resolve, reject) => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve();
      return;
    }

    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Video metadata could not be loaded."));
  });
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("Video frame could not be decoded."));
    video.currentTime = time;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Video thumbnail could not be generated."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.68,
    );
  });
}
