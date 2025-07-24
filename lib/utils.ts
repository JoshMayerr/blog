export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    // Priority order for production URLs:
    // 1. Custom site URL (for custom domains)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }

    // 2. Vercel's public URL (recommended for Vercel deployments)
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }

    // 3. Vercel URL (fallback)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    // 4. Hardcoded fallback
    return "https://joshmayer.net";
  }

  // Development environment
  return "http://localhost:3000";
}
