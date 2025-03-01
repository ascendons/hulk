import React, { useState, useEffect } from "react";
import StudentSidebar from "../Components/StudentSidebar";
import { Link } from "react-router-dom";
import { User, Calendar, ClipboardList, FileText, Bell } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config";
import { renderSkeleton } from "../Components/reactSkelton";
// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";

const StudentDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleMouseEnter = () => {
    setIsSidebarOpen(true);
  };

  const handleMouseLeave = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed, user:", user);
      if (user) {
        try {
          const studentDocRef = doc(db, "students", user.uid);
          console.log("Fetching student data for UID:", user.uid);
          const studentDoc = await getDoc(studentDocRef);

          const data = studentDoc.data();

          const userdocRef = doc(db, "users", data.userId);
          const userdoc = await getDoc(userdocRef);

          if (studentDoc.exists()) {
            console.log("Student document found:", studentDoc.data());
            const userData = userdoc.data();
            setStudentData({
              name: userData.name || "Student Name",
              department: data.department || "Department",
              course: data.course || "Course",
              division: data.division || "Division",
              year: data.year || "Year",
              rollNo: data.rollno || "Roll No",
              phoneNumber: data.phonenumber || "Phone Number",
            });
          } else {
            console.error("No student document found for UID:", user.uid);
            setStudentData({
              name: "Student Name",
              department: data.department || "Department",
              course: data.course || "Course",
              division: data.division || "Division",
              year: data.year || "Year",
              rollNo: data.rollno || "Roll No",
              phoneNumber: data.phonenumber || "Phone Number",
            });
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
          setStudentData({
            name: "Student Name",
            department: "Department",
            course: "Course",
            division: "Division",
            year: "Year",
            rollNo: "Roll No",
            phoneNumber: "Phone Number",
          });
        }
      } else {
        console.log("No user authenticated");
        setStudentData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // return (
    //   <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    //     Loading...
    //   </div>
    // );
    return renderSkeleton();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar (slides out on hover over its hidden position) */}
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
        <h1 className="text-3xl font-bold text-orange-500 mb-6">Dashboard</h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
              <User className="text-gray-500" size={24} />
            </div>
            <div>
              <p className="text-gray-800 font-semibold">
                Welcome back,{" "}
                <p className="text-orange-500 font-semibold">Student!</p>
              </p>
              <p className="text-gray-600">Student Name: {studentData?.name}</p>
              <p className="text-gray-600">Department: {studentData?.course}</p>
              <p className="text-gray-600">Role: Student</p>
            </div>
          </div>
          <Link
            to="/view-profile"
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            View Profile
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-blue-600">15</p>
            <p className="text-gray-600">Total Classes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-green-500">85%</p>
            <p className="text-gray-600">Attendance</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-purple-500">12</p>
            <p className="text-gray-600">Total Notes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-yellow-500">8</p>
            <p className="text-gray-600">Assignments</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Link
            to="/student-timetable"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <Calendar className="mr-2" size={18} /> Timetable
          </Link>
          <Link
            to="/StudentAttendance"
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-center hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <ClipboardList className="mr-2" size={18} /> Attendance
          </Link>
          <Link
            to="/StudentNotes"
            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-600 transition-colors flex items-center justify-center"
          >
            <FileText className="mr-2" size={18} /> Notes
          </Link>
          <Link
            to="/StudentAssignments"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-center hover:bg-orange-600 transition-colors flex items-center justify-center"
          >
            <Bell className="mr-2" size={18} /> Assignments
          </Link>
        </div>

        {/* Notice Board */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Notice Board
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">New testing notice</p>
              <p className="text-gray-500 text-sm">By: </p>
              <p className="text-gray-700">Hellownladiskdidad a dakdald</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
