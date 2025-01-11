import React, { useState } from "react";

const Attendance = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const students = [
    { id: "S001", name: "John Doe", rollNo: "18" },
    { id: "S002", name: "Jane Smith", rollNo: "19" },
    { id: "S003", name: "Sam Wilson", rollNo: "20" },
    { id: "S004", name: "Chris Evans", rollNo: "21" },
    { id: "S005", name: "Emma Watson", rollNo: "22" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header Section */}
        <h1 className="text-3xl font-bold mb-6">Mark Attendance</h1>

        {/* Filters Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="date"
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Select Lecture"
          >
            <option disabled>Select Lecture</option>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
          </select>
          <input
            type="time"
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="time"
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Students Attendance Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-5 bg-gray-200 p-4 text-lg font-bold">
            <div>ID NO</div>
            <div>NAME</div>
            <div>ROLL NO</div>
            <div colSpan="3" className="text-center">
              ACTIONS
            </div>
          </div>

          {/* Student Rows */}
          {students.map((student, index) => (
            <div
              key={index}
              className={`grid grid-cols-5 p-4 items-center ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div>{student.id}</div>
              <div>{student.name}</div>
              <div>{student.rollNo}</div>
              <div className="flex justify-center space-x-2">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-400"
                  aria-label={`Mark ${student.name} Present`}
                >
                  Present
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-400"
                  aria-label={`Mark ${student.name} Absent`}
                >
                  Absent
                </button>
                <button
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400"
                  aria-label={`Mark ${student.name} Late`}
                >
                  Late
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
