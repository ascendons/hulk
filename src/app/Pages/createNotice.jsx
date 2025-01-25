import React, { useState, useEffect } from "react";
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, storage } from "../../config";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import FileUploadModal from "../Components/FileUploadModal";
import Sidebar from "../Components/Sidebar";

const CreateNotice = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // Array to store multiple files
  const [category, setCategory] = useState("");
  const [noticeBy, setNoticeBy] = useState("Loading..."); // "Notice By" field with placeholder
  const [loading, setLoading] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // State for sidebar hover effect

  // Fetch the current user's name using their UID
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setNoticeBy("Guest"); // Fallback for unauthenticated users
          return;
        }

        const userId = user.uid;
        const userDocRef = doc(db, "users", userId); // Assuming the "users" collection uses UID as the document ID
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNoticeBy(userData.name || "Unknown"); // Update with the user's name
        } else {
          setNoticeBy("Unknown");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setNoticeBy("Error loading name");
      }
    };

    fetchUserName();
  }, []);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `notices/${selectedFile.name}`);
      const uploadTask = await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(uploadTask.ref);

      setFiles((prevFiles) => [
        ...prevFiles,
        { name: selectedFile.name, type: selectedFile.type, url },
      ]);
      setIsFileUploadModalOpen(false); // Close the modal
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noticeData = {
        title,
        content,
        files: files.map((file) => file.url), // Save only URLs to Firestore
        category,
        createdAt: new Date().toISOString(),
        noticeBy,
      };

      await setDoc(doc(collection(db, "notices")), noticeData);
      alert("Notice created successfully!");

      // Reset form
      setTitle("");
      setContent("");
      setFiles([]);
      setCategory("");
    } catch (error) {
      console.error("Error creating notice:", error);
      alert("Failed to create notice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-full transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex w-screen h-screen  overflow-y-auto">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full   overflow-auto">
          <h2 className="text-3xl font-bold mb-8  text-blue-600">
            CREATE NOTICE
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-lg text-gray-700 font-semibold mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-lg text-gray-700 font-semibold mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content"
                rows="5"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              ></textarea>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-lg text-gray-700 font-semibold mb-2">
                Upload Files
              </label>
              <button
                type="button"
                onClick={() => setIsFileUploadModalOpen(true)}
                className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
              >
                Upload File
              </button>
              <div className="mt-4 space-y-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border"
                  >
                    <div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {file.name}
                      </a>
                      <p className="text-sm text-gray-500">{file.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-500 hover:text-red-600"
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
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-lg text-gray-700 font-semibold mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="news">News</option>
              </select>
            </div>

            {/* Notice By */}
            <div>
              <label className="block text-lg text-gray-700 font-semibold mb-2">
                Notice By
              </label>
              <input
                type="text"
                value={noticeBy}
                className="w-full border rounded-lg px-4 py-3 bg-gray-100"
                readOnly
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

      {isFileUploadModalOpen && (
        <FileUploadModal
          onFileUpload={handleFileUpload}
          onClose={() => setIsFileUploadModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CreateNotice;
