export function formatTimeAgo(dateStr: string | Date | undefined) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    if (hours < 1) {
        const mins = Math.max(1, Math.floor(diffInMs / (1000 * 60)));
        return `${mins}m ago`;
    }
    return `${hours}hr ago`;
  } else if (diffInDays < 4) {
    const days = Math.floor(diffInDays);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
}
