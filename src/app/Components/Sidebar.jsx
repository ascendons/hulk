import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="h-screen  bg-gray-800 text-white p-4">
      <h1 className="text-lg font-bold mb-4">Education Dashboard</h1>
      <ul>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/home">Dashboard</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/Notices">Notices</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/courses">Timetable</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/students">Students</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/Teachers">Teachers</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/Attendance">Attendance</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">Exam</li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/addstudent">addStudents</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/addteacher">AddTeacher</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
