export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const getRelativeTime = (dateString: string | undefined): string => {
  if (!dateString) {
    return 'recently';
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'recently';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays < 30) {
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    return 'recently';
  }
};

export const getDateRangeText = (days: number): string => {
  switch (days) {
    case 7:
      return 'Last 7 days';
    case 30:
      return 'Last 30 days';
    case 90:
      return 'Last 90 days';
    default:
      return `Last ${days} days`;
  }
};
