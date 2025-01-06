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
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">Overview</li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">
          <Link to="/courses">Courses</Link>
        </li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">Students</li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">Teachers</li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">Exam</li>
        <li className="mb-4 hover:bg-gray-700 p-2 rounded">Results</li>
      </ul>
    </div>
  );
};

export default Sidebar;
