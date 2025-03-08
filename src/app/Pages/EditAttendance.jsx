import React, { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const EditAttendance = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Bsc.IT");
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [date, setDate] = useState("");
  const [lecture, setLecture] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!date || !lecture) {
      alert("Please select a date and lecture.");
      return;
    }

    setLoading(true);
    setStudents([]);

    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);

      const fetchedStudents = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attendance) {
          data.attendance.forEach((record) => {
            if (record.date === date && record.subject === lecture) {
              fetchedStudents.push({
                id: record.rollNo,
                name: record.name,
                rollNo: record.rollNo,
                status: record.status,
              });
            }
          });
        }
      });

      if (fetchedStudents.length === 0) {
        alert("No attendance records found for the selected date and lecture.");
      } else {
        setStudents(fetchedStudents);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      alert("Failed to fetch attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.rollNo === studentId ? { ...student, status } : student
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!students.length) {
      alert("No students to save attendance for.");
      return;
    }

    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);

      querySnapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data.attendance) {
          const updatedAttendance = data.attendance.map((record) => {
            const student = students.find(
              (student) => student.rollNo === record.rollNo
            );
            return student ? { ...record, status: student.status } : record;
          });

          await updateDoc(doc.ref, { attendance: updatedAttendance });
        }
      });

      alert("Attendance updated successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed w-64 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 ml-64">
        {/* Header */}
        <h1 className="text-5xl font-bold mb-8 text-green-500">
          EDIT ATTENDANCE
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-3 border rounded-md shadow-sm"
          >
            <option value="Bsc.IT">Bsc.IT</option>
            <option value="BCOM">BCOM</option>
            <option value="BMS">BMS</option>
          </select>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="p-3 border rounded-md shadow-sm"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-3 border rounded-md shadow-sm"
          >
            <option value="First Year">First Year</option>
            <option value="Second Year">Second Year</option>
            <option value="Third Year">Third Year</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border rounded-md shadow-sm"
          />
          <select
            value={lecture}
            onChange={(e) => setLecture(e.target.value)}
            className="p-3 border rounded-md shadow-sm"
          >
            <option value="" disabled>
              Select Lecture
            </option>
            <option value="SQA">SQA</option>
            <option value="Networking">Networking</option>
            <option value="Databases">Databases</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="p-3 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Students Table */}
        {students.length > 0 && (
          <>
            <table className="w-full bg-white border rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">ID NO</th>
                  <th className="p-3 text-left">NAME</th>
                  <th className="p-3 text-left">ROLL NO</th>
                  <th className="p-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="p-3">{student.id}</td>
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">{student.rollNo}</td>
                    <td className="p-3 text-center flex gap-2 justify-center">
                      <button
                        onClick={() =>
                          handleAttendanceChange(student.rollNo, "P")
                        }
                        className={`p-2 ${
                          student.status === "P"
                            ? "bg-green-500 text-white"
                            : "bg-gray-300"
                        } rounded-md`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() =>
                          handleAttendanceChange(student.rollNo, "A")
                        }
                        className={`p-2 ${
                          student.status === "A"
                            ? "bg-red-500 text-white"
                            : "bg-gray-300"
                        } rounded-md`}
                      >
                        Absent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSaveAttendance}
                className="p-4 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600"
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

export default EditAttendance;
