import React, { useState } from "react";
import Sidebar from "../Components/Sidebar"; // Import Sidebar component
import ListStudents from "./ListStudents"; // Import ListStudents component
import Attendance from "./Attendance"; // Import Attendance component

const Students = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // State for Sidebar hover
  const [showList, setShowList] = useState(false); // State to toggle ListStudents visibility
  const [showAttendance, setShowAttendance] = useState(false); // State to toggle Attendance visibility
  const [selectedClass, setSelectedClass] = useState("Class 1"); // State for selected class
  const [selectedDivision, setSelectedDivision] = useState("A"); // State for selected division

  const handleSeeListClick = () => {
    setShowList(!showList); // Toggle the visibility of the ListStudents component
    setShowAttendance(false); // Hide Attendance if it's visible
  };

  const handleMarkAttendanceClick = () => {
    setShowAttendance(!showAttendance); // Toggle the visibility of the Attendance component
    setShowList(false); // Hide ListStudents if it's visible
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
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
      <div className="flex-1 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Select Class</h1>
          <div className="flex space-x-4">
            {/* Class Dropdown */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
            </select>

            {/* Division Dropdown */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
              <option value="D">Division D</option>
            </select>
          </div>
        </div>

        {/* Main Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* See List */}
          <div
            className="bg-white border rounded-lg shadow-md p-6 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 cursor-pointer"
            onClick={handleSeeListClick} // Toggle the list
          >
            SEE LIST
          </div>

          {/* Mark Attendance */}
          <div
            className="bg-white border rounded-lg shadow-md p-6 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 cursor-pointer"
            onClick={handleMarkAttendanceClick} // Toggle the attendance
          >
            MARK ATTENDANCE
          </div>

          {/* Notes */}
          <div className="bg-white border rounded-lg shadow-md p-6 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 cursor-pointer">
            NOTES
          </div>
        </div>

        {/* ListStudents Component */}
        {showList && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Students in {selectedClass}, Division {selectedDivision}
            </h2>
            <ListStudents
              selectedClass={selectedClass}
              selectedDivision={selectedDivision}
            />
          </div>
        )}

        {/* Attendance Component */}
        {showAttendance && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Mark Attendance for {selectedClass}, Division {selectedDivision}
            </h2>
            <Attendance
              selectedClass={selectedClass}
              selectedDivision={selectedDivision}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
