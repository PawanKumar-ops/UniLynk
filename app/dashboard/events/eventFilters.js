export const ITEMS_PER_PAGE = 10;

export const TIME_FILTERS = [
  { value: "all", label: "All Events" },
  { value: "this_hour", label: "Happening Now / This Hour" },
  { value: "today", label: "Happening Today" },
  { value: "this_week", label: "Happening This Week" },
  { value: "this_month", label: "Happening This Month" },
  { value: "upcoming", label: "Upcoming" },
];

export const getEventDateTime = (event) => {
  if (!event?.date) return null;

  const dateTimeValue = event.time
    ? `${event.date}T${event.time}`
    : `${event.date}T00:00`;

  const parsedDate = new Date(dateTimeValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const fallbackDate = new Date(event.date);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

export const isWithinRange = (date, range, now = new Date()) => {
  if (!date) {
    return range === "all";
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  switch (range) {
    case "this_hour": {
      const hourEnd = new Date(now.getTime() + 60 * 60 * 1000);
      return date >= now && date <= hourEnd;
    }
    case "today": {
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);
      return date >= todayStart && date < todayEnd;
    }
    case "this_week": {
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - todayStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return date >= weekStart && date < weekEnd;
    }
    case "this_month":
      return (
        date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      );
    case "upcoming":
      return date > now;
    default:
      return true;
  }
};

export const paginateItems = (items, page, pageSize = ITEMS_PER_PAGE) => {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};