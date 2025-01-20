import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../config";

const Dashboard = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [attendance, setAttendance] = useState(75); // Placeholder for attendance data
  const [notices, setNotices] = useState([]); // Notices state

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Fetch teacher info
          const teacherQuery = query(
            collection(db, "teachersinfo"),
            where("teacheremail", "==", user.email)
          );
          const teacherSnapshot = await getDocs(teacherQuery);
          if (!teacherSnapshot.empty) {
            setTeacherInfo(teacherSnapshot.docs[0].data());
          }

          // Fetch total students
          const studentsSnapshot = await getDocs(collection(db, "students"));
          setTotalStudents(studentsSnapshot.size);

          // Fetch total teachers
          const teachersSnapshot = await getDocs(
            collection(db, "teachersinfo")
          );
          setTotalTeachers(teachersSnapshot.size);

          // Fetch total subjects
          const subjectsSnapshot = await getDocs(collection(db, "subjects"));
          setTotalSubjects(subjectsSnapshot.size);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    const fetchNotices = async () => {
      try {
        const noticesSnapshot = await getDocs(collection(db, "notices"));
        const fetchedNotices = noticesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotices(fetchedNotices);
      } catch (error) {
        console.error("Error fetching notices:", error);
      }
    };

    fetchDashboardData();
    fetchNotices();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-indigo-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6 grid grid-cols-4 gap-6">
        {/* Left Section */}
        <div className="col-span-3">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-8">Welcome, Teacher!</p>

          {/* Profile Section */}
          <div className="bg-white shadow-xl rounded-lg p-6 mb-6 flex items-center">
            {/* Photo Placeholder */}
            <div className="w-24 h-24 bg-gray-300 rounded-full mr-6 border-4 border-indigo-500"></div>

            {/* Teacher Info */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Name: {teacherInfo.teachername || "NAME"}
              </h2>
              <p className="text-gray-600 font-semibold mb-1">
                Department: {teacherInfo.department || "DEPARTMENT"}
              </p>
              <p className="text-gray-600">
                {teacherInfo.role || "Teachers Role"}
              </p>
            </div>

            {/* Edit Profile Button */}
            <button className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600">
              Edit Profile
            </button>
          </div>

          {/* Statistics Section */}
          <div className="bg-white shadow-xl rounded-lg p-6 mb-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-blue-100 text-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-3xl font-bold text-blue-700">
                  {totalStudents}
                </h2>
                <p className="text-gray-600 mt-2">Total Students</p>
              </div>
              <div className="bg-green-100 text-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-3xl font-bold text-green-700">
                  {totalTeachers}
                </h2>
                <p className="text-gray-600 mt-2">Total Teachers</p>
              </div>
              <div className="bg-red-100 text-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-3xl font-bold text-red-700">
                  {totalSubjects}
                </h2>
                <p className="text-gray-600 mt-2">Total Subjects</p>
              </div>
              <div className="bg-yellow-100 text-center p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-3xl font-bold text-yellow-700">
                  {attendance}%
                </h2>
                <p className="text-gray-600 mt-2">Attendance</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-3 gap-6">
            <button className="bg-blue-300 text-black px-6 py-4 rounded-lg font-bold hover:scale-105 transition-transform">
              TIMETABLE
            </button>
            <button className="bg-green-300 text-black px-6 py-4 rounded-lg font-bold hover:scale-105 transition-transform">
              ATTENDANCE
            </button>
            <button className="bg-purple-300 text-black px-6 py-4 rounded-lg font-bold hover:scale-105 transition-transform">
              NOTES
            </button>
          </div>
        </div>

        {/* Right Section - Notice Board */}
        <div className="col-span-1">
          <div className="bg-white shadow-xl rounded-lg p-6 h-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Notice Board
            </h2>
            {notices.length > 0 ? (
              <ul className="overflow-y-auto max-h-96">
                {notices.map((notice) => (
                  <li
                    key={notice.id}
                    className="mb-6 border-b pb-4 last:border-b-0"
                  >
                    <h3 className="text-lg font-semibold text-indigo-600">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      By: {notice.author}
                    </p>
                    <p className="text-gray-800">{notice.content}</p>
                    {notice.attachment && (
                      <a
                        href={notice.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline block mt-2"
                      >
                        View Attachment
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No notices available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
