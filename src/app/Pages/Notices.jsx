import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const Notices = () => {
  const [notices, setNotices] = useState([]);
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        {" "}
        {/* Fixed width, no borders or outlines */}
        <Sidebar />
      </div>

      {/* Main Content with Margin for Fixed Sidebar */}
      <div className="flex-1 p-6 ml-56 bg-gray-100 overflow-y-auto">
        {" "}
        {/* Added margin-left to avoid overlap with fixed sidebar */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-5xl font-bold mb-8 text-green-500">NOTICES</h1>
          {/* Create Notice Button */}
          <button
            onClick={() => navigate("/create-notice")} // Navigate to CreateNotice.jsx
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Notice
          </button>
        </div>
        {notices.map((notice, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-md p-4 mb-4 border border-gray-300"
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
                  className="text-blue-500 underline hover:text-blue-700"
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

export default Notices;
