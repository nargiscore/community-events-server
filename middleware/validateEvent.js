export const EVENT_TYPES = [
  "Cleanup", "Plantation", "Donation", "Blood Donation",
  "Food Distribution", "Education", "Health Camp",
];

export const todayString = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

// Returns an error message string, or null when the payload is valid.
export function validateEvent(b) {
  if (!b || typeof b !== "object") return "Event details are missing.";
  if (!b.title || b.title.trim().length < 5) return "Title must be at least 5 characters.";
  if (!b.description || b.description.trim().length < 20)
    return "Description must be at least 20 characters.";
  if (!EVENT_TYPES.includes(b.eventType)) return "Please choose a valid event type.";
  if (!b.location || b.location.trim().length < 3) return "Please add the event location.";
  try {
    new URL(b.thumbnail);
  } catch {
    return "Thumbnail must be a valid image URL.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.eventDate || "")) return "Event date is invalid.";
  if (b.eventDate <= todayString()) return "Event date must be in the future.";
  return null;
}

export const pickEventFields = (b) => ({
  title: b.title.trim(),
  description: b.description.trim(),
  eventType: b.eventType,
  thumbnail: b.thumbnail.trim(),
  location: b.location.trim(),
  eventDate: b.eventDate,
});
