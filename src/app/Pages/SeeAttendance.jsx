import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import Modal from "react-modal";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Bind modal to the app root for accessibility
Modal.setAppElement("#root"); // Ensure your app has a root element with id="root"

const SeeAttendance = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("All"); // State to toggle between "All" and "Defaulters"
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallAttendanceByStudent, setOverallAttendanceByStudent] = useState(
    {}
  );
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setIsLoading(true);
      setAttendanceRecords([]);
      setOverallAttendanceByStudent({});

      try {
        const attendanceRef = collection(db, "studentAttendance");
        const querySnapshot = await getDocs(attendanceRef);

        const allRecords = [];
        const studentStats = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.attendance) {
            data.attendance.forEach((record) => {
              allRecords.push(record);
              const studentName = record.name.trim().toLowerCase();
              if (!studentStats[studentName]) {
                studentStats[studentName] = { present: 0, total: 0 };
              }
              studentStats[studentName].total += 1;
              if (record.status === "P") studentStats[studentName].present += 1;
            });
          }
        });

        setAttendanceRecords(allRecords);
        setOverallAttendanceByStudent(
          Object.fromEntries(
            Object.entries(studentStats).map(([name, { present, total }]) => [
              name,
              {
                percentage: total > 0 ? Math.round((present / total) * 100) : 0,
                present,
                total,
              },
            ])
          )
        );
      } catch (error) {
        console.error("Error fetching attendance records:", error);
        alert("Failed to fetch attendance records. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  const filteredRecords = searchQuery.trim()
    ? attendanceRecords.filter(
        (record) =>
          record.name.trim().toLowerCase() === searchQuery.trim().toLowerCase()
      )
    : [];

  const groupedBySubject = filteredRecords.reduce((subjects, record) => {
    const subject = subjects[record.subject] || {
      name: record.subject,
      present: 0,
      total: 0,
    };
    subject.total += 1;
    if (record.status === "P") subject.present += 1;
    subjects[record.subject] = subject;
    return subjects;
  }, {});

  const overallStats = filteredRecords.reduce(
    (stats, record) => {
      stats.total += 1;
      if (record.status === "P") stats.present += 1;
      return stats;
    },
    { present: 0, total: 0 }
  );

  // Filter students based on the filterOption
  const filteredStudents =
    filterOption === "Defaulters"
      ? Object.entries(overallAttendanceByStudent).filter(
          ([, { percentage }]) => percentage < 40 // Show students with less than 40% attendance
        )
      : Object.entries(overallAttendanceByStudent); // Show all students

  // Chart data for subject-wise attendance (Bar Chart)
  const subjectChartData = {
    labels: Object.keys(groupedBySubject).map((subject) => subject),
    datasets: [
      {
        label: "Attendance Percentage",
        data: Object.values(groupedBySubject).map(({ present, total }) =>
          total > 0 ? Math.round((present / total) * 100) : 0
        ),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart data for overall attendance (Pie Chart)
  const overallChartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [overallStats.present, overallStats.total - overallStats.present],
        backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 99, 132, 0.2)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Attendance Statistics",
      },
    },
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

        {/* Filter and Search Bar */}
        <div className="flex items-center space-x-4 mb-6">
          {/* Filter Dropdown */}
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Defaulters">Defaulters</option>
          </select>

          {/* Search Bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter student name"
            className="flex-1 p-4 border border-gray-300 rounded-l-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Attendance Data */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-lg p-6 w-full">
            <p className="text-gray-600 text-center">Loading attendance...</p>
          </div>
        ) : searchQuery.trim() ? (
          attendanceRecords.length > 0 && filteredRecords.length > 0 ? (
            <div className="mt-6 w-full bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Attendance for {searchQuery}
              </h2>
              <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-semibold">
                  Overall:{" "}
                  {overallStats.total > 0
                    ? Math.round(
                        (overallStats.present / overallStats.total) * 100
                      )
                    : 0}
                  % ({overallStats.present}/{overallStats.total})
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Show Charts
                </button>
              </div>
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border border-gray-200">
                      Subject
                    </th>
                    <th className="px-4 py-2 border border-gray-200">Date</th>
                    <th className="px-4 py-2 border border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200">
                        {record.subject}
                      </td>
                      <td className="px-4 py-2 border border-gray-200">
                        {record.date}
                      </td>
                      <td className="px-4 py-2 border border-gray-200">
                        {record.status === "P" ? "Present" : "Absent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  Subject-wise Summary
                </h3>
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border border-gray-200">
                        Subject
                      </th>
                      <th className="px-4 py-2 border border-gray-200">%</th>
                      <th className="px-4 py-2 border border-gray-200">
                        Present
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedBySubject).map(
                      ([subject, { present, total }]) => (
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
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 w-full">
              <p className="text-gray-600 text-center">
                No attendance records found for {searchQuery}.
              </p>
            </div>
          )
        ) : (
          <div className="mt-6 w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {filterOption === "Defaulters"
                ? "Defaulters List"
                : "All Students Attendance"}
            </h2>
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-200">
                    Student Name
                  </th>
                  <th className="px-4 py-2 border border-gray-200">
                    Overall %
                  </th>
                  <th className="px-4 py-2 border border-gray-200">Present</th>
                  <th className="px-4 py-2 border border-gray-200">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(
                    ([name, { percentage, present, total }]) => (
                      <tr key={name} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border border-gray-200">
                          {name}
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          {percentage}%
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          {present}
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          {total}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-2 border border-gray-200 text-center text-gray-600"
                    >
                      {filterOption === "Defaulters"
                        ? "No defaulters found."
                        : "No attendance records available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Charts */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            Attendance Charts for {searchQuery || "All Students"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart for Subject-wise Attendance */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold mb-2">
                Subject-wise Attendance
              </h3>
              <Bar data={subjectChartData} options={chartOptions} />
            </div>
            {/* Pie Chart for Overall Attendance */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold mb-2">Overall Attendance</h3>
              <Pie data={overallChartData} options={chartOptions} />
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="mt-6 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Close
          </button>
        </Modal>
      </div>
    </div>
  );
};

export default SeeAttendance;
