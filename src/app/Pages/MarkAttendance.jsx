import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config";
import { Users } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState("Bsc.IT");
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [selectedYear, setSelectedYear] = useState("Third Year");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lectureName, setLectureName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [viewType, setViewType] = useState("table");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsQuery = query(
        collection(db, "students"),
        where("course", "==", selectedClass),
        where("division", "==", selectedDivision),
        where("year", "==", selectedYear)
      );

      const studentsSnapshot = await getDocs(studentsQuery);
      if (studentsSnapshot.empty) {
        alert("No students found for the selected filters.");
        setStudents([]);
        setAttendance({});
        setIsDataFetched(false);
        return;
      }

      const fetchedStudents = await Promise.all(
        studentsSnapshot.docs.map(async (docSnapshot) => {
          const studentData = docSnapshot.data();
          const userDocRef = doc(db, "users", studentData.userId);
          const userDoc = await getDoc(userDocRef);

          return {
            id: docSnapshot.id,
            course: studentData.course,
            division: studentData.division,
            phonenumber: studentData.phonenumber,
            rollno: studentData.rollno,
            studentid: studentData.studentid,
            year: studentData.year,
            studentname: userDoc.exists() ? userDoc.data().name : "Unknown",
            email: userDoc.exists() ? userDoc.data().email : "Unknown",
            userId: studentData.userId, // Explicitly include userId from student data
          };
        })
      );

      setStudents(fetchedStudents);
      const initialAttendance = {};
      fetchedStudents.forEach((student) => {
        initialAttendance[student.id] = "A";
      });
      setAttendance(initialAttendance);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to fetch students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const subjectsQuery = query(
        collection(db, "subjects"),
        where("department", "==", selectedClass)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);
      const fetchedSubjects = subjectsSnapshot.docs.map((doc) => doc.data());
      setSubjects(fetchedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      alert("Failed to fetch subjects. Please try again.");
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedClass]);

  const handleAttendanceChange = (studentId, status) => {
    console.log(`Setting attendance for student ${studentId} to ${status}`);
    setAttendance((prevAttendance) => ({
      ...prevAttendance,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!lectureName || !startTime || !endTime) {
      toast.error("Please fill in all the fields!", {
        style: { backgroundColor: "#FF6B6B" },
      });
      return;
    }

    if (students.length === 0) {
      toast.error("No students fetched to save attendance.", {
        style: { backgroundColor: "#FF6B6B" },
      });
      return;
    }

    try {
      const attendanceData = students.map((student) => ({
        course: selectedClass,
        date: date,
        name: student.studentname,
        rollNo: student.rollno,
        status: attendance[student.id],
        subject: lectureName,
        year: selectedYear,
        userId: student.userId,
      }));

      await addDoc(collection(db, "studentAttendance"), {
        attendance: attendanceData,
      });

      toast.success("Attendance saved successfully!", {
        style: { backgroundColor: "#4A90E2", color: "#FFFFFF" },
      });

      // Redirect to AddSyllabus with data
      setTimeout(() => {
        navigate("/addsyllabus", {
          state: {
            department: selectedClass,
            year: selectedYear,
            division: selectedDivision,
            subject: lectureName,
          },
        });
      }, 2000);

      setLectureName("");
      setStartTime("");
      setEndTime("");
      setAttendance({});
    } catch (error) {
      console.error("Error saving attendance:", error.message);
      toast.error(`Firebase: Error (${error.code}).`, {
        style: { backgroundColor: "#FF6B6B" },
      });
    }
  };

  const handleLinkClick = () => {
    navigate("/attendance-report");
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex">
      <div className="fixed w-64 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        <Sidebar />
      </div>

      <div className="flex-grow p-4 md:p-6 ml-64">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-5xl font-bold mb-8 text-green-500">
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
            <button
              onClick={handleLinkClick}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Link
            </button>
          </div>
        </div>
        {isDataFetched && (
          <>
            <div className="flex flex-wrap gap-2 md:gap-4 mb-2 md:mb-4 justify-center">
              <button
                onClick={() =>
                  setViewType(viewType === "table" ? "tiles" : "table")
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {viewType === "table" ? "Tiles" : "Table"}
              </button>
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

            {viewType === "table" ? (
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
                          {student.rollno}
                        </td>
                        <td className="px-4 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700 flex justify-center gap-1 md:gap-3">
                          <button
                            className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm cursor-pointer ${
                              attendance[student.id] === "P"
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                            onClick={() =>
                              handleAttendanceChange(student.id, "P")
                            }
                          >
                            Present
                          </button>
                          <button
                            className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs md:text-sm cursor-pointer ${
                              attendance[student.id] === "A"
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                            onClick={() =>
                              handleAttendanceChange(student.id, "A")
                            }
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`w-24 h-24 rounded-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer ${
                      attendance[student.id] === "A"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                    onClick={() =>
                      handleAttendanceChange(
                        student.id,
                        attendance[student.id] === "A" ? "P" : "A"
                      )
                    }
                  >
                    {student.rollno}
                  </div>
                ))}
              </div>
            )}

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

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default MarkAttendance;
