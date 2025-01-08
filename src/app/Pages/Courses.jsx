import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";

const Courses = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [lectures, setLectures] = useState({});
  const [selectedCourse, setSelectedCourse] = useState("Third Year");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchLecturesForWeek();
  }, [selectedCourse]);

  const fetchLecturesForWeek = async () => {
    let weekLectures = {};
    try {
      for (let day of daysOfWeek) {
        const normalizedDay = day.toLowerCase();
        const allLecturesForDay = [];
        const docRef = doc(db, `timetable/Bsc.IT/${selectedCourse}/${day}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          allLecturesForDay.push(...(data.lectures || []));
        }
        weekLectures[day] = allLecturesForDay;
      }
      console.log("Fetched Lectures:", weekLectures);  
      setLectures(weekLectures);
    } catch (error) {
      console.error("Error fetching lectures for the week:", error);
    }
  };

  const handleCourseChange = (course) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div>
          <p className="text-xl text-gray-600">{`Today's Date: ${formattedDate}`}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Edit Timetable
        </button>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="px-4 py-2 bg-white border rounded-md shadow-md hover:bg-gray-200"
          >
            {selectedCourse}
          </button>
          {isDropdownOpen && (
            <ul className="absolute mt-2 bg-white border rounded-md shadow-md w-40 z-10">
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCourseChange("All Courses")}
              >
                All Courses
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCourseChange("First Year")}
              >
                First Year
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCourseChange("Second Year")}
              >
                Second Year
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCourseChange("Third Year")}
              >
                Third Year
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Weekly Timetable */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day) => {
          const lecturesForDay = lectures[day] || [];
          return (
            <div
              key={day}
              className="border rounded-lg bg-white shadow-md p-4 flex flex-col"
            >
              <h2 className="text-lg font-bold text-center">{day}</h2>
              {lecturesForDay.length > 0 ? (
                lecturesForDay.map((lecture, idx) => (
                  <div
                    key={idx}
                    className="text-sm bg-green-100 p-2 rounded-lg mb-2"
                  >
                    <strong>{lecture.timeSlot}</strong> - {lecture.subject}
                    <div className="text-gray-600">
                      {lecture.teacher} ({lecture.location})
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">No lectures</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;