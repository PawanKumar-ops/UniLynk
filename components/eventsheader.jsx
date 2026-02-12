"use client";

import { Plus } from "lucide-react";
import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createNewForm } from "@/lib/createNewForm";
import "./eventsheader.css";

const Eventsheader = () => {
  const router = useRouter();
  const pathname = usePathname();
   const searchParams = useSearchParams();
  const [forms, setForms] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(searchParams.get("timeRange") || "all");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [searchText, setSearchText] = useState(searchParams.get("q") || "");

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

  const updateQueryParams = (paramsToUpdate = {}) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const applyFilters = () => {
    updateQueryParams({
      timeRange: selectedTimeRange === "all" ? "" : selectedTimeRange,
      category: selectedCategory.trim(),
    });
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedTimeRange("all");
    setSelectedCategory("");
    updateQueryParams({ timeRange: "", category: "" });
    setIsFilterOpen(false);
  };

  const runSearch = () => {
    updateQueryParams({ q: searchText.trim() });
  };

  return (
    <div className="eventshead">
      <div className="eventstextcont">
        <h1 className="myeventstext">Events</h1>
         <div className="eventsnum">Discover upcoming events</div>
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
         { isEvent? (
          <div className="filter-wrap">
            <button className="filterevent" onClick={() => setIsFilterOpen((prev) => !prev)}>
              <img src="/eventsicons/filter.svg" alt="filter" />
              Filter
            </button >

            {isFilterOpen && (
              <div className="filter-panel">
                <label>
                  Time range
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  >
                    <option value="all">All time</option>
                    <option value="this_hour">This hour</option>
                    <option value="today">Today</option>
                    <option value="this_week">This week</option>
                    <option value="last_week">Last week</option>
                    <option value="this_month">This month</option>
                  </select>
                </label>

                <label>
                  Category
                  <input
                    type="text"
                    value={selectedCategory}
                    placeholder="e.g. Workshop"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                </label>

                <div className="filter-actions">
                  <button onClick={clearFilters} className="filter-secondary">Clear</button>
                  <button onClick={applyFilters} className="filter-primary">Apply</button>
                </div>
              </div>
            )}
          </div>
        ):( 
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
             value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Eventsheader;
