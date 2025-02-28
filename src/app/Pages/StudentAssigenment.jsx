import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../authContext";
import StudentSidebar from "../Components/StudentSidebar";
import supabase from "../../supabaseclient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Progress } from "reactstrap";

const CACHE_KEY = "student_assignments_cache";
const CACHE_EXPIRY = 5 * 60 * 1000;

const StudentAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [studentData, setStudentData] = useState({ course: "", division: "", year: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [submissions, setSubmissions] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError("");

      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const student = querySnapshot.docs[0].data();
          setStudentData({
            course: student.course || "",
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
    const fetchAssignmentsAndSubmissions = async () => {
      if (!studentData.course || !user) return;

      setIsLoading(true);
      setError("");

      try {
        // Fetch assignments
        const assignmentsRef = collection(db, "assignments");
        const q = query(
          assignmentsRef,
          where("department", "==", studentData.course),
          where("division", "==", studentData.division),
          where("year", "==", studentData.year)
        );
        const querySnapshot = await getDocs(q);

        let fetchedAssignments = [];
        if (!querySnapshot.empty) {
          fetchedAssignments = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const assignmentData = doc.data();
              if (assignmentData.filePath) {
                const { data: fileData, error: fileError } = await supabase.storage
                  .from("assignments")
                  .getPublicUrl(assignmentData.filePath);

                if (fileError) {
                  console.error("Error fetching file URL from Supabase:", fileError);
                  return { id: doc.id, ...assignmentData, fileURL: null };
                }
                return { id: doc.id, ...assignmentData, fileURL: fileData.publicUrl };
              }
              return { id: doc.id, ...assignmentData };
            })
          );
          setAssignments(fetchedAssignments);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: fetchedAssignments, timestamp: new Date().getTime() })
          );
        }

        // Fetch submitted assignments with timestamps
        const submissionsRef = collection(db, "submissions");
        const submissionQuery = query(submissionsRef, where("studentId", "==", user.uid));
        const submissionSnapshot = await getDocs(submissionQuery);
        const submissionData = {};
        submissionSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          submissionData[data.assignmentId] = {
            submittedAt: data.submittedAt,
            filePath: data.filePath,
          };
        });
        setSubmissions(submissionData);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch assignments or submissions: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentsAndSubmissions();
  }, [studentData, user]);

  const handleUploadClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
    setSelectedFile(null);
    setUploadError("");
    setUploadProgress(0);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log("Selected file:", file);
    if (file) {
      if (!file.type || file.type !== "application/pdf") {
        setUploadError("Only PDF files are allowed.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError("File size must be less than 5MB.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedAssignment || !selectedFile) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(1); // Start progress bar immediately
      const filePath = `${user.uid}/${selectedAssignment.id}/${selectedFile.name}`;

      // Set up progress tracking
      const uploadProgressCallback = (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        setUploadProgress(percentage);
        console.log(`Upload progress: ${percentage}%`);
      };

      // Upload file to Supabase with progress tracking
      const { data, error: uploadError } = await supabase.storage
        .from("student-submissions")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: uploadProgressCallback,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error("Upload failed: " + uploadError.message);
      }

      console.log("File uploaded successfully:", data);

      // Save submission metadata to Firestore
      const submittedAt = new Date().toISOString();
      await addDoc(collection(db, "students-submissions"), {
        studentId: user.uid,
        assignmentId: selectedAssignment.id,
        filePath,
        submittedAt,
      });

      // Update submissions state
      setSubmissions({
        ...submissions,
        [selectedAssignment.id]: { submittedAt, filePath },
      });

      handleModalClose();
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000); // Auto-close after 3 seconds
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error.message || "Failed to upload file. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0); // Reset progress after completion
    }
  };

  const isAssignmentSubmitted = (assignmentId) => {
    return !!submissions[assignmentId];
  };

  const getSubmissionDateTime = (assignmentId) => {
    if (submissions[assignmentId]) {
      const date = new Date(submissions[assignmentId].submittedAt);
      return date.toLocaleString(); // Formats as "MM/DD/YYYY, HH:MM:SS AM/PM"
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
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
      <div className="flex-grow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ASSIGNMENTS</h1>
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
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-300 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-lg font-bold text-gray-700">{assignment.title}</h2>
                <p className="text-sm text-gray-600">
                  Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">Marks: {assignment.marks}</p>
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
                {isAssignmentSubmitted(assignment.id) && (
                  <p className="text-sm text-green-600">
                    Submitted: {getSubmissionDateTime(assignment.id)}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    className={`px-4 py-2 rounded-md text-white ${
                      isAssignmentSubmitted(assignment.id)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                    onClick={() => !isAssignmentSubmitted(assignment.id) && handleUploadClick(assignment)}
                    disabled={isAssignmentSubmitted(assignment.id)}
                  >
                    {isAssignmentSubmitted(assignment.id) ? "Submitted" : "Upload"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">No assignments available.</p>
          </div>
        )}
      </div>

      {isModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Upload Assignment</h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Course:</span> {studentData.course}
              </div>
              <div>
                <span className="font-semibold">Year:</span> {studentData.year}
              </div>
              <div>
                <span className="font-semibold">Division:</span> {studentData.division}
              </div>
              <div>
                <span className="font-semibold">Subject:</span> {selectedAssignment.title}
              </div>
              <div>
                <label className="font-semibold block mb-1">Upload File:</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
                {(uploadProgress > 0 || isLoading) && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Uploading...</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-white bg-orange-500 text-sm">
                        {uploadProgress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-red-500 to-orange-400 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress || 0}%` }}
                      >
                        <div
                          className="h-2.5 bg-gray-200 opacity-0"
                          style={{ width: `${100 - (uploadProgress || 0)}%` }}
                        >
                          {Array.from({ length: 10 }, (_, i) => (
                            <span
                              key={i}
                              className="inline-block w-1 h-2 bg-gray-300 mx-0.5"
                              style={{ opacity: i < (uploadProgress || 0) / 10 ? 0 : 1 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Note: Only PDF files are allowed (max 5MB).
                </p>
              </div>
              {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300"
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Confirm Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          Assignment uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;