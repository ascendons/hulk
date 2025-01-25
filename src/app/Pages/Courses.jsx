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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6">
        {daysOfWeek.map((day, idx) => (
          <div
            key={idx}
            className="border rounded-lg bg-gray-200 p-4 h-32 animate-pulse"
          >
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  };

  const getCachedLectures = (course) => {
    const cachedData = localStorage.getItem(`lectures-${course}`);
    if (cachedData) {
      const { data, expiry } = JSON.parse(cachedData);
      if (expiry > Date.now()) {
        return data;
      } else {
        localStorage.removeItem(`lectures-${course}`);
      }
    }
    return null;
  };

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
        weekLectures[day] = docSnap.exists()
          ? docSnap.data().lectures || []
          : [];
      }
      setLectures(weekLectures);
      cacheLectures(selectedCourse, weekLectures);
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
    <div className="flex min-h-screen bg-gray-50">
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-full transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">Timetable</h1>
          <p className="text-lg text-gray-600">{`Today: ${formattedDate}`}</p>
        </div>

        {/* Dropdown and Edit Timetable */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate("/edittimetable")}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600"
          >
            Edit Timetable
          </button>
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600"
            >
              {selectedCourse}
            </button>
            {isDropdownOpen && (
              <ul className="absolute mt-2 bg-white border rounded-lg shadow-lg w-40 z-10">
                {["All Courses", "First Year", "Second Year", "Third Year"].map(
                  (course, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCourseChange(course)}
                    >
                      {course}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Weekly Timetable */}
        {loading ? (
          renderSkeleton()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6">
            {daysOfWeek.map((day) => {
              const lecturesForDay = lectures[day] || [];
              return (
                <div
                  key={day}
                  className="border rounded-lg bg-white shadow-md p-4 flex flex-col"
                >
                  <h2 className="text-lg font-bold text-center text-gray-700 mb-2">
                    {day}
                  </h2>
                  {lecturesForDay.length > 0 ? (
                    lecturesForDay.map((lecture, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-green-100 p-3 rounded-lg mb-2"
                      >
                        <strong>{lecture.timeSlot}</strong> - {lecture.subject}
                        <p className="text-gray-600 text-xs">
                          {lecture.teacher} ({lecture.location})
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No lectures</p>
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
