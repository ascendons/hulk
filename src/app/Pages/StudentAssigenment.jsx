// src/components/StudentAssignments.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config"; // Import Firestore instance
import { AuthContext } from "../../authContext"; // Import your authentication context
import StudentSidebar from "../Components/StudentSidebar"; // Import StudentSidebar component
import supabase from "../../supabaseclient"; // Import Supabase client

const CACHE_KEY = "student_assignments_cache"; // Key for localStorage
const CACHE_EXPIRY = 5 * 60 * 1000; // Cache expiry time (5 minutes)

const StudentAssignments = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const { user } = useContext(AuthContext);

  // Fetch student data (course, division, year) from Firestore
  const [studentData, setStudentData] = useState({
    course: "",
    division: "",
    year: "",
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError("");

      try {
        const studentsRef = collection(db, "students"); // Use "students" collection as per your screenshot
        const q = query(studentsRef, where("userId", "==", user.uid)); // Query by userId from AuthContext
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const student = querySnapshot.docs[0].data();
          setStudentData({
            course: student.course || "", // Use "course" as per your screenshot (equivalent to department)
            division: student.division || "",
            year: student.year || "",
          });
        } else {
          setError("Student data not found. Please contact support.");
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("Failed to fetch student data. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!studentData.course) return; // Wait until we have student data

      // Check if cached data exists and is not expired
      const cachedData = localStorage.getItem(CACHE_KEY);
      const now = new Date().getTime();

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (now - timestamp < CACHE_EXPIRY) {
          setAssignments(data);
          setIsLoading(false);
          return; // Use cached data
        }
      }

      setIsLoading(true);
      setError("");

      try {
        const assignmentsRef = collection(db, "assignments");
        const q = query(
          assignmentsRef,
          where("department", "==", studentData.course), // Filter by course (department)
          where("division", "==", studentData.division), // Filter by division
          where("year", "==", studentData.year) // Filter by year
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No assignments found for this student.");
        } else {
          const fetchedAssignments = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const assignmentData = doc.data();

              // Fetch file URL from Supabase Storage
              if (assignmentData.filePath) {
                const { data: fileData, error: fileError } =
                  await supabase.storage
                    .from("assignments") // Supabase bucket name
                    .getPublicUrl(assignmentData.filePath);

                if (fileError) {
                  console.error(
                    "Error fetching file URL from Supabase:",
                    fileError
                  );
                  return {
                    id: doc.id,
                    ...assignmentData,
                    fileURL: null, // Set to null if there's an error
                  };
                }

                return {
                  id: doc.id,
                  ...assignmentData,
                  fileURL: fileData.publicUrl, // Add file URL to the assignment data
                };
              }

              return {
                id: doc.id,
                ...assignmentData,
              };
            })
          );

          setAssignments(fetchedAssignments);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: fetchedAssignments, timestamp: now })
          );
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError("Failed to fetch assignments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [studentData]); // Fetch data when studentData changes

  return (
    <div className="min-h-screen bg-gray-100 flex">
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

      <div className="flex-grow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ASSIGNMENTS</h1>
          {/* Removed Create Assignment button as requested */}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">Loading assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-300 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/assignment/${assignment.id}`)} // Use navigate here
              >
                <h2 className="text-lg font-bold text-gray-700">
                  {assignment.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Marks: {assignment.marks}
                </p>
                {assignment.fileURL && (
                  <a
                    href={assignment.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    Download File
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">
              No assignments available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;
