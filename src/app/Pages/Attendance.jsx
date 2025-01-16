import React, { useState } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../config";

const MarkAttendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState("Bsc.IT");
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [date, setDate] = useState("");
  const [lectureName, setLectureName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log("Fetching students for:");
      console.log("Class:", selectedClass);
      console.log("Division:", selectedDivision);
      console.log("Year:", selectedYear);
  
      const q = query(
        collection(db, "students"),
        where("studentcourse", "==", selectedClass),
        where("division", "==", selectedDivision),
        where("studentyear", "==", selectedYear)
      );
  
      console.log("Query created:", q);
  
      const querySnapshot = await getDocs(q);
      console.log("Query snapshot:", querySnapshot);
  
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
      console.log("Fetched students:", fetchedStudents);
  
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

  const handleAttendanceChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleSaveAttendance = async () => {
    if (!date || !lectureName || !startTime || !endTime) {
      alert("Please fill in all the fields!");
      return;
    }

    if (students.length === 0) {
      alert("No students fetched to save attendance.");
      return;
    }

    try {
      const attendanceData = {
        date,
        lectureName,
        startTime,
        endTime,
        records: students.map((student) => ({
          studentId: student.id,
          studentName: student.studentname,
          rollNo: student.studentrollno,
          attendance: attendance[student.id],
        })),
      };

      await addDoc(collection(db, "attendance"), attendanceData);
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error.message);
      alert("Failed to save attendance. Please try again.");
    }
  };

  

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Mark Attendance</h1>
      <div className="flex gap-4 mb-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="Bsc.IT">Bsc.IT</option>
          <option value="BCOM">BCOM</option>
          <option value="BMS">BMS</option>
        </select>
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="First Year">First Year</option>
          <option value="Second Year">Second Year</option>
          <option value="Third Year">Third Year</option>
        </select>
        <button
          onClick={fetchStudents}
          className={`px-4 py-2 ${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          } text-white rounded-lg`}
          disabled={loading}
        >
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {isDataFetched && (
        <>
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Select Lecture"
              value={lectureName}
              onChange={(e) => setLectureName(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <table className="table-auto w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">ID NO</th>
                <th className="px-4 py-2">NAME</th>
                <th className="px-4 py-2">ROLL NO</th>
                <th className="px-4 py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="px-4 py-2">{student.studentid}</td>
                  <td className="px-4 py-2">{student.studentname}</td>
                  <td className="px-4 py-2">{student.studentrollno}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-lg ${
                        attendance[student.id] === "Present"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() =>
                        handleAttendanceChange(student.id, "Present")
                      }
                    >
                      Present
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg ${
                        attendance[student.id] === "Absent"
                          ? "bg-red-500 text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() =>
                        handleAttendanceChange(student.id, "Absent")
                      }
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleSaveAttendance}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Attendance
          </button>
        </>
      )}
    </div>
  );
};

export default MarkAttendance;