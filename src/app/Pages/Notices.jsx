import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null); // State for preview URL
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State for preview modal
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

  // Handle preview button click
  const handlePreview = (url) => {
    setSelectedFileUrl(url);
    setIsPreviewOpen(true);
  };

  // Close preview modal
  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedFileUrl(null);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed w-64 bg-gray-900 text-white h-screen overflow-y-auto border-0 outline-0">
        <Sidebar />
      </div>

      {/* Main Content with Margin for Fixed Sidebar */}
      <div className="flex-1 p-6 ml-64 bg-gray-100 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-5xl font-bold mb-8 text-green-500">NOTICES</h1>
          {/* Create Notice Button */}
          <button
            onClick={() => navigate("/create-notice")}
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
            <div className="flex justify-between items-center  mb-2">
              <div>
                <h2 className="text-lg font-bold">
                  Title: {notice.title}{" "}
                  <span className="text-gray-500">
                    By: {notice.noticeBy || "Unknown"}
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
            <div>
              <strong>Attachments:</strong>
              {notice.files && notice.files.length > 0 ? (
                <ul className="list-disc pl-5 mt-2">
                  {notice.files.map((fileUrl, fileIndex) => (
                    <li key={fileIndex} className="mb-1">
                      <button
                        onClick={() => handlePreview(fileUrl)}
                        className="text-blue-500 underline hover:text-blue-700 mr-2"
                      >
                        Preview Attachment
                      </button>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline hover:text-blue-700"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span> No attachments</span>
              )}
            </div>
          </div>
        ))}

        {/* Preview Modal */}
        {isPreviewOpen && selectedFileUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Attachment Preview
                </h2>
                <button
                  onClick={closePreview}
                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>
              {selectedFileUrl.endsWith(".pdf") ||
              selectedFileUrl.includes("application/pdf") ? (
                <embed
                  src={selectedFileUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="rounded-lg"
                  title="PDF Preview"
                  aria-label="PDF Preview"
                  onError={(e) => {
                    console.error("Embed error:", e);
                    alert(
                      "Failed to preview PDF. The file may be corrupted or blocked."
                    );
                  }}
                />
              ) : /\.(jpg|jpeg|png|gif)$/i.test(selectedFileUrl) ? (
                <img
                  src={selectedFileUrl}
                  alt="Attachment Preview"
                  className="w-full h-auto rounded-lg"
                  title="Image Preview"
                  aria-label="Image Preview"
                  onError={(e) => {
                    console.error("Image error:", e);
                    alert(
                      "Failed to preview image. The file may be corrupted or blocked."
                    );
                  }}
                />
              ) : (
                <p className="text-gray-600">
                  Preview not available for this file type. Please download to
                  view.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notices;
