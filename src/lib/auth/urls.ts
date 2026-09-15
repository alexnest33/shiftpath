import { headers } from "next/headers";

const LOCAL_ORIGIN = "http://localhost:3000";

function parseHttpOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export async function getSiteOrigin() {
  const configuredOrigin = parseHttpOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
  );

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const requestOrigin = parseHttpOrigin((await headers()).get("origin"));

  return requestOrigin ?? LOCAL_ORIGIN;
}

export function getSafeRedirectPath(
  value: string | null,
  fallback = "/dashboard",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  let decodedValue: string;

  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (
    !decodedValue.startsWith("/") ||
    decodedValue.startsWith("//") ||
    decodedValue.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(decodedValue)
  ) {
    return fallback;
  }

  const internalOrigin = "https://shiftpath.invalid";

  try {
    const url = new URL(value, internalOrigin);

    if (url.origin !== internalOrigin) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
