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
    // 4. Hardcoded fallback
    return "https://joshmayer.net";
  }

  // Development environment
  return "http://localhost:3000";
}
