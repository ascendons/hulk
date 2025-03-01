import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for navigation after logout
import {
  signOut, // Import signOut from Firebase auth
} from "firebase/auth";
import { auth } from "../../config"; // Import Firebase auth from your config
import {
  LayoutDashboard,
  Bell,
  Calendar,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Notebook,
  UserPlus,
  BookmarkPlus,
  BookPlus,
} from "lucide-react";

const StudentSidebar = () => {
  const navigate = useNavigate(); // Added useNavigate for navigation

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user from Firebase
      console.log("User logged out successfully");
      navigate("/signup"); // Redirect to the signup/login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to logout. Please try again."); // Optional: Display an error message
    }
  };

  return (
    <div className="h-screen bg-gray-800 text-white w-96 p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center">
          <LayoutDashboard className="mr-2 text-orange-500" />
          CLASSMATE
        </h1>
      </div>

      {/* Navigation Links */}
      <ul className="flex-grow space-y-2">
        <li>
          <Link
            to="/student-dashboard"
            className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <LayoutDashboard className="mr-3 text-orange-500" />
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/student-notice"
            className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Bell className="mr-3 text-orange-500" />
            Notices
          </Link>
        </li>
        <li>
          <Link
            to="/student-timetable"
            className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Calendar className="mr-3 text-orange-500" />
            Timetable
          </Link>
        </li>

        <li>
          <Link
            to="/StudentAttendance"
            className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <ClipboardList className="mr-3 text-orange-500" />
            Attendance
          </Link>
        </li>
        <li>
          <Link
            to="/StudentNotes"
            className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FileText className="mr-3 text-orange-500" />
            Notes
          </Link>
        </li>
        <li>
          <Link
            to="/StudentAssignments"
            className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FileText className="mr-3 text-orange-500" />
            Assignment
          </Link>
        </li>

        {/* Logout Button */}
        <li className="mt-auto">
          {" "}
          {/* Pushes the logout button to the bottom */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mr-3 text-orange-500 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default StudentSidebar;
