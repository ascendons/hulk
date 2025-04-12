import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../authContext";
import Sidebar from "../Components/Sidebar";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import supabase from "../../supabaseclient"; // Import Supabase client

const AssignmentMarks = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [marks, setMarks] = useState({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State for preview modal
  const [previewUrl, setPreviewUrl] = useState(null); // State for preview URL

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

        if (assignmentList.length > 0) {
          setSelectedAssignmentId(assignmentList[0].id);
        } else {
          setError("No assignments found.");
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
        setSubmissions([]);
        setStudents([]);
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

        const submissionsRef = collection(db, "submissions");
        const submissionQuery = query(
          submissionsRef,
          where("assignmentId", "==", selectedAssignmentId)
        );
        const submissionSnapshot = await getDocs(submissionQuery);

        let submissionList = [];
        if (!submissionSnapshot.empty) {
          // Fetch teacherId for each submission
          submissionList = await Promise.all(
            submissionSnapshot.docs.map(async (submissionDoc) => {
              const submissionData = submissionDoc.data();
              // Fetch the corresponding assignment to get the teacherId
              const assignmentRef = doc(
                db,
                "assignments",
                submissionData.assignmentId
              );
              const assignmentDoc = await getDoc(assignmentRef);
              const teacherId = assignmentDoc.exists()
                ? assignmentDoc.data().teacherId || "N/A"
                : "N/A";

              return {
                id: submissionDoc.id,
                ...submissionData,
                teacherId: teacherId,
              };
            })
          );
          console.log("Fetched submissions with teacherId:", submissionList);

          const studentIds = [
            ...new Set(submissionList.map((sub) => sub.studentId.trim())),
          ];
          console.log("Extracted studentIds:", studentIds);

          if (studentIds.length === 0) {
            console.log("No student IDs found in submissions.");
            setSubmissions(submissionList);
            setStudents([]);
            setIsLoading(false);
            return;
          }

          // Fetch student details
          const studentsRef = collection(db, "students");
          const studentQueries = studentIds.map((studentId) =>
            query(studentsRef, where("userId", "==", studentId))
          );
          const studentSnapshots = await Promise.all(
            studentQueries.map(async (q, index) => {
              try {
                const snapshot = await getDocs(q);
                console.log(
                  `Student query ${index} result:`,
                  snapshot.docs.map((doc) => doc.data())
                );
                return snapshot;
              } catch (err) {
                console.error(`Error in student query ${index}:`, err);
                return { docs: [] };
              }
            })
          );
          const studentList = studentSnapshots
            .flatMap((snapshot) => snapshot.docs)
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          console.log("Fetched students:", studentList);

          // Fetch user details for email
          const usersRef = collection(db, "users");
          const userQueries = studentIds.map((studentId) =>
            query(usersRef, where("uid", "==", studentId))
          );
          const userSnapshots = await Promise.all(
            userQueries.map(async (q, index) => {
              try {
                const snapshot = await getDocs(q);
                console.log(
                  `User query ${index} result:`,
                  snapshot.docs.map((doc) => doc.data())
                );
                return snapshot;
              } catch (err) {
                console.error(`Error in user query ${index}:`, err);
                return { docs: [] };
              }
            })
          );
          const userList = userSnapshots
            .flatMap((snapshot) => snapshot.docs)
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          console.log("Fetched users:", userList);

          // Debug: Check if the user is found for the studentId
          studentIds.forEach((studentId) => {
            const user = userList.find((u) => u.uid === studentId);
            console.log(`User for studentId ${studentId}:`, user);
          });

          // Merge student and user data
          const mergedStudents = studentList.map((student) => {
            const user = userList.find((u) => u.uid === student.userId);
            const submission = submissionList.find(
              (sub) => sub.studentId === student.userId
            );
            return {
              ...student,
              name: submission ? submission.studentName : "Unknown",
              email: user ? user.email : "N/A",
              phoneNumber: student.phoneNumber || "N/A",
            };
          });

          // Initialize marks state with existing marks (if any)
          const initialMarks = submissionList.reduce((acc, sub) => {
            acc[sub.id] = sub.marks || "";
            return acc;
          }, {});
          setMarks(initialMarks);

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

  // Function to handle marks submission
  const handleSubmitMarks = async (submissionId) => {
    const marksValue = marks[submissionId];
    if (!marksValue || marksValue < 0 || marksValue > 100) {
      setError("Please enter a valid marks value between 0 and 100.");
      return;
    }

    try {
      const submissionRef = doc(db, "submissions", submissionId);
      await updateDoc(submissionRef, {
        marks: parseInt(marksValue, 10),
      });
      console.log(
        `Marks updated for submission ${submissionId}: ${marksValue}`
      );

      // Update the local submissions state to reflect the change
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.id === submissionId
            ? { ...sub, marks: parseInt(marksValue, 10) }
            : sub
        )
      );
      setError("");
    } catch (error) {
      console.error("Error updating marks:", error);
      setError("Failed to update marks: " + error.message);
    }
  };

  // Function to handle marks input change
  const handleMarksChange = (submissionId, value) => {
    setMarks((prevMarks) => ({
      ...prevMarks,
      [submissionId]: value,
    }));
  };

  // Function to handle preview
  const handlePreview = async (filePath) => {
    try {
      console.log("Fetching file from Supabase with filePath:", filePath);
      const { data, error } = await supabase.storage
        .from("student-submissions")
        .createSignedUrl(filePath, 60); // Signed URL valid for 60 seconds

      if (error) {
        console.error("Error fetching file from Supabase:", error);
        setError("Failed to fetch file for preview: " + error.message);
        return;
      }

      const url = data.signedUrl;
      console.log("Fetched signed URL:", url);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Unexpected error fetching file from Supabase:", err);
      setError("Unexpected error fetching file for preview.");
    }
  };

  // Function to close the preview modal
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    console.log("Preview modal closed");
  };

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
                  {assignment.title ||
                    assignment.subject ||
                    "Untitled Assignment"}
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
                        <strong>Email:</strong> {student.email || "N/A"}
                      </p>

                      <p>
                        <strong>Course:</strong> {student.course || "N/A"}
                      </p>
                      <p>
                        <strong>Division:</strong> {student.division || "N/A"}
                      </p>
                      <p>
                        <strong>Year:</strong> {student.year || "N/A"}
                      </p>
                      <p>
                        <strong>Submitted At:</strong>{" "}
                        {submission
                          ? new Date(submission.submittedAt).toLocaleString()
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Teacher ID:</strong>{" "}
                        {submission ? submission.teacherId : "N/A"}
                      </p>
                      <p className="flex items-center space-x-2">
                        <strong>Submission:</strong>{" "}
                        {submission && submission.filePath ? (
                          <button
                            onClick={() => handlePreview(submission.filePath)}
                            className="text-blue-500 underline hover:text-blue-700"
                          >
                            View Preview
                          </button>
                        ) : (
                          "No file available"
                        )}
                      </p>
                      <p className="flex items-center space-x-2">
                        <strong>Marks:</strong>{" "}
                        <input
                          type="number"
                          value={marks[submission.id] || ""}
                          onChange={(e) =>
                            handleMarksChange(submission.id, e.target.value)
                          }
                          placeholder="Enter marks"
                          className="w-20 p-1 border rounded"
                          min="0"
                          max="100"
                        />
                        <button
                          onClick={() => handleSubmitMarks(submission.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Submit Marks
                        </button>
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

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Submission Preview
              </h2>
              <button
                onClick={closePreview}
                className="text-red-500 hover:text-red-700 text-lg font-bold"
              >
                ×
              </button>
            </div>
            {previewUrl && typeof previewUrl === "string" ? (
              previewUrl.endsWith(".pdf") ||
              previewUrl.includes("application/pdf") ? (
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="600px"
                  className="rounded-lg"
                  title="PDF Preview"
                  onError={(e) => {
                    console.error("Iframe error:", e);
                    alert(
                      "Failed to preview PDF. The file may be corrupted, blocked, or inaccessible."
                    );
                  }}
                />
              ) : /\.(jpg|jpeg|png|gif)$/i.test(previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="Submission Preview"
                  className="w-full h-auto rounded-lg"
                  title="Image Preview"
                  aria-label="Image Preview"
                  onError={(e) => {
                    console.error("Image error:", e);
                    alert(
                      "Failed to preview image. The file may be corrupted or blocked."
                    );
                  }}
                />
              ) : (
                <p className="text-gray-600">
                  Preview not available for this file type.
                </p>
              )
            ) : (
              <p className="text-red-500">
                Error: Invalid file URL for preview.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentMarks;
