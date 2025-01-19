import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const [loading, setLoading] = useState(true);
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
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLecturesForWeek();
  }, [selectedCourse]);

  const renderSkeleton = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day, idx) => (
          <div
            key={idx}
            className="border rounded-lg bg-gray-200 p-4 h-24 animate-pulse"
          >
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  };

  // Function to get cached data from localStorage
  const getCachedLectures = (course) => {
    const cachedData = localStorage.getItem(`lectures-${course}`);
    if (cachedData) {
      const { data, expiry } = JSON.parse(cachedData);
      if (expiry > Date.now()) {
        return data;
      } else {
        localStorage.removeItem(`lectures-${course}`); // Remove expired data
      }
    }
    return null;
  };

  // Function to cache data in localStorage with an expiry time
  const cacheLectures = (course, data, expiryInMinutes = 60) => {
    const expiry = Date.now() + expiryInMinutes * 60 * 1000;
    localStorage.setItem(
      `lectures-${course}`,
      JSON.stringify({ data, expiry })
    );
  };

  const fetchLecturesForWeek = async () => {
    setLoading(true);

    const cachedData = getCachedLectures(selectedCourse);
    if (cachedData) {
      setLectures(cachedData);
      setLoading(false);
      return;
    }

    let weekLectures = {};
    try {
      for (let day of daysOfWeek) {
        const docRef = doc(db, `timetable/Bsc.IT/${selectedCourse}/${day}`);
        const docSnap = await getDoc(docRef);
        weekLectures[day] = docSnap.exists() ? docSnap.data().lectures || [] : [];
      }
      setLectures(weekLectures);
      cacheLectures(selectedCourse, weekLectures); // Cache the fetched data
    } catch (error) {
      console.error("Error fetching lectures:", error);
    }
    setLoading(false);
  };

  const handleCourseChange = (course) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <a href="/home">
            <h1 className="text-3xl font-bold">Courses</h1>
          </a>
          <div>
            <p className="text-xl text-gray-600">{`Today's Date: ${formattedDate}`}</p>
          </div>
        </div>

        {/* Dropdown and Edit Timetable Button */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/edittimetable")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Edit Timetable
          </button>
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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

        {/* Weekly Timetable or Skeleton Loader */}
        {loading ? (
          renderSkeleton()
        ) : (
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
                    <p className="text-center text-gray-500 text-sm">
                      No lectures
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;