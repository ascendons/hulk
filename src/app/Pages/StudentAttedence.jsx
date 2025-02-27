// src/components/StudentAttendance.jsx
import React, { useState, useEffect, useContext } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../authContext"; // Import your authentication context
import StudentSidebar from "../Components/StudentSidebar";

const StudentAttendance = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Sidebar hover state
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallAttendance, setOverallAttendance] = useState({
    percentage: 0,
    present: 0,
    total: 0,
  });

  const { user } = useContext(AuthContext);

  // Fetch user name from Firestore based on user.uid
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const fetchStudentName = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const usersRef = collection(db, "users"); // Use "users" collection as per your screenshot
        const q = query(usersRef, where("email", "==", user.email)); // Query by email from AuthContext
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setStudentName(userData.name || "Unknown"); // Use name from Firestore
        } else {
          setStudentName(user.email || "Unknown"); // Fallback to email if no user record found
        }
      } catch (error) {
        console.error("Error fetching student name:", error);
        setStudentName(user.email || "Unknown"); // Fallback on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentName();
  }, [user]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentName || studentName === "Unknown") return; // Ensure we have a valid name

      setIsLoading(true);
      setAttendanceRecords([]); // Clear previous data
      setOverallAttendance({ percentage: 0, present: 0, total: 0 });

      try {
        const attendanceRef = collection(db, "studentAttendance");
        const querySnapshot = await getDocs(attendanceRef);

        if (querySnapshot.empty) {
          console.log("No attendance records found.");
        } else {
          const fetchedRecords = [];
          let totalPresent = 0;
          let totalSessions = 0;

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.attendance) {
              const studentRecords = data.attendance.filter(
                (record) => record.name.trim() === studentName.trim()
              );
              fetchedRecords.push(...studentRecords);

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
            console.log("No attendance records found for this student.");
          }
        }
      } catch (error) {
        console.error("Error fetching attendance records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [studentName]); // Fetch data when the studentName changes

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
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-8 text-blue-600">
          SEE ATTENDANCE
        </h1>

        {/* Student Name */}
        <div className="mb-6">
          <input
            type="text"
            value={`NAME: ${studentName}`}
            disabled
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none"
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : /* Attendance Data */
        attendanceRecords.length > 0 ? (
          <div className="w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Attendance</h2>
            <div className="mb-4">
              <p className="text-lg font-semibold">
                Overall: {overallAttendance.percentage}% (
                {overallAttendance.present}/{overallAttendance.total})
              </p>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-200">Subject</th>
                  <th className="px-4 py-2 border border-gray-200">%</th>
                  <th className="px-4 py-2 border border-gray-200">Present</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
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
        ) : (
          <p className="text-center text-gray-600">
            No attendance records found.
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
