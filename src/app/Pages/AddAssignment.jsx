import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../config"; // Firebase configuration
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Sidebar from "../Components/Sidebar";
import FileUploadModal from "../Components/FileUploadModal";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants"; // Constants for dropdowns

const AddAssignment = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [division, setDivision] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);
  const [assignedBy, setAssignedBy] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Fetch user details from Firestore
          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          const usersSnapshot = await getDocs(usersQuery);
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            setAssignedBy(userData.name || user.email); // Use name if available
          }

          // Fetch teacher details from Firestore
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
    setFile(selectedFile);
    setIsUploadModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate due date
    const currentDate = new Date();
    const selectedDueDate = new Date(dueDate);
    if (selectedDueDate < currentDate) {
      alert("Due date cannot be in the past.");
      setIsLoading(false);
      return;
    }

    // Validate marks
    if (marks <= 0) {
      alert("Marks must be a positive number.");
      setIsLoading(false);
      return;
    }

    try {
      let fileURL = "";

      if (file) {
        const storageRef = ref(storage, `assignments/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              fileURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      await addDoc(collection(db, "Assignments"), {
        title,
        description,
        department,
        division,
        year,
        subject,
        marks,
        dueDate,
        fileURL,
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
    setFile(null);
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      <form
        className="bg-white shadow-lg rounded-lg p-8 w-full h-screen flex flex-col overflow-y-auto"
        onSubmit={handleSubmit}
      >
        {/* Assignment Details */}
        <h1 className="text-3xl font-bold mb-6 text-blue-800">ASSIGNMENT</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Section */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
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
                onClick={() => setIsUploadModalOpen(true)}
              >
                {file ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Click to change file
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

            {/* Upload Modal */}
            {isUploadModalOpen && (
              <FileUploadModal
                onFileUpload={handleFileUpload}
                onClose={() => setIsUploadModalOpen(false)}
              />
            )}
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
      </form>
    </div>
  );
};

export default AddAssignment;