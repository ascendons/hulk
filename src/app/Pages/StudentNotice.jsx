import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../../config"; // Ensure you have your Firebase config file
import StudentSidebar from "../Components/StudentSidebar"; // Import StudentSidebar component
const StudentNotice = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch notices from Firestore, ordered by createdAt (most recent first)
          const noticesQuery = query(
            collection(db, "notices"),
            orderBy("createdAt", "desc") // Match the field name from your Notices.jsx
          );
          const querySnapshot = await getDocs(noticesQuery);

          const noticesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setNotices(noticesList);
        } catch (error) {
          console.error("Error fetching notices:", error);
        }
      } else {
        setNotices([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-gray-900 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <StudentSidebar /> {/* Assuming you have a StudentSidebar component */}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-600">NOTICES</h1>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {notices.length > 0 ? (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-800 font-semibold">
                      Title: {notice.title || "No Title"}
                    </p>
                    <p className="text-gray-600">
                      By: {notice.noticeBy || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right text-gray-500 text-sm">
                    <p>
                      Date: {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Time: {new Date(notice.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">
                  Content: {notice.content || "No content available"}
                </p>
                <p className="text-gray-600">
                  Attachments:{" "}
                  {notice.file ? (
                    <a
                      href={notice.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:text-blue-700"
                    >
                      Download File
                    </a>
                  ) : (
                    "No attachments"
                  )}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No notices available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNotice;
