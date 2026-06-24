const defaultBackgroundRemovalPublicPath =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

export function getBackgroundRemovalPublicPath(): string {
  const configuredPath = getConfiguredBackgroundRemovalPublicPath();

  return normalizeBackgroundRemovalPublicPath(configuredPath || defaultBackgroundRemovalPublicPath);
}

function getConfiguredBackgroundRemovalPublicPath(): string {
  const env = import.meta.env as Record<string, unknown>;
  const publicPath = env.VITE_BACKGROUND_REMOVAL_PUBLIC_PATH;

  return typeof publicPath === "string" ? publicPath.trim() : "";
}

function normalizeBackgroundRemovalPublicPath(publicPath: string): string {
  const pathWithSlash = publicPath.endsWith("/") ? publicPath : `${publicPath}/`;

  if (/^https?:\/\//i.test(pathWithSlash)) {
    return pathWithSlash;
  }

  if (typeof window === "undefined" || !window.location?.origin) {
    return pathWithSlash;
  }

  return new URL(pathWithSlash, window.location.origin).toString();
}
