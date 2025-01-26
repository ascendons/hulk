import React, { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const SeeAttendance = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Sidebar hover state
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallAttendance, setOverallAttendance] = useState({
    percentage: 0,
    present: 0,
    total: 0,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a student's name to search.");
      return;
    }

    setIsLoading(true);
    setAttendanceRecords([]); // Clear previous data
    setOverallAttendance({ percentage: 0, present: 0, total: 0 });

    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);

      if (querySnapshot.empty) {
        alert("No attendance records found for this student.");
      } else {
        const fetchedRecords = [];
        let totalPresent = 0;
        let totalSessions = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.attendance) {
            const studentRecords = data.attendance.filter(
              (record) => record.name.trim() === searchQuery.trim()
            );
            fetchedRecords.push(...studentRecords);

            // Calculate overall attendance stats
            studentRecords.forEach((record) => {
              totalSessions++;
              if (record.status === "P") totalPresent++; // Count "P" for present
            });
          }
        });

        if (fetchedRecords.length > 0) {
          setAttendanceRecords(fetchedRecords);
          setOverallAttendance({
            percentage:
              totalSessions > 0
                ? Math.round((totalPresent / totalSessions) * 100)
                : 0,
            present: totalPresent,
            total: totalSessions,
          });
        } else {
          alert("No attendance records found for this student.");
        }
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      alert("Failed to fetch attendance records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
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
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-8 text-blue-600">
          SEE ATTENDANCE
        </h1>

        {/* Search Bar and Button */}
        <div className="flex items-center w-full  mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the student"
            className="flex-grow p-4 border border-gray-300 rounded-l-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="p-4 bg-green-600 text-white rounded-r-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Attendance Data */}
        {attendanceRecords.length > 0 && (
          <div className="mt-6 w-full  bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Attendance</h2>
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-semibold">
                Overall: {overallAttendance.percentage}% (
                {overallAttendance.present}/{overallAttendance.total})
              </p>
            </div>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-200">Subject</th>
                  <th className="px-4 py-2 border border-gray-200">%</th>
                  <th className="px-4 py-2 border border-gray-200">Present</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.reduce((subjects, record) => {
                  const subject = subjects[record.subject] || {
                    name: record.subject,
                    present: 0,
                    total: 0,
                  };

                  subject.total += 1;
                  if (record.status === "P") subject.present += 1;

                  subjects[record.subject] = subject;
                  return subjects;
                }, {}) &&
                  Object.entries(
                    attendanceRecords.reduce((subjects, record) => {
                      const subject = subjects[record.subject] || {
                        name: record.subject,
                        present: 0,
                        total: 0,
                      };

                      subject.total += 1;
                      if (record.status === "P") subject.present += 1;

                      subjects[record.subject] = subject;
                      return subjects;
                    }, {})
                  ).map(([subject, { present, total }]) => (
                    <tr key={subject} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200">
                        {subject}
                      </td>
                      <td className="px-4 py-2 border border-gray-200">
                        {Math.round((present / total) * 100)}%
                      </td>
                      <td className="px-4 py-2 border border-gray-200">
                        {present}/{total}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeeAttendance;
