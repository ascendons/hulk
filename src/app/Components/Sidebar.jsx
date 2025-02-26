import React from "react";
import { Link } from "react-router-dom";
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

const Sidebar = () => {
  return (
    <div className="h-screen bg-gray-800 text-white w-64 p-6 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center">
          <LayoutDashboard className="mr-2 text-green-400" />
          College Dashboard
        </h1>
      </div>

      {/* Navigation Links */}
      <ul className="flex-grow space-y-2">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <LayoutDashboard className="mr-3 text-green-400" />
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/Notices"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Bell className="mr-3 text-green-400" />
            Notices
          </Link>
        </li>
        <li>
          <Link
            to="/courses"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Calendar className="mr-3 text-green-400" />
            Timetable
          </Link>
        </li>
        <li>
          <Link
            to="/students"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Users className="mr-3 text-green-400" />
            Students
          </Link>
        </li>
        <li>
          <Link
            to="/Teachers"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <BookOpen className="mr-3 text-green-400" />
            Teachers
          </Link>
        </li>
        <li>
          <Link
            to="/Attendance"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ClipboardList className="mr-3 text-green-400" />
            Attendance
          </Link>
        </li>
        <li>
          <Link
            to="/Notes"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText className="mr-3 text-green-400" />
            Notes
          </Link>
        </li>
        <li>
          <Link
            to="/assignment"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText className="mr-3 text-green-400" />
            Assignment
          </Link>
        </li>
        <li>
          <Link
            to="/addstudent"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <UserPlus className="mr-3 text-green-400" />
            Add Students
          </Link>
        </li>
        <li>
          <Link
            to="/addteacher"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <BookmarkPlus className="mr-3 text-green-400" />
            Add Teacher
          </Link>
        </li>
        <li>
          <Link
            to="/Addsubjects"
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <BookPlus className="mr-3 text-green-400" />
            Add Subjects
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
