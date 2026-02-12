"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./events.css";
import { useSearchParams } from "next/navigation";

import EventCard from "./components/EventCard";
import PaginationControls from "./components/PaginationControls";
import {
  ITEMS_PER_PAGE,
  getEventDateTime,
  isWithinRange,
  paginateItems,
} from "./eventFilters";

const SAMPLE_EVENTS = [
  {
    _id: "sample-1",
    title: "Frontend Workshop",
    description: "Hands-on React patterns for production apps.",
    genre: "Workshop",
    createdBy: "Tech Club",
    date: "2026-03-20",
    time: "18:30",
    location: "Lab 2",
  },
  {
    _id: "sample-2",
    title: "Open Mic Night",
    description: "Share poetry and music with peers.",
    genre: "Cultural",
    createdBy: "Cultural Club",
    date: "2026-03-21",
    time: "19:00",
    location: "Main Hall",
  },
];

const Eventspage = () => {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState([]);
  const [appliedEvents, setAppliedEvents] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/forms/publics");
        if (!res.ok) throw new Error("Failed to fetch events");

        const data = await res.json();
       const eventsData = Array.isArray(data) ? data : [];
        setEvents(eventsData);


        const appliedMap = {};
        await Promise.all(
        eventsData.map(async (event) => {
            try {
             const applyRes = await fetch(`/api/forms/check-applied?formId=${event._id}`);
              const result = await applyRes.json();
              appliedMap[event._id] = Boolean(result.applied);
            } catch {
              appliedMap[event._id] = false;
            }
          })
        );

        setAppliedEvents(appliedMap);

      } catch (error) {
        console.error(error);
          // Demo fallback keeps UI functional when backend env vars are unavailable.
        setEvents(SAMPLE_EVENTS);
      }
    };

    fetchEvents();
  }, []);
const activeFilters = useMemo(
    () => ({
      timeRange: searchParams.get("timeRange") || "all",
      category: (searchParams.get("category") || "").toLowerCase().trim(),
      club: (searchParams.get("club") || "").toLowerCase().trim(),
    }),
    [searchParams]
  );

   const filteredEvents = useMemo(() => {
    const now = new Date();
  
    return events.filter((event) => {
      const eventDateTime = getEventDateTime(event);
      const category = (event.genre || "").toLowerCase().trim();
      const organizer = (event.createdBy || "").toLowerCase().trim();

      const categoryMatch =
        !activeFilters.category || category === activeFilters.category;
      const clubMatch = !activeFilters.club || organizer.includes(activeFilters.club);
      const timeMatch = isWithinRange(eventDateTime, activeFilters.timeRange, now);

        return categoryMatch && clubMatch && timeMatch;
    });
  }, [activeFilters, events]);

     useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));

   const paginatedEvents = useMemo(
    () => paginateItems(filteredEvents, currentPage),
    [currentPage, filteredEvents]
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="my-eventsbody">
  {filteredEvents.length === 0 && (
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="circle-bg">
               <div className="icon-center">
                <img src="/myclubs/calender.svg" alt="" />
              </div>
            </div>
          </div>

            <h2>No matching events</h2>
          <p>No events match the selected filters. Try changing category, club, or time range.</p>

        </div>
      )}
        {filteredEvents.length > 0 && (
        <div className="eventscontainercont">
          <div className="eventscontainer">
            {paginatedEvents.map((event) => (
              <EventCard key={event._id} event={event} isApplied={appliedEvents[event._id]} />
            ))}
          </div>
        </div>
      )}
       <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={handlePreviousPage}
        onNext={handleNextPage}
        onPageSelect={setCurrentPage}
      />
    </div>
  );
};

export default Eventspage;
