// frontend/src/lib/utils.js (update)
export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// New utility function for relative date formatting
export function formatDateRelative(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 0) {
    return 'Past';
  }
  
  if (diffMinutes < 1) {
    return 'In less than a minute';
  }
  
  if (diffMinutes === 1) {
    return 'In 1 minute';
  }
  
  if (diffMinutes < 60) {
    return `In ${diffMinutes} minutes`;
  }
  
  if (diffHours === 1) {
    return 'In 1 hour';
  }
  
  if (diffHours < 24) {
    return `In ${diffHours} hours`;
  }
  
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  
  if (diffDays < 7) {
    return `In ${diffDays} days`;
  }
  
  // Default to regular date format
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}