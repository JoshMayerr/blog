export function formatDate(dateString: string) {
  const date = new Date(dateString);

  // Convert to a readable format
  const readableString = date.toLocaleDateString("en-US", {
    year: "numeric", // "2024"
    month: "long", // "February"
    day: "numeric", // "1"
  });

  return readableString;
}
