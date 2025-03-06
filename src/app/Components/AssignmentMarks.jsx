import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../authContext";
import Sidebar from "../Components/Sidebar"; // Assuming Sidebar for teachers
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AssignmentMarks = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all assignments to populate the dropdown
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        console.log("Fetching all assignments...");
        const assignmentsRef = collection(db, "assignments");
        const querySnapshot = await getDocs(assignmentsRef);
        const assignmentList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched assignments:", assignmentList);
        setAssignments(assignmentList);

        // Optionally set the first assignment as the default selected one
        if (assignmentList.length > 0) {
          setSelectedAssignmentId(assignmentList[0].id);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError("Failed to fetch assignments: " + error.message);
      }
    };

    fetchAssignments();
  }, []);

  // Fetch submissions and students for the selected assignment
  useEffect(() => {
    const fetchSubmissionsAndStudents = async () => {
      if (!user || !user.uid) {
        console.log("User data unavailable:", user);
        setError("User not authenticated or data missing.");
        setIsLoading(false);
        return;
      }

      if (!selectedAssignmentId) {
        console.log("No assignment selected, skipping fetch...");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        console.log(
          "Fetching submissions for assignmentId:",
          selectedAssignmentId
        );

        // Query submissions for the selected assignment
        const submissionsRef = collection(db, "students-submissions");
        const submissionQuery = query(
          submissionsRef,
          where("assignmentId", "==", selectedAssignmentId)
        );
        const submissionSnapshot = await getDocs(submissionQuery);

        let submissionList = [];
        if (!submissionSnapshot.empty) {
          submissionList = submissionSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Fetched submissions:", submissionList);

          // Extract unique studentIds from submissions
          const studentIds = [
            ...new Set(submissionList.map((sub) => sub.studentId)),
          ];
          console.log("Extracted studentIds:", studentIds);

          // Fetch student details for each studentId
          const studentsRef = collection(db, "students");
          const studentQueries = studentIds.map((studentId) =>
            query(studentsRef, where("userId", "==", studentId))
          );
          const studentSnapshots = await Promise.all(
            studentQueries.map(getDocs)
          );
          const studentList = studentSnapshots
            .flatMap((snapshot) => snapshot.docs)
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          console.log("Fetched students:", studentList);

          // Fetch user details for names using uid
          const usersRef = collection(db, "users");
          const userQueries = studentIds.map(
            (studentId) => query(usersRef, where("uid", "==", studentId)) // Ensure uid matches studentId
          );
          const userSnapshots = await Promise.all(userQueries.map(getDocs));
          const userList = userSnapshots
            .flatMap((snapshot) => snapshot.docs)
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          console.log("Fetched users:", userList);

          // Merge student and user data
          const mergedStudents = studentList.map((student) => {
            const user = userList.find((u) => u.uid === student.userId);
            return {
              ...student,
              name: user ? user.name : student.name || "Unknown", // Fallback to student.name if user.name is missing
            };
          });

          setSubmissions(submissionList);
          setStudents(mergedStudents);
        } else {
          console.log(
            "No submissions found for assignmentId:",
            selectedAssignmentId
          );
          setSubmissions([]);
          setStudents([]);
        }
      } catch (error) {
        console.error("Error fetching submissions and students:", error);
        setError("Failed to fetch submissions and students: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionsAndStudents();
  }, [user, selectedAssignmentId]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Fixed Sidebar */}
      <div className="w-56 bg-blue-800 text-white h-screen fixed top-0 left-0 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Main Content with margin to account for fixed sidebar */}
      <div className="flex-grow ml-56 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-5xl font-bold text-green-500">
            ASSIGNMENT MARKS
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <Skeleton height={30} width={150} className="mb-4" />
            <Skeleton count={3} />
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <h2 className="text-xl font-semibold mb-4">Select Assignment</h2>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            >
              <option value="">Select an Assignment</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title || assignment.subject}
                </option>
              ))}
            </select>

            <h2 className="text-xl font-semibold mb-4">Submitted Students</h2>
            {submissions.length > 0 && students.length > 0 ? (
              <ul className="space-y-4">
                {students.map((student) => {
                  const submission = submissions.find(
                    (sub) => sub.studentId === student.userId
                  );
                  return (
                    <li key={student.id} className="border-b py-2">
                      <p>
                        <strong>Name:</strong> {student.name || "Unknown"}
                      </p>
                      <p>
                        <strong>Roll No:</strong> {student.rollno || "N/A"}
                      </p>
                      <p>
                        <strong>Submitted At:</strong>{" "}
                        {submission
                          ? new Date(submission.submittedAt).toLocaleString()
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Marks:</strong>{" "}
                        <input
                          type="number"
                          placeholder="Enter marks"
                          className="w-20 p-1 border rounded"
                          min="0"
                          max="100"
                        />
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600 text-center">
                No submissions found for this assignment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentMarks;
