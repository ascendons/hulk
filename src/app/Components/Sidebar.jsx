import React, { useState } from "react";
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
  UserPlus,
  BookmarkPlus,
  BookPlus,
  School,
  Menu,
  X,
} from "lucide-react";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate(); // Added useNavigate for navigation

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user from Firebase
      console.log("User logged out successfully");
      navigate("/signup"); // Redirect to the signup/login page after logout
      setIsSidebarOpen(false); // Close the sidebar on mobile after logout
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to logout. Please try again."); // Optional: Display an error message
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-lg lg:hidden"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative h-screen bg-gray-900 text-white w-64 p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close Button for Mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden self-end mb-4 p-2 bg-green-700 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold flex items-center">
            <LayoutDashboard className="mr-2 text-green-600" />
            ClassMate
          </h1>
        </div>

        {/* Sidebar Links */}
        <ul className="flex-grow space-y-2">
          <li>
            <Link
              to="/dashboard"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <LayoutDashboard className="mr-3 text-green-600" />
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/Notices"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Bell className="mr-3 text-green-600" />
              Notices
            </Link>
          </li>

          <li>
            <Link
              to="/courses"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Calendar className="mr-3 text-green-600" />
              Timetable
            </Link>
          </li>

          <li>
            <Link
              to="/students"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Users className="mr-3 text-green-600" />
              Students
            </Link>
          </li>

          <li>
            <Link
              to="/Teachers"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <BookOpen className="mr-3 text-green-600" />
              Teachers
            </Link>
          </li>

          <li>
            <Link
              to="/Attendance"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <ClipboardList className="mr-3 text-green-600" />
              Attendance
            </Link>
          </li>

          <li>
            <Link
              to="/Notes"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FileText className="mr-3 text-green-600" />
              Notes
            </Link>
          </li>

          <li>
            <Link
              to="/assignment"
              className="flex items-center p-3 rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <School className="mr-3 text-green-600" />
              Assignments
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
                className="mr-3 text-green-600 w-6 h-6"
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
    </>
  );
};

export default Sidebar;
