import React, { useEffect, useState, useContext, Suspense } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config";
import { AuthContext } from "../../authContext";
import StudentSidebar from "../Components/StudentSidebar";
import supabase from "../../supabaseclient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CACHE_KEY = "student_assignments_cache";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

// File type detection helper
const getFileType = (url) => {
  if (!url || typeof url !== "string") {
    console.log("getFileType: Invalid URL:", url);
    return "unknown";
  }
  const extension = url.split(".").pop()?.toLowerCase();
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
            Attachment Preview
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
        ) : fileType === "pdf" ? (
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
            alt="Attachment Preview"
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
        )}
      </div>
    </div>
  );
};

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentData, setStudentData] = useState({
    name: "",
    department: "",
    division: "",
    year: "",
    subjects: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [submissions, setSubmissions] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFileType, setPreviewFileType] = useState(null);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    console.log("Assignments state updated:", assignments);
  }, [assignments]);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("assignments")
          .list();
        if (error) {
          console.error("Supabase connectivity test failed:", error);
          setError(
            "Cannot connect to Supabase. Check your network or Supabase configuration."
          );
        } else {
          console.log("Supabase connectivity test successful:", data);
        }
      } catch (err) {
        console.error("Unexpected error during Supabase test:", err);
        setError("Unexpected error connecting to Supabase.");
      }
    };
    testSupabase();
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || !user.uid || !user.email) {
        console.log("User data unavailable:", user);
        setError("User not authenticated or data missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        console.log("Fetching student data for userId:", user.uid);
        const studentsRef = collection(db, "students");
        const studentQuery = query(
          studentsRef,
          where("userId", "==", user.uid)
        );
        const studentSnapshot = await getDocs(studentQuery);

        if (studentSnapshot.empty) {
          console.log("No student document found for userId:", user.uid);
          setError(
            "Student data not found. Please ensure your profile is set up."
          );
          setIsLoading(false);
          return;
        }

        const student = studentSnapshot.docs[0].data();
        console.log("Fetched student data:", student);

        if (!student.department && !student.course) {
          console.warn(
            "Student document missing department/course field:",
            student
          );
          setError("Student profile incomplete: Department/Course is missing.");
          setIsLoading(false);
          return;
        }

        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("email", "==", user.email));
        const userSnapshot = await getDocs(userQuery);

        let studentName = "Unknown";
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          studentName = userData.name || user.displayName || "Unknown";
          console.log("Fetched user data:", userData);
        } else {
          console.warn(
            "User not found in users collection for email:",
            user.email
          );
        }

        const updatedStudentData = {
          name: studentName,
          department: student.course || student.department || "",
          division: student.division || "",
          year: student.year || "",
          subjects: student.subjects || [],
        };
        console.log("Setting studentData:", updatedStudentData);
        setStudentData(updatedStudentData);
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
      if (!user) {
        console.log("User not available:", user);
        setError("User not authenticated.");
        setIsLoading(false);
        return;
      }

      if (
        !studentData.department ||
        !studentData.division ||
        !studentData.year
      ) {
        console.log("Student data incomplete:", studentData);
        setError(
          "Incomplete student data. Please ensure your profile is complete."
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        console.log("Fetching assignments with parameters:", {
          department: studentData.department,
          division: studentData.division,
          year: studentData.year,
        });
        const assignmentsRef = collection(db, "assignments");
        const q = query(
          assignmentsRef,
          where("department", "==", studentData.department),
          where("division", "==", studentData.division),
          where("year", "==", studentData.year)
        );
        const querySnapshot = await getDocs(q);
        console.log("Firestore query snapshot size:", querySnapshot.size);
        querySnapshot.forEach((doc) => {
          console.log("Assignment document:", doc.id, doc.data());
        });

        let fetchedAssignments = [];
        if (!querySnapshot.empty) {
          fetchedAssignments = querySnapshot.docs.map((doc) => {
            const assignmentData = doc.data();
            // Extract URLs from fileURLs array of objects
            const fileURLs = Array.isArray(assignmentData.fileURLs)
              ? assignmentData.fileURLs
                  .map((file) =>
                    file && typeof file === "object" && file.url
                      ? file.url
                      : null
                  )
                  .filter((url) => typeof url === "string")
              : [];
            return {
              id: doc.id,
              ...assignmentData,
              dueDate: assignmentData.dueDate
                ? new Date(assignmentData.dueDate).toISOString()
                : null,
              timestamp: assignmentData.timestamp
                ? assignmentData.timestamp.toDate().toISOString()
                : null,
              fileURLs,
              fileTypes: fileURLs.map(getFileType),
            };
          });
          console.log(
            "Fetched assignments before setting state:",
            fetchedAssignments
          );
          setAssignments(fetchedAssignments);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: fetchedAssignments,
              timestamp: new Date().getTime(),
            })
          );
        } else {
          console.log("No assignments found for query with parameters:", {
            department: studentData.department,
            division: studentData.division,
            year: studentData.year,
          });
          setAssignments([]);
        }

        const submissionsRef = collection(db, "submissions");
        const submissionQuery = query(
          submissionsRef,
          where("studentId", "==", user.uid)
        );
        const submissionSnapshot = await getDocs(submissionQuery);
        const submissionData = {};
        submissionSnapshot.forEach((doc) => {
          const data = doc.data();
          submissionData[data.assignmentId] = {
            submittedAt: data.submittedAt,
            filePath: data.filePath,
            marks: data.marks,
          };
        });
        console.log("Fetched submissions:", submissionData);
        setSubmissions(submissionData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "Failed to fetch assignments or submissions: " + error.message
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (
      studentData.department &&
      studentData.division &&
      studentData.year &&
      user
    ) {
      console.log(
        "fetchAssignmentsAndSubmissions triggered with dependencies:",
        {
          department: studentData.department,
          division: studentData.division,
          year: studentData.year,
          user: user,
        }
      );
      fetchAssignmentsAndSubmissions();
    }
  }, [studentData.department, studentData.division, studentData.year, user]);

  const handleUploadClick = (assignment) => {
    if (!isAssignmentSubmitted(assignment.id)) {
      setSelectedAssignment(assignment);
      setIsModalOpen(true);
    }
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
      if (file.size > 5 * 1024 * 1024) {
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
      setUploadProgress(1);
      const filePath = `${user.uid}/${selectedAssignment.id}/${selectedFile.name}`;

      const uploadProgressCallback = (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        setUploadProgress(percentage);
        console.log(`Upload progress: ${percentage}%`);
      };

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

      const submittedAt = new Date().toISOString();
      await addDoc(collection(db, "submissions"), {
        studentId: user.uid,
        assignmentId: selectedAssignment.id,
        filePath,
        submittedAt,
        studentName: studentData.name,
        department: studentData.department,
        division: studentData.division,
        year: studentData.year,
      });

      const subjectName =
        selectedAssignment.subject || selectedAssignment.title;
      if (!subjectName) {
        console.warn(
          "Subject name is missing for assignment:",
          selectedAssignment
        );
        throw new Error("Subject name is required for the assignment.");
      }

      const subjectsRef = collection(db, "subjects");
      const subjectQuery = query(
        subjectsRef,
        where("subject", "==", subjectName),
        where("department", "==", studentData.department),
        where("division", "==", studentData.division),
        where("year", "==", studentData.year)
      );
      const subjectSnapshot = await getDocs(subjectQuery);

      if (subjectSnapshot.empty) {
        await addDoc(collection(db, "subjects"), {
          subject: subjectName,
          department: studentData.department,
          division: studentData.division,
          year: studentData.year,
          subjects: studentData.subjects,
          assignmentId: selectedAssignment.id,
          createdAt: new Date().toISOString(),
        });
        console.log(`Added new subject "${subjectName}" to Firestore.`);
      } else {
        const subjectDoc = subjectSnapshot.docs[0];
        await setDoc(
          doc(db, "subjects", subjectDoc.id),
          {
            ...subjectDoc.data(),
            assignmentId: selectedAssignment.id,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log(`Updated existing subject "${subjectName}" in Firestore.`);
      }

      setSubmissions({
        ...submissions,
        [selectedAssignment.id]: { submittedAt, filePath },
      });

      handleModalClose();
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (error) {
      console.error("Error uploading file or saving subject:", error);
      setUploadError(
        error.message ||
          "Failed to upload file or save subject. Please try again."
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const isAssignmentSubmitted = (assignmentId) => {
    return !!submissions[assignmentId];
  };

  const getSubmissionDateTime = (assignmentId) => {
    if (submissions[assignmentId]) {
      const date = new Date(submissions[assignmentId].submittedAt);
      return date.toLocaleString();
    }
    return null;
  };

  const getSubmissionMarks = (assignmentId) => {
    if (
      submissions[assignmentId] &&
      submissions[assignmentId].marks !== undefined
    ) {
      return submissions[assignmentId].marks;
    }
    return null;
  };

  const handlePreview = (url) => {
    console.log("handlePreview called with URL:", url);
    const fileType = getFileType(url);
    console.log("Detected file type:", fileType);
    setPreviewUrl(url);
    setPreviewFileType(fileType);
    setIsPreviewOpen(true);
    console.log("Preview modal should open with:", { url, fileType });
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewFileType(null);
    console.log("Preview modal closed");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Suspense fallback={<div>Loading Sidebar...</div>}>
        <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0">
          <StudentSidebar />
        </div>
      </Suspense>
      <div className="flex-grow ml-56 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-500">ASSIGNMENTS</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <Skeleton height={30} width={150} className="mb-4" />
            <Skeleton count={3} />
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-lg font-bold text-gray-800">
                  {assignment.subject || assignment.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Due Date:{" "}
                  {assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Marks: {assignment.marks || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Attachments:</span>{" "}
                  {assignment.fileURLs && assignment.fileURLs.length > 0 ? (
                    assignment.fileURLs.map((url, index) => (
                      <span key={index} className="inline-block mr-2">
                        {url && typeof url === "string" && (
                          <button
                            onClick={() => handlePreview(url)}
                            className="text-blue-500 underline hover:text-blue-700"
                          >
                            View Preview
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span>No attachments</span>
                  )}
                </p>
                {isAssignmentSubmitted(assignment.id) && (
                  <>
                    <p className="text-sm text-green-600">
                      Submitted: {getSubmissionDateTime(assignment.id)}
                    </p>
                    {getSubmissionMarks(assignment.id) !== null && (
                      <p className="text-sm text-blue-600">
                        Obtained Marks: {getSubmissionMarks(assignment.id)}
                      </p>
                    )}
                  </>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isAssignmentSubmitted(assignment.id)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                    onClick={
                      !isAssignmentSubmitted(assignment.id)
                        ? () => handleUploadClick(assignment)
                        : undefined
                    }
                    disabled={isAssignmentSubmitted(assignment.id)}
                  >
                    {isAssignmentSubmitted(assignment.id)
                      ? "Submitted"
                      : "Upload"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-center">
              No assignments available.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Upload Assignment</h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Student Name:</span>{" "}
                {studentData.name}
              </div>
              <div>
                <span className="font-semibold">Department:</span>{" "}
                {studentData.department}
              </div>
              <div>
                <span className="font-semibold">Year:</span> {studentData.year}
              </div>
              <div>
                <span className="font-semibold">Division:</span>{" "}
                {studentData.division}
              </div>
              <div>
                <span className="font-semibold">Subject:</span>{" "}
                {selectedAssignment.subject || selectedAssignment.title}
              </div>
              <div>
                <span className="font-semibold">Subjects Enrolled:</span>{" "}
                {studentData.subjects.length > 0
                  ? studentData.subjects.join(", ")
                  : "None"}
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
                              style={{
                                opacity: i < (uploadProgress || 0) / 10 ? 0 : 1,
                              }}
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
              {uploadError && (
                <p className="text-red-500 text-sm">{uploadError}</p>
              )}
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          Assignment uploaded successfully!
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        url={previewUrl}
        fileType={previewFileType}
      />
    </div>
  );
};

export default StudentAssignments;
