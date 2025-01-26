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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
      <div className="flex-grow p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {teacherInfo.teachername || "Teacher"}!
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 flex items-center">
          {/* Profile Picture Placeholder */}
          <div className="w-20 h-20 bg-gray-300 rounded-full mr-6 border-4 border-blue-500"></div>

          {/* Teacher Info */}
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800">
              {teacherInfo.teachername || "Teacher Name"}
            </h2>
            <p className="text-gray-600 font-semibold">
              Department: {teacherInfo.department || "Department"}
            </p>
            <p className="text-gray-600">{teacherInfo.role || "Role"}</p>
          </div>

          {/* Edit Profile Button */}
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            Edit Profile
          </button>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-blue-600">{totalStudents}</h2>
            <p className="text-gray-600 mt-2">Total Students</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-green-600">{totalTeachers}</h2>
            <p className="text-gray-600 mt-2">Total Teachers</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-red-600">{totalSubjects}</h2>
            <p className="text-gray-600 mt-2">Total Subjects</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-yellow-600">{attendance}%</h2>
            <p className="text-gray-600 mt-2">Attendance</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button className="bg-blue-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-600 transition-colors">
            Timetable
          </button>
          <button className="bg-green-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-green-600 transition-colors">
            Attendance
          </button>
          <button className="bg-purple-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-purple-600 transition-colors">
            Notes
          </button>
          <button className="bg-orange-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-orange-600 transition-colors">
            Assignments
          </button>
        </div>

        {/* Notice Board Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Notice Board</h2>
          {notices.length > 0 ? (
            <ul className="space-y-4">
              {notices.map((notice) => (
                <li key={notice.id} className="border-b pb-4 last:border-b-0">
                  <h3 className="text-lg font-semibold text-blue-600">
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
  );
};

export default Dashboard;