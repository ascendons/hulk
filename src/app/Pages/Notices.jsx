import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const navigate = useNavigate();

  // Fetch data from Firestore
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
    <div className="flex h-screen bg-gray-50">
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
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold mb-8  text-blue-600">NOTICES</h1>
          {/* Create Notice Button */}
          <button
            onClick={() => navigate("/create-notice")}
            className="px-6 py-3 bg-orange-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-orange-600 transition"
          >
            Create Notice
          </button>
        </div>

        {notices.length === 0 ? (
          <p className="text-gray-500 text-center">No notices available.</p>
        ) : (
          notices.map((notice, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-lg p-6 mb-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-blue-600">
                    {notice.title}
                  </h2>
                  <p className="text-large text-red-500">
                    By: {notice.noticeBy || "Unknown"}
                  </p>
                </div>
                <div className="text-large text-gray-400 text-right">
                  <p>{new Date(notice.createdAt).toLocaleDateString()}</p>
                  <p>{new Date(notice.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">
                <strong className="text-blue-600">Content:</strong>{" "}
                {notice.content}
              </p>
              <div>
                <strong className="text-blue-600">Attachments:</strong>{" "}
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
                  <span className="text-gray-500">No attachments</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notices;
