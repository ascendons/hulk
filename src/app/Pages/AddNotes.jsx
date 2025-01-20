import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../config"; // Import your Firebase configuration
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Sidebar from "../Components/Sidebar";
<<<<<<< HEAD
=======
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";  
>>>>>>> 4ecc896 (new build is desployed)

const AddNotes = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [division, setDivision] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]); // For storing fetched subjects
  const [unit, setUnit] = useState("");
  const [file, setFile] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
<<<<<<< HEAD
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // State to track hover
=======
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);  
  const [isRestricted, setIsRestricted] = useState(false);  
>>>>>>> 4ecc896 (new build is desployed)

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
<<<<<<< HEAD
        const user = auth.currentUser;
        if (user) {
          const teachersQuery = query(
            collection(db, "teachersinfo"),
            where("teacheremail", "==", user.email)
          );
          const teachersSnapshot = await getDocs(teachersQuery);
          if (!teachersSnapshot.empty) {
            const teacherData = teachersSnapshot.docs[0].data();
            setDepartment(teacherData.department);
            setDivision(
              teacherData.department === "BSCIT"
                ? "A"
                : teacherData.divisions[0]
            );
          } else {
            console.error("No teacher found with the given email.");
=======
        const userId = "cxmzQhi4GuPkLhiNkipTP0t1tKF3";  
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "teacher" && userData.department === "BSCIT") {
            setDepartment("BSCIT");
            setDivision("A");
            setIsRestricted(true);      
>>>>>>> 4ecc896 (new build is desployed)
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
        const q = query(
          collection(db, "subjects"),
          where("department", "==", department)
        );
        const querySnapshot = await getDocs(q);
        const fetchedSubjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    if (department) {
      fetchSubjects();
    }
  }, [department]);

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
    setIsUploadModalOpen(false);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    if (!youtubeLink) {
      alert("Please provide a YouTube link.");
    } else {
      alert(`YouTube Link Added: ${youtubeLink}`);
      setIsYoutubeModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !department || !division || !year || !subject || !unit) {
      alert("Please fill out all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      let fileURL = "";

      if (file) {
        const storageRef = ref(storage, `notes/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => reject(error),
            async () => {
              fileURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      await addDoc(collection(db, "Notes"), {
        title,
        description,
        department,
        division,
        year,
        subject,
        unit,
        youtubeLink,
        fileURL,
        timestamp: new Date(),
      });

      alert("Notes added successfully!");

      setTitle("");
      setDescription("");
      setYear("");
      setSubject("");
      setUnit("");
      setFile(null);
      setYoutubeLink("");
    } catch (error) {
      console.error("Error adding notes:", error);
      alert("Failed to add notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex ">
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
        className="bg-white shadow-lg rounded-lg p-8 w-full h-full max-w-screen flex"
        onSubmit={handleSubmit}
      >
        <div className="w-2/3 pr-4">
          <h1 className="text-2xl font-bold mb-6">ADD NOTES</h1>
          <label className="block text-gray-700 font-bold mb-2 text-xl">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
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
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          />
          <div className="flex space-x-6">
            <div
              className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 cursor-pointer hover:shadow-md w-36 h-36 text-center"
              onClick={() => setIsYoutubeModalOpen(true)}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
                alt="YouTube"
                className="w-12 h-12 mb-2"
              />
              <p>YouTube</p>
            </div>
            <div
              className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 cursor-pointer hover:shadow-md w-36 h-36 text-center"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/725/725643.png"
                alt="Upload"
                className="w-12 h-12 mb-2"
              />
              <p>Upload</p>
            </div>
          </div>

          {file && (
            <div className="w-full mt-4 flex items-center justify-between border border-gray-300 rounded-lg p-4">
              <div>
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {file.type || "Unknown"}
                </p>
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-red-600"
                onClick={removeFile}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          {youtubeLink && (
            <div className="w-full mt-4 flex items-center justify-between border border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <img
                  src={`https://img.youtube.com/vi/$${
                    youtubeLink.split("v=")[1]
                  }/hqdefault.jpg`}
                  alt="YouTube Thumbnail"
                  className="w-16 h-16 rounded-md"
                />
                <div>
                  <p className="font-semibold text-gray-800 truncate w-64">
                    Placeholder Title
                  </p>
                  <p className="text-sm text-gray-500">
                    YouTube video • Placeholder duration
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="text-gray-500 hover:text-red-600"
                onClick={() => setYoutubeLink("")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="w-1/3 pl-4 flex flex-col justify-between">
          <div>
            <label className="block text-gray-700 font-bold mb-2">
              Department
            </label>
            <select
              value={department}
              disabled
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="BSCIT">BSCIT</option>
              <option value="BCOM">BCOM</option>
              <option value="BMS">BMS</option>
            </select>
            <label className="block text-gray-700 font-bold mb-2">
              Division
            </label>
            <select
              value={division}
              disabled
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            <label className="block text-gray-700 font-bold mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            >
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
            </select>
            <label className="block text-gray-700 font-bold mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.subjectName}>
                  {subj.subjectName}
                </option>
              ))}
            </select>
            <label className="block text-gray-700 font-bold mb-2">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            >
              <option value="">Select Unit</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-blue-600"
          >
            {isLoading ? "Submitting..." : "POST"}
          </button>
        </div>
      </form>

      {isYoutubeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Add YouTube Link</h2>
            <form onSubmit={handleYoutubeSubmit}>
              <input
                type="url"
                placeholder="Paste YouTube URL"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                required
              />
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="bg-gray-300 text-black py-2 px-6 rounded-lg hover:bg-gray-400"
                  onClick={() => setIsYoutubeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
                >
                  Add Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-center">Upload File</h2>
            <div className="flex flex-col items-center justify-center space-y-6">
              <label
                htmlFor="file-upload"
                className="bg-blue-500 text-white py-3 px-8 rounded-lg cursor-pointer hover:bg-blue-600 text-center"
              >
                Browse
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="bg-gray-300 text-black py-2 px-8 rounded-lg hover:bg-gray-400"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNotes;
