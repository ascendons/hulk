import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Sidebar from "../Components/Sidebar";
import FileUploadModal from "../Components/FileUploadModal";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants";
import supabase from "../../supabaseclient";

const AddAssignment = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState(""); // State for assignment title
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [division, setDivision] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState([]); // State for multiple files as an array
  const [assignedBy, setAssignedBy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for upload modal visibility
  const [fileVisibility, setFileVisibility] = useState(
    "Students can view file"
  ); // State for file visibility (shared for all files)
  const [previewFile, setPreviewFile] = useState(null); // State for the file to preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State for preview modal visibility
  const [previewError, setPreviewError] = useState(null); // State for preview errors

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          const usersSnapshot = await getDocs(usersQuery);
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            setAssignedBy(userData.name || user.email);
          }

          const teachersQuery = query(
            collection(db, "teachersinfo"),
            where("teacheremail", "==", user.email)
          );
          const teachersSnapshot = await getDocs(teachersQuery);
          if (!teachersSnapshot.empty) {
            const teacherData = teachersSnapshot.docs[0].data();
            setDepartment(teacherData.department || "");
          }
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };

    fetchTeacherData();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (!department) return;
        const q = query(
          collection(db, "subjects"),
          where("department", "==", department)
        );
        const querySnapshot = await getDocs(q);
        const fetchedSubjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().subjectName,
        }));
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [department]);

  const handleFileUpload = (selectedFile) => {
    console.log("File selected in modal:", selectedFile); // Debug log
    if (selectedFile) {
      setFiles((prevFiles) => [...prevFiles, selectedFile]); // Add new file to the array
    }
    setIsModalOpen(false); // Close the modal after selecting a file
  };

  const handleRemoveFile = (fileToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    // Reset visibility if no files remain, though it's shared for all files in this implementation
  };

  const handlePreviewFile = async (file) => {
    try {
      setPreviewError(null); // Reset any previous errors
      // Create a URL for the file (for local preview before upload)
      const fileUrl = URL.createObjectURL(file);

      // Log the file details for debugging
      console.log("Previewing file:", {
        name: file.name,
        type: file.type,
        url: fileUrl,
      });

      // Determine file type and set preview or handle fallback
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        setPreviewFile(fileUrl); // Set PDF URL for preview
      } else if (file.type.startsWith("image/")) {
        setPreviewFile(fileUrl); // Set image URL for preview
      } else {
        // For other file types (e.g., Word), open in a new tab or download
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = file.name; // Trigger download instead of opening in a new tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileUrl); // Clean up immediately
        setPreviewFile(null); // No preview modal for non-PDF/image files
        return;
      }
      setIsPreviewOpen(true); // Open preview modal
    } catch (error) {
      console.error("Error previewing file:", error);
      setPreviewError(
        "Failed to preview file. Please try again or ensure the file type is supported."
      );
      alert(previewError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const currentDate = new Date();
    const selectedDueDate = new Date(dueDate);
    if (selectedDueDate < currentDate) {
      alert("Due date cannot be in the past.");
      setIsLoading(false);
      return;
    }

    if (marks <= 0) {
      alert("Marks must be a positive number.");
      setIsLoading(false);
      return;
    }

    try {
      const fileURLs = [];

      for (const file of files) {
        const filePath = `assignments/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignments")
          .upload(filePath, file, {
            upsert: true,
            onUploadProgress: (progressEvent) => {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            },
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = await supabase.storage.from("assignments").getPublicUrl(filePath);

        fileURLs.push({ url: publicUrl, visibility: fileVisibility });
      }

      await addDoc(collection(db, "assignments"), {
        title,
        description,
        department,
        division,
        year,
        subject,
        marks,
        dueDate,
        fileURLs, // Store an array of file URLs with visibility
        assignedBy,
        timestamp: new Date(),
      });

      alert("Assignment added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding assignment:", error);
      alert("Failed to add assignment. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDepartment("");
    setDivision("");
    setYear("");
    setSubject("");
    setMarks("");
    setDueDate("");
    setFiles([]); // Reset files array
    setFileVisibility("Students can view file"); // Reset file visibility
    setPreviewFile(null); // Reset preview
    setIsPreviewOpen(false); // Close preview modal
    setPreviewError(null); // Reset preview error
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex">
      {/* Fixed Sidebar */}
      <div className="fixed w-64 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        {" "}
        {/* Fixed width, no borders or outlines */}
        <Sidebar />
      </div>

      <form
        className="bg-white shadow-lg rounded-lg p-8 w-full h-screen flex flex-col overflow-y-auto ml-64" // Margin for fixed sidebar
        onSubmit={handleSubmit}
      >
        {/* Title moved to left side */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-green-600">ADD ASSIGNMENT</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Title Field */}
            <label className="block text-gray-700 font-bold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            />

            <label className="block text-gray-700 font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            />

            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                Upload File
              </label>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-all"
                onClick={() => {
                  console.log("Drop zone clicked, opening modal"); // Debug log
                  setIsModalOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    console.log("Drop zone key pressed, opening modal");
                    setIsModalOpen(true);
                  }
                }}
                role="button"
                tabIndex={0} // Make it focusable for accessibility
              >
                {files.length > 0 ? (
                  <div className="w-full space-y-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border p-2 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src="https://ssl.gstatic.com/docs/doclist/images/drive_icon_16.png" // Google Drive icon (replace with your own if needed)
                            alt="File Icon"
                            className="w-6 h-6"
                          />
                          <div>
                            <p className="text-sm text-gray-800">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {file.type === "application/pdf" ||
                              file.name.toLowerCase().endsWith(".pdf")
                                ? "PDF"
                                : file.type === "application/msword" ||
                                  file.type ===
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                ? "Microsoft Word"
                                : file.type.startsWith("image/")
                                ? "Image"
                                : file.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewFile(file);
                            }}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            Review File
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(file);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-sm text-gray-600">
                      Click to add more files
                    </p>
                  </div>
                ) : (
                  <>
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/725/725643.png"
                      alt="Upload"
                      className="w-12 h-12 mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      Click to upload a file
                    </p>
                  </>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Uploading: {Math.round(uploadProgress)}%
                  </p>
                  <progress
                    value={uploadProgress}
                    max="100"
                    className="w-full h-2 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">
              Assigned By
            </label>
            <input
              type="text"
              value={assignedBy}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none mb-6 bg-gray-100"
            />

            <label className="block text-gray-700 font-bold mb-2">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            >
              <option value="">Select Department</option>
              {Object.values(DEPARTMENTS).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <label className="block text-gray-700 font-bold mb-2">
              Division
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            >
              <option value="">Select Division</option>
              {Object.values(DIVISIONS).map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>

            <label className="block text-gray-700 font-bold mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            >
              <option value="">Select Year</option>
              {Object.values(YEARS).map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <label className="block text-gray-700 font-bold mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.name}>
                  {subj.name}
                </option>
              ))}
            </select>

            <label className="block text-gray-700 font-bold mb-2">Marks</label>
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder="Enter marks"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            />

            <label className="block text-gray-700 font-bold mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-blue-600 transition-all disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                "POST"
              )}
            </button>
          </div>
        </div>

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log("Modal closed"); // Debug log
            setIsModalOpen(false);
          }}
          onFileUpload={handleFileUpload}
        />

        {/* File Preview Modal with native elements */}
        {isPreviewOpen && previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Preview File
                </h2>
                <button
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setPreviewFile(null);
                    if (previewFile) {
                      URL.revokeObjectURL(previewFile); // Clean up URL object
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>
              {previewError ? (
                <p className="text-red-500">{previewError}</p>
              ) : (
                <>
                  {previewFile.endsWith(".pdf") ||
                  previewFile.includes("application/pdf") ||
                  (previewFile.startsWith("blob:") &&
                    (previewFile.includes("application/pdf") ||
                      previewFile.includes(".pdf"))) ? (
                    <embed
                      src={previewFile}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      className="rounded-lg"
                      title={previewFile} // Added title to avoid validation errors
                      aria-label="PDF Preview" // Added for accessibility
                      onError={(e) => {
                        console.error("Embed error:", e);
                        setPreviewError(
                          "Failed to preview PDF. The file may be corrupted, blocked by browser settings, or require disabling ad blockers."
                        );
                      }}
                    />
                  ) : previewFile.startsWith("blob:") &&
                    previewFile.includes("image/") ? (
                    <img
                      src={previewFile}
                      alt="File Preview"
                      className="w-full h-auto rounded-lg"
                      title={previewFile} // Added title to avoid validation errors
                      aria-label="Image Preview" // Added for accessibility
                      onError={(e) => {
                        console.error("Image error:", e);
                        setPreviewError(
                          "Failed to preview image. The file may be corrupted or blocked."
                        );
                      }}
                    />
                  ) : (
                    <p className="text-gray-600">
                      Preview not available for this file type. Click "Review
                      File" to download or open in a new tab.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddAssignment;
