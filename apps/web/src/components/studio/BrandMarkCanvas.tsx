import { useEffect, useRef } from "react";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBrandMark(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);

  const shellGradient = ctx.createLinearGradient(0, 0, size, size);
  shellGradient.addColorStop(0, "#17242d");
  shellGradient.addColorStop(0.5, "#0d141b");
  shellGradient.addColorStop(1, "#070b10");

  roundedRect(ctx, 2.5, 2.5, size - 5, size - 5, 9);
  ctx.fillStyle = shellGradient;
  ctx.fill();
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = "rgba(124, 215, 255, 0.82)";
  ctx.stroke();

  const apertureGradient = ctx.createLinearGradient(8, 7, 26, 27);
  apertureGradient.addColorStop(0, "#d8f6ff");
  apertureGradient.addColorStop(0.55, "#6bd7ff");
  apertureGradient.addColorStop(1, "#4bd18d");

  roundedRect(ctx, 7.2, 7.2, 19.6, 19.6, 4.8);
  ctx.strokeStyle = "rgba(216, 246, 255, 0.64)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.save();
  roundedRect(ctx, 8.8, 8.8, 16.4, 16.4, 3.6);
  ctx.clip();

  const lightGradient = ctx.createLinearGradient(8, 24, 28, 8);
  lightGradient.addColorStop(0, "rgba(65, 184, 255, 0)");
  lightGradient.addColorStop(0.42, "rgba(124, 215, 255, 0.42)");
  lightGradient.addColorStop(1, "rgba(216, 246, 255, 0.88)");

  ctx.beginPath();
  ctx.moveTo(9, 25.2);
  ctx.lineTo(26.2, 8.4);
  ctx.lineTo(26.2, 13.6);
  ctx.lineTo(14.5, 25.2);
  ctx.closePath();
  ctx.fillStyle = lightGradient;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(17, 17, 6.1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(7, 12, 18, 0.82)";
  ctx.fill();
  ctx.strokeStyle = apertureGradient;
  ctx.lineWidth = 1.45;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(17, 10.9);
  ctx.lineTo(20.5, 16.2);
  ctx.lineTo(17.2, 17.6);
  ctx.lineTo(13.5, 12.2);
  ctx.closePath();
  ctx.fillStyle = "rgba(124, 215, 255, 0.82)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(23.1, 17);
  ctx.lineTo(17.9, 20.6);
  ctx.lineTo(16.3, 17.3);
  ctx.lineTo(21.8, 13.5);
  ctx.closePath();
  ctx.fillStyle = "rgba(75, 209, 141, 0.68)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(17, 23.1);
  ctx.lineTo(13.5, 17.9);
  ctx.lineTo(16.8, 16.4);
  ctx.lineTo(20.5, 21.8);
  ctx.closePath();
  ctx.fillStyle = "rgba(124, 215, 255, 0.64)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(10.9, 17);
  ctx.lineTo(16.2, 13.5);
  ctx.lineTo(17.6, 16.8);
  ctx.lineTo(12.2, 20.5);
  ctx.closePath();
  ctx.fillStyle = "rgba(216, 246, 255, 0.54)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(17, 17, 2.05, 0, Math.PI * 2);
  ctx.fillStyle = "#071019";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(23.8, 9.8, 1.1, 0, Math.PI * 2);
  ctx.arc(10.2, 24.2, 0.9, 0, Math.PI * 2);
  ctx.fillStyle = "#d8f6ff";
  ctx.fill();
}

export function BrandMarkCanvas({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    const size = 34;
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    drawBrandMark(ctx, size);
    ctx.restore();
  }, []);

  return (
    <canvas
      aria-label={label}
      className="brand-mark-canvas"
      data-brand-mark="darkroom-aperture"
      height={34}
      ref={canvasRef}
      role="img"
      width={34}
    />
  );
}
