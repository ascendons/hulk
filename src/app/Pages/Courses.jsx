import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";

const Courses = () => {
  const [lectures, setLectures] = useState({});
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to control dropdown visibility
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchLecturesForWeek();
  }, [selectedCourse]);

  const fetchLecturesForWeek = async () => {
    let weekLectures = {};
    try {
      for (let day of daysOfWeek) {
        let allLecturesForDay = [];
        if (selectedCourse === "All Courses") {
          // Fetch for all years
          const years = ["FYBSCIT", "SYBSCIT", "TYBSCIT"];
          for (let year of years) {
            const docRef = doc(db, `timetable/Bsc.IT/${year}/${day}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              allLecturesForDay.push(...data.lectures);
            }
          }
        } else {
          // Fetch for selected year only
          const docRef = doc(db, `timetable/Bsc.IT/${selectedCourse}/${day}`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            allLecturesForDay.push(...data.lectures);
          }
        }
        weekLectures[day] = allLecturesForDay;
      }
      setLectures(weekLectures);
    } catch (error) {
      console.error("Error fetching lectures for the week:", error);
    }
  };

  const handleCourseChange = (course) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false); // Close dropdown after selecting an option
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown visibility
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CALENDAR</h1>
        <div className="flex space-x-4">
          {/* Edit Time Table Button */}
          <button className="px-4 py-2 bg-white border rounded-md shadow-md hover:bg-gray-200">
            Edit Time Table
          </button>

          {/* Dropdown Button */}
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
                  onClick={() => handleCourseChange("FYBSCIT")}
                >
                  FYBSCIT
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCourseChange("SYBSCIT")}
                >
                  SYBSCIT
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCourseChange("TYBSCIT")}
                >
                  TYBSCIT
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="grid grid-cols-7 gap-4">
        {daysOfWeek.map((day) => {
          const lecturesForDay = lectures[day] || [];

          return (
            <div
              key={day}
              className="border rounded-lg bg-white shadow-md p-4 flex flex-col"
            >
              <h2 className="text-lg font-bold mb-2 text-center">{day}</h2>
              {lecturesForDay.length > 0 ? (
                lecturesForDay.map((lecture, idx) => (
                  <div
                    key={idx}
                    className="text-sm bg-green-100 p-2 rounded-lg mb-2"
                  >
                    <strong>{lecture.timeSlot}</strong> - {lecture.subject}{" "}
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
