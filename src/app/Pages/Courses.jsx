import React, { useState } from "react";

const Courses = () => {
  const [currentMonth, setCurrentMonth] = useState("January 2025");

  // Get current date with the day
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long", // Full name of the day
    year: "numeric",
    month: "long", // Full name of the month
    day: "numeric",
  });

  // Mock events data for the calendar
  const events = [
    {
      date: "1",
      time: "10:00 AM",
      title: "One-on-one with Alex",
      color: "bg-red-200",
    },
    {
      date: "3",
      time: "4:00 PM",
      title: "All-hands meeting",
      color: "bg-green-200",
    },
    {
      date: "7",
      time: "2:30 PM",
      title: "Catch up with Alex",
      color: "bg-purple-200",
    },
    {
      date: "10",
      time: "9:00 AM",
      title: "Friday Standup",
      color: "bg-blue-200",
    },
    {
      date: "15",
      time: "11:00 AM",
      title: "Product Planning",
      color: "bg-yellow-200",
    },
    { date: "22", time: "9:00 AM", title: "Deep Work", color: "bg-red-200" },
    {
      date: "28",
      time: "2:30 PM",
      title: "Lunch with Alina",
      color: "bg-blue-200",
    },
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div>
          <p className="text-xl text-gray-600 mb-2 font-semibold">{`Today's Date: ${formattedDate}`}</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 border rounded-lg bg-gray-200 hover:bg-gray-300">
            Today
          </button>
          <select
            className="border px-4 py-2 rounded-lg bg-white focus:outline-none"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
          >
            <option>January 2025</option>
            <option>February 2025</option>
            <option>March 2025</option>
          </select>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Edit Timetable
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4 text-center">
        {/* Week Days */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="font-medium">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((day) => (
          <div
            key={day}
            className="relative border rounded-lg p-4 h-32 bg-white shadow-md"
          >
            <div className="absolute top-2 right-2 text-sm font-bold">
              {day}
            </div>
            {events
              .filter((event) => parseInt(event.date, 10) === day)
              .map((event, idx) => (
                <div
                  key={idx}
                  className={`text-sm rounded-lg mt-2 px-2 py-1 ${event.color}`}
                >
                  {event.time} - {event.title}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
