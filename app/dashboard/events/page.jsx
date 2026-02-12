"use client";

import React, { useEffect, useState } from "react";
import "./events.css";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
const Eventspage = () => {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [appliedEvents, setAppliedEvents] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/forms/publics");
        if (!res.ok) throw new Error("Failed to fetch events");

        const data = await res.json();
        setEvents(data);
        setFilteredEvents(data);
        //  Check applied status
        const appliedMap = {};

        await Promise.all(
          data.map(async (event) => {
            try {
              const res = await fetch(`/api/forms/check-applied?formId=${event._id}`);
              const result = await res.json();
              appliedMap[event._id] = result.applied;
            } catch {
              appliedMap[event._id] = false;
            }
          })
        );

        setAppliedEvents(appliedMap);

      } catch (error) {
        console.error(error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const timeRange = searchParams.get("timeRange") || "all";
    const category = (searchParams.get("category") || "").toLowerCase();
    const query = (searchParams.get("q") || "").toLowerCase();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);

    const filtered = events.filter((event) => {
      const eventDate = event.date ? new Date(event.date) : null;

      let timeMatch = true;
      if (eventDate && !Number.isNaN(eventDate.getTime())) {
        switch (timeRange) {
          case "this_hour": {
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            timeMatch = eventDate >= oneHourAgo && eventDate <= now;
            break;
          }
          case "today": {
            timeMatch =
              eventDate.getDate() === now.getDate() &&
              eventDate.getMonth() === now.getMonth() &&
              eventDate.getFullYear() === now.getFullYear();
            break;
          }
          case "this_week":
            timeMatch = eventDate >= weekStart && eventDate < weekEnd;
            break;
          case "last_week":
            timeMatch = eventDate >= lastWeekStart && eventDate < weekStart;
            break;
          case "this_month":
            timeMatch =
              eventDate.getMonth() === now.getMonth() &&
              eventDate.getFullYear() === now.getFullYear();
            break;
          default:
            timeMatch = true;
        }
      } else if (timeRange !== "all") {
        timeMatch = false;
      }

      const genre = (event.genre || "").toLowerCase();
      const title = (event.title || "").toLowerCase();
      const description = (event.description || "").toLowerCase();

      const categoryMatch = !category || genre.includes(category);
      const searchMatch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        genre.includes(query);

      return timeMatch && categoryMatch && searchMatch;
    });

    setFilteredEvents(filtered);
  }, [events, searchParams]);


  return (
    <div className="my-eventsbody">


       {filteredEvents.length === 0 && (

        <div className="empty-state">
          <div className="empty-illustration">
            <div className="circle-bg">
              <div className="icon-center"><img src="/myclubs/calender.svg" alt="" /></div>
            </div>
          </div>

          <h2>No Events Right Now</h2>
          <p>The event calendar is currently clear. Check out our vibrant clubs and communities to stay connected with campus life.</p>

        </div>

      )}
      <div className="eventscontainercont">
        <div className="eventscontainer">

           {filteredEvents.map((event) => (
            <div className="event" key={event._id}>

              <div className="eventimginfo">
                <div className="eventpic">
                  <img src="/dashboard/events.svg" alt="" />
                </div>

                <div className="eventdef">
                  <div className="genre">
                    {event.genre || "Other"}
                  </div>

                  <p className="eventname">
                    {event.title || "Untitled Event"}
                  </p>

                  <p className="clubname">
                    {event.description || "No description available"}
                  </p>
                </div>
              </div>

              <ul className="eventinfo">

                <li className="date">
                  <img src="/eventsicons/Events.svg" alt="" />
                  {event.date
                    ? format(new Date(event.date), "MMM dd, yyyy")
                    : "Date TBA"}
                </li>

                <li className="time">
                  <img src="/eventsicons/Clock.svg" alt="" />
                  {event.time || "Time TBA"}
                </li>

                <li className="venue">
                  <img src="/eventsicons/Location.svg" alt="" />
                  {event.location || "Venue TBA"}
                </li>

              </ul>

              <hr />

              <div className="applyevent">


                <button className="viewdetails">
                  View Details
                </button>


                {appliedEvents[event._id] ? (

                  <button className="apply applied-btn" disabled>
                    Applied
                  </button>

                ) : (

                  <Link href={`/FormPreview/${event._id}`}>
                    <button className="apply">
                      Apply
                    </button>
                  </Link>

                )}

              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Eventspage;
