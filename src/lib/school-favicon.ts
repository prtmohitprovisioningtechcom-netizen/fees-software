const FAVICON_CACHE_KEY = "school-favicon-logo";

function faviconMimeType(logo: string) {
  if (logo.startsWith("data:image/png")) return "image/png";
  if (logo.startsWith("data:image/jpeg") || logo.startsWith("data:image/jpg")) return "image/jpeg";
  if (logo.startsWith("data:image/svg")) return "image/svg+xml";
  if (logo.startsWith("data:image/webp")) return "image/webp";
  if (logo.startsWith("data:image/gif")) return "image/gif";
  return "image/png";
}

export function cacheSchoolFavicon(logo: string) {
  if (typeof window === "undefined") return;
  if (logo) {
    localStorage.setItem(FAVICON_CACHE_KEY, logo);
  } else {
    localStorage.removeItem(FAVICON_CACHE_KEY);
  }
}

export function getCachedSchoolFavicon() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(FAVICON_CACHE_KEY) || "";
}

export function applySchoolFavicon(logo: string) {
  if (typeof document === "undefined") return;

  const selector = 'link[data-school-favicon="true"]';
  const existing = document.querySelector<HTMLLinkElement>(selector);

  if (!logo) {
    existing?.remove();
    return;
  }

  const link = existing ?? document.createElement("link");
  link.rel = "icon";
  link.setAttribute("data-school-favicon", "true");
  link.type = faviconMimeType(logo);
  link.href = logo;

  if (!existing) {
    document.head.appendChild(link);
  }
}
