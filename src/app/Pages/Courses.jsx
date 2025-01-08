import React, { useState } from "react";

const Courses = () => {
  const [currentMonth, setCurrentMonth] = useState("January 2025");

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long", // Full name of the day
    year: "numeric",
    month: "long", // Full name of the month
    day: "numeric",
  });

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

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    return {
      day: i + 1,
      date: date,
    };
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div>
          <p className="text-xl text-gray-600 mb-2 font-semibold">{`Today's Date: ${formattedDate}`}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Edit Timetable
          </button>
         
          <div className="flex items-center" >
          <select className="px-4 py-2 bg-blue-500 text-white  hover:bg-blue-600" >
            <option>First Year</option>
            <option>Second Year</option>
            <option>Third Year</option>
          </select>
          </div>
        
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 text-center">
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
          // Calculate the date for each day of the week
          const dateForDay = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - currentDate.getDay() + index + 1  
          );
          const dayOfMonth = dateForDay.getDate();  

          return (
            <div key={day} className="font-medium">
              {day} {dayOfMonth}
            </div>
          );
        })}

        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="border rounded-lg p-4 h-32 bg-white shadow-md"></div>
        ))}

        {days.map((dayObj) => (
          <div
            key={dayObj.day}
            className="relative border rounded-lg p-4 h-32 bg-white shadow-md"
          >
            <div className="absolute top-2 right-2 text-sm font-bold">
              {dayObj.day}
            </div>
            {events
              .filter((event) => parseInt(event.date, 10) === dayObj.day)
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