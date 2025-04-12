import React, { useState, useEffect } from "react";
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";
import FileUploadModal from "../Components/FileUploadModal";
import supabase from "../../supabaseclient";

const CreateNotice = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [noticeBy, setNoticeBy] = useState("Guest");
  const [loading, setLoading] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

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

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 90) {
        clearInterval(interval); // Stop at 90% to wait for the actual upload to finish
      }
    }, 200); // Update every 200ms
    return interval;
  };

  const handleFileUpload = async (file) => {
    try {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error("Only PDF, JPEG, PNG, and GIF files are supported.");
      }

      // Start simulating progress
      const progressInterval = simulateProgress();

      const timestamp = Date.now();
      const filePath = `notices/${timestamp}_${file.name}`;
      console.log("Uploading file to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("notices")
        .upload(filePath, file, {
          upsert: true,
        });

      clearInterval(progressInterval); // Stop the simulation

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("notices")
        .getPublicUrl(filePath);

      if (urlError) {
        console.error("Error getting public URL:", urlError);
        throw new Error(`Failed to get public URL: ${urlError.message}`);
      }

      if (!publicUrlData.publicUrl) {
        throw new Error("Public URL not found in response");
      }

      setFiles((prevFiles) => [
        ...prevFiles,
        { name: file.name, type: file.type, url: publicUrlData.publicUrl },
      ]);
      setUploadProgress(100); // Set to 100% on completion
      setUploadComplete(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setUploadComplete(false);
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error("Error in handleFileUpload:", error);
      alert(error.message);
      setUploadProgress(0);
      setUploadComplete(false);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setUploadProgress(0);
    setUploadComplete(false);
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

      setTitle("");
      setContent("");
      setFiles([]);
      setCategory("");
      setUploadProgress(0);
      setUploadComplete(false);
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
      <div className="fixed w-64 bg-gray-900 text-white h-screen overflow-y-auto border-0 outline-0">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 flex overflow-y-auto">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full">
          <h2 className="text-5xl font-bold mb-8 text-green-500">
            CREATE NOTICE
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    <span className="text-gray-800 truncate max-w-[80%]">
                      {file.name}
                    </span>
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
                {uploadProgress > 0 && !uploadComplete && (
                  <div className="mt-2">
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
                {uploadComplete && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">Upload complete!</p>
                  </div>
                )}
              </div>
            </div>

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

      {isFileUploadModalOpen && (
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onFileUpload={handleFileUpload}
          onClose={() => setIsFileUploadModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CreateNotice;
