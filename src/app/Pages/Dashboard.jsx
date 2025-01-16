import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../config";

const Dashboard = () => {
  const [noticeboard, setNotices] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [teacherDivision, setTeacherDivision] = useState("");
  const [totalTeachers, setTotalTeachers] = useState(0);

  useEffect(() => {
    // Fetch Notices
    const fetchNotices = async () => {
      try {
        const noticesCollection = collection(db, "notices");
        const noticesSnapshot = await getDocs(noticesCollection);
        const noticesList = noticesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotices(noticesList);
      } catch (error) {
        console.log("Error fetching notices:", error);
      }
    };

    const fetchTotalStudents = async () => {
      try {
        const studentsCollection = collection(db, "students");
        let studentsQuery;
  
        if (selectedYear) {
          studentsQuery = query(
            studentsCollection,
            where("studentyear", "==", selectedYear)
          );
        } else {
          studentsQuery = studentsCollection;  
        }
  
        const studentsSnapshot = await getDocs(studentsQuery);
        setTotalStudents(studentsSnapshot.size);  
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    const fetchTotalTeachers = async () => {
      try {
        const teachersCollection = collection(db, "teachersinfo");
        const teachersSnapshot = await getDocs(teachersCollection);
        setTotalTeachers(teachersSnapshot.size);  
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };

    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const teachersQuery = query(
            collection(db, "teachersinfo"),
            where("teacheremail", "==", user.email)
          );
          const teachersSnapshot = await getDocs(teachersQuery);
          if (!teachersSnapshot.empty) {
            const teacherData = teachersSnapshot.docs[0].data();
            setTeacherName(teacherData.teachername);
            setTeacherDepartment(teacherData.department);
            setTeacherDivision(
              teacherData.department === "BSCIT"
                ? "A"
                : teacherData.divisions[0]
            );
          } else {
            console.error("No teacher found with the given email.");
          }
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };

    fetchNotices();
    fetchTotalTeachers();
    fetchTotalStudents();
    fetchTeacherData();
  }, [selectedYear, teacherDepartment, teacherDivision]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar className="w-1/5 bg-gray-800 text-white h-full" />

      <div className="flex-grow p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Welcome {teacherName || "User"}
          </h1>
          <div className="flex space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Years</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
            </select>

            <select
              value={teacherDepartment}
              disabled
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="BSCIT">BSCIT</option>
              <option value="BCOM">BCOM</option>
              <option value="BBA">BBA</option>
            </select>

            <select
              value={teacherDivision}
              disabled={teacherDepartment === "BSCIT"}  
              onChange={(e) => setTeacherDivision(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {teacherDepartment === "BSCIT" ? (
                <option value="A">A</option>
              ) : (
                <>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                </>
              )}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-purple-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Total Students</h2>
            <p className="text-3xl font-bold">{totalStudents}</p>
          </div>
          <div className="bg-red-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Total Teachers</h2>
            <p className="text-3xl font-bold">{totalTeachers}</p>
          </div>
          <div className="bg-blue-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Total Courses</h2>
            <p className="text-3xl font-bold">15</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Faculty Room</h2>
            <p className="text-3xl font-bold">100</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <p>Graph/Chart Placeholder</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold mb-4">Course Activities</h2>
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <p className="text-2xl font-bold">75%</p>
            </div>
            <p className="text-gray-600 mt-2">Process</p>
          </div>
        </div>
      </div>

      <div className="w-1/4 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold mt-6 mb-4">Notice Board</h2>
        <ul>
          {noticeboard.map((notice) => (
            <li key={notice.id} className="mb-2">
              <h3 className="font-semibold">{notice.title}</h3>
              <p className="text-gray-600">{notice.content}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
