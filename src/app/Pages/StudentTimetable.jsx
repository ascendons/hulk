import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../config";
import { onAuthStateChanged } from "firebase/auth";
import StudentSidebar from "../Components/StudentSidebar";
import { Link } from "react-router-dom";

const StudentTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [lectures, setLectures] = useState({});
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed. Current User:", user);
      if (user) {
        try {
          console.log("Fetching student data for UID:", user.uid);
          const studentDocRef = doc(db, "students", user.uid);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
            const data = studentDoc.data();
            console.log("Student data found:", data);
            const studentInfo = {
              year: data.year,
              course: data.course,
              division: data.division,
            };

            if (!studentInfo.year) {
              throw new Error("Missing required student data field: year");
            }

            setStudentData(studentInfo);
            await fetchLecturesForWeek(studentInfo.year);
          } else {
            console.log("No student document found for UID:", user.uid);
            setError(
              "No student profile found. Please contact administration."
            );
            setStudentData(null);
          }
        } catch (error) {
          console.error("Error in fetch process:", error);
          setError(error.message || "Failed to fetch student data");
          setStudentData(null);
        }
      } else {
        console.log("No authenticated user found");
        setError("Please log in to view your timetable");
        setStudentData(null);
        setLectures({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCachedLectures = (year) => {
    const cacheKey = `lectures-${year}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, expiry } = JSON.parse(cachedData);
      if (expiry > Date.now()) {
        console.log("Using cached lectures:", data);
        return data;
      } else {
        console.log("Cache expired, removing:", cacheKey);
        localStorage.removeItem(cacheKey);
      }
    }
    console.log("No valid cache found for:", cacheKey);
    return null;
  };

  const cacheLectures = (year, data, expiryInMinutes = 60) => {
    const cacheKey = `lectures-${year}`;
    const expiry = Date.now() + expiryInMinutes * 60 * 1000;
    localStorage.setItem(cacheKey, JSON.stringify({ data, expiry }));
    console.log("Cached lectures:", data);
  };

  const fetchLecturesForWeek = async (year) => {
    setLoading(true);
    console.log("Fetching lectures for year:", year);

    // Check cache first
    const cachedData = getCachedLectures(year);
    if (cachedData) {
      setLectures(cachedData);
      setLoading(false);
      return;
    }

    let weekLectures = {};
    try {
      for (let day of daysOfWeek) {
        const timetableQuery = query(
          collection(db, "timetable", year), // Only use year in the collection path
          where("day", "==", day)
        );
        const querySnapshot = await getDocs(timetableQuery);

        console.log(`Query results for ${day}:`, {
          docsCount: querySnapshot.docs.length,
          docs: querySnapshot.docs.map((doc) => doc.data()),
        });

        weekLectures[day] = querySnapshot.docs
          .map((doc) => {
            const lectures = doc.data().lectures || [];
            console.log(`${day} lectures:`, lectures);
            return lectures;
          })
          .flat();
      }
      console.log("Final week lectures:", weekLectures);
      setLectures(weekLectures);
      cacheLectures(year, weekLectures);
    } catch (error) {
      console.error("Error fetching lectures:", error);
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-gray-900 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <StudentSidebar />
      </div>

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <Link to="/student-dashboard">
            <h1 className="text-3xl font-bold mb-8 text-blue-600">TIMETABLE</h1>
          </Link>
          <p className="text-xl text-gray-600">{`Today's Date: ${formattedDate}`}</p>
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

            {studentData ? (
              <>
                <div className="mb-6">
                  <p className="text-lg font-semibold text-gray-800">
                    Course: {studentData.course}, Year: {studentData.year},
                    Division: {studentData.division}
                  </p>
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
                                className="text-sm bg-green-100 p-2 rounded-lg mb-2"
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
                    No timetable data available for your year
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                Unable to load student data
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;