import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../../config"; // Ensure you have your Firebase config file
import StudentSidebar from "../Components/StudentSidebar"; // Import StudentSidebar component
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseclient"; // Import Supabase client

const CACHE_KEY = "notices_cache";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

const StudentNotice = () => {
  const [notices, setNotices] = useState([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true); // Start loading
      setError(null); // Clear previous errors
      try {
        // Temporarily disable cache for debugging
        // const cachedData = localStorage.getItem(CACHE_KEY);
        // const now = new Date().getTime();
        // if (cachedData) {
        //   const { data, timestamp } = JSON.parse(cachedData);
        //   if (now - timestamp < CACHE_EXPIRY) {
        //     setNotices(data);
        //     setLoading(false);
        //     return; // Use cached data
        //   }
        // }

        // Fetch fresh data from Firestore
        const noticesRef = collection(db, "notices");
        const noticesQuery = query(noticesRef, orderBy("createdAt", "desc")); // Order by creation date, newest first
        const querySnapshot = await getDocs(noticesQuery);
        const fetchedNotices = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const docData = doc.data();
            const noteData = {
              id: doc.id,
              title: docData.title || "No Title",
              noticeBy: docData.noticeBy || "Unknown",
              content: docData.content || "No content available",
              createdAt: docData.createdAt || new Date(), // Default to current date if missing
              files: Array.isArray(docData.files)
                ? docData.files
                : docData.file
                ? [docData.file]
                : [], // Handle files array or single file
            };

            console.log("Raw files from Firestore:", noteData.files); // Debug log

            // Fetch public URLs for files from Supabase if file paths exist
            if (noteData.files && noteData.files.length > 0) {
              const fileUrls = await Promise.all(
                noteData.files.map(async (filePath) => {
                  if (filePath) {
                    console.log("Fetching URL for filePath:", filePath); // Debug log
                    const {
                      data: { publicUrl },
                      error,
                    } = await supabase.storage
                      .from("notices") // Adjust bucket name if different
                      .getPublicUrl(filePath);

                    if (error) {
                      console.error(
                        "Supabase error for filePath:",
                        filePath,
                        error.message
                      );
                      return null; // Return null if there's an error
                    }
                    console.log("Fetched publicUrl:", publicUrl); // Debug log
                    return publicUrl; // Store the public URL for the attachment
                  }
                  return null;
                })
              );
              noteData.fileUrls = fileUrls.filter((url) => url !== null); // Filter out nulls
              console.log("Processed fileUrls:", noteData.fileUrls); // Debug log
            } else {
              noteData.fileUrls = []; // No files, so no URLs
            }

            return noteData;
          })
        );

        // Update state and cache
        setNotices(fetchedNotices);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: fetchedNotices,
            timestamp: new Date().getTime(),
          })
        );
      } catch (error) {
        console.error("Error fetching notices:", error);
        setError("Failed to load notices. Please try again later.");
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchNotices();
  }, []);

  // Handle sidebar hover
  const handleMouseEnter = () => {
    setIsSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    setIsSidebarHovered(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0">
          <StudentSidebar />
        </div>
        <div className="flex-1 p-6 bg-gray-100 overflow-y-auto ml-56 flex items-center justify-center">
          <p className="text-gray-600">Loading notices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0">
          <StudentSidebar />
        </div>
        <div className="flex-1 p-6 bg-gray-100 overflow-y-auto ml-56 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0">
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto ml-56">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold mb-8 text-orange-600">NOTICES</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {notices.length > 0 ? (
          notices.map((notice, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-md p-4 mb-4 border border-gray-300 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-bold">
                    Title: {notice.title}{" "}
                    <span className="text-gray-500">By: {notice.noticeBy}</span>
                  </h2>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Date: {new Date(notice.createdAt).toLocaleDateString()}</p>
                  <p>Time: {new Date(notice.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <p className="mb-2 text-gray-700">
                <strong>Content:</strong> {notice.content}
              </p>
              <p>
                <strong>Attachments:</strong>{" "}
                {notice.fileUrls && notice.fileUrls.length > 0
                  ? notice.fileUrls.map((url, index) => (
                      <div key={index} className="mb-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={
                            url.split("/").pop() || `attachment_${index + 1}`
                          } // Fallback file name
                          className="text-orange-500 underline hover:text-orange-700 mr-4"
                        >
                          Download File {index + 1}
                        </a>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline hover:text-blue-600"
                        >
                          View Preview
                        </a>
                      </div>
                    ))
                  : "No attachments"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No notices available.</p>
        )}
      </div>
    </div>
  );
};

export default StudentNotice;
