import React, { memo } from "react";
import Link from "next/link";
import { format } from "date-fns";

const EventCard = ({ event, isApplied }) => (
  <div className="event" key={event._id}>
    <div className="eventimginfo">
      <div>
        <img  className="eventpic" src={event.clubId?.logo || "/Profilepic.png"} alt="Club Logo" />
      </div>

      <div className="eventdef">
        <div className="genre">{event.genre || "Other"}</div>

        <p className="eventname">{event.title || "Untitled Event"}</p>

        <p className="ee-clubname">{event.clubId?.clubName || "No club assigned"}</p>
      </div>
    </div>

    <ul className="eventinfo">
      <li className="date">
        <img src="/eventsicons/Events.svg" alt="" />
        {event.date ? format(new Date(event.date), "MMM dd, yyyy") : "Date TBA"}
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
      <button className="viewdetails">View Details</button>

      {isApplied ? (
        <Link href={`/FormPreview/${event._id}`}>
          <button className="apply">Preview</button>
        </Link>
      ) : (
        <Link href={`/FormPreview/${event._id}`}>
          <button className="apply">Apply</button>
        </Link>
      )}
    </div>
  </div>
);

export default memo(EventCard);