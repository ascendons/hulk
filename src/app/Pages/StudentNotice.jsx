import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../../config"; // Ensure you have your Firebase config file
import StudentSidebar from "../Components/StudentSidebar"; // Import StudentSidebar component
import { useNavigate } from "react-router-dom";

const StudentNotice = () => {
  const [notices, setNotices] = useState([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "notices"));
        const fetchedNotices = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotices(fetchedNotices);
      } catch (error) {
        console.error("Error fetching notices:", error);
      }
    };

    fetchNotices();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-orange-500 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold mb-8 text-orange-600">NOTICES</h1>
        </div>

        {notices.map((notice, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-md p-4 mb-4 border border-gray-300 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-bold">
                  Title: {notice.title}{" "}
                  <span className="text-gray-500">
                    By:{notice.noticeBy || "Unknown"}
                  </span>
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
              {notice.file ? (
                <a
                  href={notice.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 underline hover:text-orange-700"
                >
                  Download File
                </a>
              ) : (
                "No attachments"
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentNotice;
