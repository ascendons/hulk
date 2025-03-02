import React, { useState, useEffect } from "react";
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, storage } from "../../config";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import Sidebar from "../Components/Sidebar";
import FileUploadModal from "../Components/FileUploadModal";

const CreateNotice = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // Array to store multiple files
  const [category, setCategory] = useState("");
  const [noticeBy, setNoticeBy] = useState("Guest");
  const [loading, setLoading] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Fetch the current user's name using their UID
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setNoticeBy("Guest");
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setNoticeBy(userDoc.data().name || "Unknown");
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

  const handleFileUpload = async (file) => {
    try {
      const storageRef = ref(storage, `notices/${file.name}`);
      const uploadTaskSnapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadTaskSnapshot.ref);

      setFiles((prevFiles) => [
        ...prevFiles,
        { name: file.name, type: file.type, url },
      ]);
      setIsFileUploadModalOpen(false); // Close modal after upload
    } catch (error) {
      console.error("Error uploading file:", error);
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
        files: files.map((file) => file.url),
        category,
        createdAt: new Date().toISOString(),
        noticeBy,
      };

      await setDoc(doc(collection(db, "notices")), noticeData);

      // Reset form
      setTitle("");
      setContent("");
      setFiles([]);
      setCategory("");
      alert("Notice created successfully!");
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
      <div className="flex-1 flex  overflow-y-auto">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full ">
          <h2 className="text-5xl font-bold mb-8 text-green-500">
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
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
              >
                Upload File
              </button>
              <div className="mt-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border mb-2"
                  >
                    {/* Display the file name */}
                    <span className="text-gray-800 truncate max-w-[80%]">
                      {file.name}
                    </span>

                    {/* Remove button with icon */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
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
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

      {/* File Upload Modal */}
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
