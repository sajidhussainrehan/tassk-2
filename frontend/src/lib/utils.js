import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BACKEND_ORIGIN = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");

// Images are served by the backend as relative paths (/api/images/...); older data may still hold full URLs or data URIs
export function resolveImageUrl(url) {
  if (!url) return url;
  return url.startsWith("/") ? `${BACKEND_ORIGIN}${url}` : url;
}
