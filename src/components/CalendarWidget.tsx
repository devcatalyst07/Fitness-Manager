"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Clock, Plus, X } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface CalendarEvent {
  _id: string;
  title: string;
  startDate: string;
  type: string;
}

interface CalendarWidgetProps {
  projectId: string;
}

function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getCityFromTimezone(timezone: string): string {
  const parts = timezone.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

export default function CalendarWidget({ projectId }: CalendarWidgetProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    type: "custom" as "meeting" | "task" | "holiday" | "custom",
  });

  const timezone = useMemo(() => getUserTimezone(), []);
  const city = useMemo(() => getCityFromTimezone(timezone), [timezone]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [projectId]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/events`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const upcomingEvents = data
          .filter((e: CalendarEvent) => new Date(e.startDate) >= new Date())
          .sort(
            (a: CalendarEvent, b: CalendarEvent) =>
              new Date(a.startDate).getTime() -
              new Date(b.startDate).getTime()
          )
          .slice(0, 5);
        setEvents(upcomingEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleAddEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            endDate: formData.startDate,
          }),
        }
      );

      if (response.ok) {
        fetchEvents();
        setIsModalOpen(false);
        setFormData({ title: "", startDate: "", type: "custom" });
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "text-blue-600";
      case "task":
        return "text-orange-600";
      case "holiday":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon size={28} />
            Company Calendar
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Clock size={16} />
              <span className="font-medium">{timezone}</span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm whitespace-nowrap"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <MapPin size={14} />
          <span>{city} • Using organization default calendar</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="text-sm text-gray-700 w-full md:w-auto">
            <div className="font-semibold">
              {format(currentDateTime, "MM/dd/yyyy")} |{" "}
              {format(currentDateTime, "EEEE")}
            </div>
            <div className="text-gray-600">
              {format(currentDateTime, "hh:mm:ss a")}
            </div>
          </div>

          <div className="flex-1 w-full">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">
              Upcoming Events
            </h4>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No upcoming events scheduled
              </p>
            ) : (
              <div className="space-y-1">
                {events.map((event) => (
                  <div key={event._id} className="text-sm">
                    <span className="font-medium text-gray-700">
                      {format(parseISO(event.startDate), "MM/dd/yyyy")}
                    </span>
                    <span className="mx-2">-</span>
                    <span
                      className={`font-medium ${getEventTypeColor(event.type)}`}
                    >
                      {event.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add New Event</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Christmas Party, Team Meeting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as typeof formData.type,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="custom">Custom Event</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task Deadline</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!formData.title || !formData.startDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
