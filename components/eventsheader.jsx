"use client";

import { Plus } from "lucide-react";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createNewForm } from "@/lib/createNewForm";
import "./eventsheader.css";

const Eventsheader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [forms, setForms] = useState([]);

  // sync button position with URL
  const isEvent = pathname === "/dashboard/events";

  // const createNewForm = () => {
  //       const newForm = {
  //           id: Date.now().toString(),
  //           title: "Untitled Form",
  //           description: "",
  //           createdAt: new Date().toISOString(),
  //           questions: 0,
  //       };

  //       const updatedForms = [newForm, ...forms];
  //       setForms(updatedForms);
  //       localStorage.setItem(
  //           "unilynk-forms",
  //           JSON.stringify(updatedForms),
  //       );
  //   };

  const handleCreate = () => {
    const newForm = createNewForm();
    router.push(`/FormBuilder/${newForm.id}`);
  };


  return (
    <div className="eventshead">
      <div className="eventstextcont">
        <h1 className="myeventstext">Events</h1>
        <div className="eventsnum">6 upcoming Events</div>
      </div>

      <div className="events-toggle">
        <div className={`event-track ${!isEvent ? "right" : ""}`}>
          <div className="event-bg"></div>

          <button
            className={`event-btn ${isEvent ? "active" : ""}`}
            onClick={() => router.push("/dashboard/events")}
          >
            Events
          </button>

          <button
            className={`event-btn ${!isEvent ? "active" : ""}`}
            onClick={() => router.push("/dashboard/events/yourform")}
          >
            Your Forms
          </button>
        </div>
      </div>

      <div className="search-filter">
        { isEvent? (<button className="filterevent">
          <img src="/eventsicons/filter.svg" alt="filter" />
          Filter
        </button >):( 
          <button className="filterevent" onClick={handleCreate}>
            <Plus/> Form
          </button>
        )}

        <div className="eventssearchcont">
          <img src="/dashboard/Search.svg" alt="Search icon" />
          <input
            type="text"
            className="searchevents"
            placeholder="Search clubs..."
          />
        </div>
      </div>
    </div>
  );
};

export default Eventsheader;
