import React, { useState } from "react";
import { Link } from "react-router-dom";
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg lg:hidden"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative h-screen bg-gray-800 text-white w-64 p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close Button for Mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden self-end mb-4 p-2 bg-gray-700 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold flex items-center">
            <LayoutDashboard className="mr-2 text-green-400" />
            ClassMate
          </h1>
        </div>

        {/* Sidebar Links */}
        <ul className="flex-grow space-y-2">
          <li>
            <Link
              to="/dashboard"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <LayoutDashboard className="mr-3 text-green-400" />
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/Notices"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Bell className="mr-3 text-green-400" />
              Notices
            </Link>
          </li>

          <li>
            <Link
              to="/courses"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Calendar className="mr-3 text-green-400" />
              Timetable
            </Link>
          </li>

          <li>
            <Link
              to="/students"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Users className="mr-3 text-green-400" />
              Students
            </Link>
          </li>

          <li>
            <Link
              to="/Teachers"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <BookOpen className="mr-3 text-green-400" />
              Teachers
            </Link>
          </li>

          <li>
            <Link
              to="/Attendance"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <ClipboardList className="mr-3 text-green-400" />
              Attendance
            </Link>
          </li>

          <li>
            <Link
              to="/Notes"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FileText className="mr-3 text-green-400" />
              Notes
            </Link>
          </li>

          <li>
            <Link
              to="/assignment"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <School className="mr-3 text-green-400" />
              Assignments
            </Link>
          </li>

          <li>
            <Link
              to="/addstudent"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <UserPlus className="mr-3 text-green-400" />
              Add Students
            </Link>
          </li>

          <li>
            <Link
              to="/addteacher"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <BookmarkPlus className="mr-3 text-green-400" />
              Add Teacher
            </Link>
          </li>

          <li>
            <Link
              to="/Addsubjects"
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <BookPlus className="mr-3 text-green-400" />
              Add Subjects
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;