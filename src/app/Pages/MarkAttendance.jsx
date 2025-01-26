import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../config";
import { Users } from "lucide-react";

const MarkAttendance = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState("Bsc.IT");
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [lectureName, setLectureName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "students"),
        where("studentcourse", "==", selectedClass),
        where("division", "==", selectedDivision),
        where("studentyear", "==", selectedYear)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("No students found for the selected filters.");
        setStudents([]);
        setAttendance({});
        setIsDataFetched(false);
        return;
      }

      const fetchedStudents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(fetchedStudents);

      const initialAttendance = {};
      fetchedStudents.forEach((student) => {
        initialAttendance[student.id] = "Present";
      });
      setAttendance(initialAttendance);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Error fetching students:", error.message);
      alert("Failed to fetch students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const q = query(
        collection(db, "subjects"),
        where("department", "==", selectedClass)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const fetchedSubjects = querySnapshot.docs.map((doc) => doc.data());
        setSubjects(fetchedSubjects);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error.message);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedClass]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleSaveAttendance = async () => {
    if (!lectureName || !startTime || !endTime) {
      alert("Please fill in all the fields!");
      return;
    }

    if (students.length === 0) {
      alert("No students fetched to save attendance.");
      return;
    }

    try {
      const attendanceData = students.map((student) => ({
        date,
        name: student.studentname,
        rollNo: student.studentrollno,
        subject: lectureName,
        status: attendance[student.id],
      }));

      await addDoc(collection(db, "studentAttendance"), {
        attendance: attendanceData,
      });

      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error.message);
      alert("Failed to save attendance. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-gray-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {/* <Users className="text-3xl md:text-4xl text-gray-400 mr-2" /> */}
            <h1 className="text-3xl font-bold mb-8 text-blue-600">
              MARK ATTENDANCE
            </h1>
          </div>
          <div className="hidden md:flex gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="Bsc.IT">Bsc.IT</option>
              <option value="BCOM">BCOM</option>
              <option value="BMS">BMS</option>
            </select>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
            </select>
            <button
              onClick={fetchStudents}
              className={`px-4 py-2 ${
                loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
              } text-white rounded-lg`}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        {isDataFetched && (
          <>
            {/* Date, Lecture, Time */}
            <div className="flex flex-wrap gap-2 md:gap-4 mb-2 md:mb-4 justify-center">
              <input
                type="date"
                value={date}
                readOnly
                className="px-2 md:px-4 py-1 md:py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <select
                value={lectureName}
                onChange={(e) => setLectureName(e.target.value)}
                className="px-2 md:px-4 py-1 md:py-2 border rounded-lg bg-white"
              >
                <option value="" disabled>
                  Select Lecture
                </option>
                {subjects.map((subject, index) => (
                  <option key={index} value={subject.subjectName}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2 md:px-4 py-1 md:py-2 border rounded-lg bg-white"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-2 md:px-4 py-1 md:py-2 border rounded-lg bg-white"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-2 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold text-gray-700">
                      ID NO
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold text-gray-700">
                      NAME
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold text-gray-700">
                      ROLL NO
                    </th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold text-gray-700 text-center">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700">
                        {student.studentid}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700">
                        {student.studentname}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700">
                        {student.studentrollno}
                      </td>
                      <td className="px-4 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700 flex justify-center gap-1 md:gap-3">
                        <button
                          className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm ${
                            attendance[student.id] === "P"
                              ? "bg-green-500 text-white"
                              : "bg-gray-200"
                          }`}
                          onClick={() =>
                            handleAttendanceChange(student.id, "P")
                          }
                        >
                          Present
                        </button>
                        <button
                          className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm ${
                            attendance[student.id] === "A"
                              ? "bg-red-500 text-white"
                              : "bg-gray-200"
                          }`}
                          onClick={() =>
                            handleAttendanceChange(student.id, "A")
                          }
                        >
                          Absent
                        </button>
                        {/* <button
                          className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm ${
                            attendance[student.id] === "Late"
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-200"
                          }`}
                          onClick={() =>
                            handleAttendanceChange(student.id, "Late")
                          }
                        >
                          Late
                        </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-4 md:mt-6">
              <button
                onClick={handleSaveAttendance}
                className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Attendance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
