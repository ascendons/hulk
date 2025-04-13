import React, { useEffect, useState, useContext } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../authContext";
import Sidebar from "../Components/Sidebar";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import supabase from "../../supabaseclient";
import { ToastContainer, toast } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import toastify styles

// File type detection helper
const getFileType = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    console.log("getFileType: Invalid filePath:", filePath);
    return "unknown";
  }
  const extension = filePath.split(".").pop()?.toLowerCase();
  console.log("getFileType: Extension detected:", extension);
  if (["jpg", "jpeg", "png", "gif"].includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (["doc", "docx", "txt", "ppt", "pptx"].includes(extension))
    return "document";
  return "unknown";
};

// Preview Modal Component
const PreviewModal = ({ isOpen, onClose, url, fileType }) => {
  const [previewError, setPreviewError] = useState(null);

  console.log("PreviewModal props:", { isOpen, url, fileType });

  if (!isOpen) return null;

  const handleError = () => {
    console.log("PreviewModal: Error loading content for URL:", url);
    setPreviewError(
      "Failed to load preview. The file may be inaccessible or corrupted."
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Submission Preview
          </h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 text-lg font-bold"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
        {previewError ? (
          <p className="text-red-500">{previewError}</p>
        ) : url && typeof url === "string" ? (
          fileType === "pdf" ? (
            <iframe
              src={url}
              width="100%"
              height="600px"
              className="rounded-lg"
              title="PDF Preview"
              onError={handleError}
            />
          ) : fileType === "image" ? (
            <img
              src={url}
              alt="Submission Preview"
              className="w-full h-auto rounded-lg"
              title="Image Preview"
              onError={handleError}
            />
          ) : fileType === "document" ? (
            <p className="text-gray-600">
              Preview not available for this file type.{" "}
              <a
                href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                  url
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Try viewing in Google Docs Viewer
              </a>
            </p>
          ) : (
            <p className="text-gray-600">
              Preview not available for this file type.
            </p>
          )
        ) : (
          <p className="text-red-500">Error: Invalid file URL for preview.</p>
        )}
      </div>
    </div>
  );
};

const AssignmentMarks = () => {
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [marks, setMarks] = useState({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFileType, setPreviewFileType] = useState(null);

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
          submissionList = await Promise.all(
            submissionSnapshot.docs.map(async (submissionDoc) => {
              const submissionData = submissionDoc.data();
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

          studentIds.forEach((studentId) => {
            const user = userList.find((u) => u.uid === studentId);
            console.log(`User for studentId ${studentId}:`, user);
          });

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

  const handleMarksChange = (submissionId, value) => {
    setMarks((prevMarks) => ({
      ...prevMarks,
      [submissionId]: value,
    }));
  };

  const handleSubmitAllMarks = async () => {
    const invalidMarks = submissions.some((submission) => {
      const marksValue = marks[submission.id];
      return (
        !marksValue || marksValue === "" || marksValue < 0 || marksValue > 100
      );
    });

    if (invalidMarks) {
      setError(
        "Please enter valid marks (between 0 and 100) for all students."
      );
      return;
    }

    try {
      const batch = writeBatch(db);

      submissions.forEach((submission) => {
        const submissionRef = doc(db, "submissions", submission.id);
        const marksValue = parseInt(marks[submission.id], 10);
        batch.update(submissionRef, { marks: marksValue });
      });

      await batch.commit();
      console.log("All marks submitted successfully.");

      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) => ({
          ...sub,
          marks: parseInt(marks[sub.id], 10),
        }))
      );
      setError("");
      toast.success("Marks submitted successfully for all students!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error submitting marks for all students:", error);
      setError("Failed to submit marks: " + error.message);
      toast.error("Failed to submit marks: " + error.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handlePreview = async (filePath) => {
    try {
      console.log("Fetching file from Supabase with filePath:", filePath);
      const fileType = getFileType(filePath);
      console.log("Detected file type:", fileType);

      const { data, error } = await supabase.storage
        .from("student-submissions")
        .createSignedUrl(filePath, 300);

      if (error) {
        console.error("Error fetching file from Supabase:", error);
        setError("Failed to fetch file for preview: " + error.message);
        return;
      }

      const url = data.signedUrl;
      console.log("Fetched signed URL:", url);
      setPreviewUrl(url);
      setPreviewFileType(fileType);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Unexpected error fetching file from Supabase:", err);
      setError("Unexpected error fetching file for preview.");
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewFileType(null);
    console.log("Preview modal closed");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-56 bg-blue-800 text-white h-screen fixed top-0 left-0 overflow-y-auto">
        <Sidebar />
      </div>

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
              <>
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
                        </p>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmitAllMarks}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Submit Marks for All Students
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-center">
                No submissions found for this assignment.
              </p>
            )}
          </div>
        )}
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        url={previewUrl}
        fileType={previewFileType}
      />

      {/* Add ToastContainer to render toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default AssignmentMarks;
