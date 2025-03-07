import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../config";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../Components/Sidebar"; // Ensure this is a default export and resolves to a valid React component
import { Link, useNavigate } from "react-router-dom";

const Courses = () => {
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [lectures, setLectures] = useState({});
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(""); // For year dropdown
  const navigate = useNavigate();

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

  // Sample years for dropdown based on the timetable structure (Third Year shown in screenshot)
  const years = ["First Year", "Second Year", "Third Year"]; // Adjust based on actual years in your database

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists() && userDoc.data().role === "teacher") {
            const teacherInfoDocRef = doc(db, "teachersinfo", user.uid);
            const teacherInfoDoc = await getDoc(teacherInfoDocRef);

            if (teacherInfoDoc.exists()) {
              const data = teacherInfoDoc.data();
              const teacherInfo = {
                name: userDoc.data().name || "",
                department: data.department || "BSc.IT", // Using department instead of course
                subject: data.subject || "GIS", // Teacher's subject
                teacherId: data.teacherId || "1000",
              };
              setTeacherData(teacherInfo);
              if (selectedYear) {
                await fetchLecturesForWeek(
                  teacherInfo.department,
                  selectedYear
                );
              }
            } else {
              setError(
                "No teacher profile found in teachersinfo. Please contact administration."
              );
              setTeacherData(null);
            }
          } else {
            setError("User is not a teacher or profile not found.");
            setTeacherData(null);
          }
        } catch (error) {
          setError(error.message || "Failed to fetch teacher data");
          setTeacherData(null);
        }
      } else {
        setError("Please log in to view your timetable");
        setTeacherData(null);
        setLectures({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedYear]);

  const getCachedLectures = (department, year) => {
    const cacheKey = `teacher-lectures-${department}-${year}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, expiry } = JSON.parse(cachedData);
      if (expiry > Date.now()) {
        return data;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
    return null;
  };

  const cacheLectures = (department, year, data, expiryInMinutes = 60) => {
    const cacheKey = `teacher-lectures-${department}-${year}`;
    const expiry = Date.now() + expiryInMinutes * 60 * 1000;
    localStorage.setItem(cacheKey, JSON.stringify({ data, expiry }));
  };

  const fetchLecturesForWeek = async (department, year) => {
    setLoading(true);
    const cachedData = getCachedLectures(department, year);
    if (cachedData) {
      setLectures(cachedData);
      setLoading(false);
      return;
    }

    let weekLectures = {};
    try {
      for (let day of daysOfWeek) {
        const docRef = doc(db, `timetable/${department}/${year}/${day}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          weekLectures[day] = Array.isArray(data.lectures) ? data.lectures : [];
        } else {
          weekLectures[day] = [];
        }
      }
      setLectures(weekLectures);
      cacheLectures(department, year, weekLectures);
    } catch (error) {
      setError(error.message || "Failed to fetch timetable data");
      setLectures({});
    }
    setLoading(false);
  };

  const renderSkeleton = () => (
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

  // Handle navigation to Add Day Timetable
  const handleAddDayTimetable = () => {
    navigate("/AddDayTimetable");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed w-64 bg-gray-900 text-white h-screen overflow-y-auto border-0 outline-0">
        <Sidebar />
      </div>

      {/* Main Content with Margin for Fixed Sidebar */}
      <div className="flex-1 p-6 ml-64 bg-gray-100 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/teacher-dashboard">
            <h1 className="text-5xl font-bold mb-8 text-green-500">
              TIMETABLE
            </h1>
          </Link>
          <p className="text-xl text-gray-600">Today's Date: {formattedDate}</p>
        </div>
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
                Error: {error}
              </div>
            )}

            {teacherData ? (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      Name: {teacherData.name}, Department:{" "}
                      {teacherData.department}, Subject: {teacherData.subject}
                    </p>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="mt-2 p-2 border rounded"
                    >
                      <option value="">Select Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddDayTimetable}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Add Day Timetable
                  </button>
                </div>

                {Object.keys(lectures).length > 0 &&
                Object.values(lectures).some((arr) => arr.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {daysOfWeek.map((day) => {
                      const lecturesForDay = lectures[day] || [];
                      return (
                        <div
                          key={day}
                          className="border rounded-lg bg-white shadow-md p-4 flex flex-col"
                        >
                          <h2 className="text-lg font-bold text-center">
                            {day}
                          </h2>
                          {lecturesForDay.length > 0 ? (
                            lecturesForDay.map((lecture, idx) => (
                              <div
                                key={idx}
                                className="text-sm bg-green-300 p-2 rounded-lg mb-2"
                              >
                                <strong>{lecture.timeSlot}</strong> -{" "}
                                {lecture.subject}
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
                ) : (
                  <div className="text-center text-gray-500">
                    {selectedYear
                      ? "No timetable data available for this year"
                      : "Please select a year to view the timetable"}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                Unable to load teacher data
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;
