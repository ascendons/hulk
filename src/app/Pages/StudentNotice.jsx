import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../../config";
import StudentSidebar from "../Components/StudentSidebar";
import supabase from "../../supabaseclient";

const CACHE_KEY = "notices_cache";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

const getFileType = (url) => {
  if (!url) return "unknown";
  const extension = url.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif"].includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (["doc", "docx", "txt", "ppt", "pptx"].includes(extension))
    return "document";
  return "unknown";
};

// Modal component for previews
const PreviewModal = ({ isOpen, onClose, url, fileType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">File Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close preview"
          >
            &times;
          </button>
        </div>
        {fileType === "pdf" && (
          <iframe
            src={url}
            title="PDF Preview"
            className="w-full h-[60vh]"
            onError={() => alert("Failed to load PDF preview.")}
          />
        )}
        {fileType === "image" && (
          <img
            src={url}
            alt="Preview"
            className="w-full h-auto max-h-[60vh] object-contain"
            onError={() => alert("Failed to load image preview.")}
          />
        )}
        {fileType === "document" && (
          <div className="text-gray-600">
            <p>
              Preview not available for this file type.{" "}
              <a
                href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                  url
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Try viewing in Google Docs Viewer
              </a>
            </p>
          </div>
        )}
        {fileType === "unknown" && (
          <p className="text-gray-600">
            Preview not available for this file type.
          </p>
        )}
      </div>
    </div>
  );
};

const StudentNotice = () => {
  const [notices, setNotices] = useState([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFileType, setPreviewFileType] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotices = async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    try {
      // Check cache unless bypassing
      if (!bypassCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const now = new Date().getTime();
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (now - timestamp < CACHE_EXPIRY) {
            setNotices(data);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch from Firestore
      const noticesRef = collection(db, "notices");
      const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(noticesQuery);
      const fetchedNotices = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const docData = doc.data();
          const noticeData = {
            id: doc.id,
            title: docData.title || "No Title",
            noticeBy: docData.noticeBy || "Unknown",
            content: docData.content || "No content available",
            createdAt: docData.createdAt
              ? docData.createdAt.toDate()
              : new Date(),
            files: Array.isArray(docData.files)
              ? docData.files
              : docData.file
              ? [docData.file]
              : [],
          };

          // Fetch Supabase URLs
          if (noticeData.files && noticeData.files.length > 0) {
            const fileUrls = await Promise.all(
              noticeData.files.map(async (filePath) => {
                if (filePath) {
                  const {
                    data: { publicUrl },
                    error,
                  } = await supabase.storage
                    .from("notices")
                    .getPublicUrl(filePath);

                  if (error) {
                    console.error("Supabase error:", filePath, error.message);
                    return null;
                  }
                  return publicUrl;
                }
                return null;
              })
            );
            noticeData.fileUrls = fileUrls.filter((url) => url !== null);
            noticeData.fileTypes = noticeData.fileUrls.map((url) =>
              getFileType(url)
            );
          } else {
            noticeData.fileUrls = [];
            noticeData.fileTypes = [];
          }

          return noticeData;
        })
      );

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleMouseEnter = () => setIsSidebarHovered(true);
  const handleMouseLeave = () => setIsSidebarHovered(false);

  const openPreview = (url, fileType) => {
    setPreviewUrl(url);
    setPreviewFileType(fileType);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewFileType(null);
    setIsPreviewOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div
          className={`fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden transition-all duration-300 ${
            isSidebarHovered ? "shadow-lg" : ""
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <StudentSidebar />
        </div>
        <div className="flex-1 p-6 ml-56 flex items-center justify-center">
          <p className="text-gray-600">Loading notices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div
          className={`fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden transition-all duration-300 ${
            isSidebarHovered ? "shadow-lg" : ""
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <StudentSidebar />
        </div>
        <div className="flex-1 p-6 ml-56 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div
        className={`fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden transition-all duration-300 ${
          isSidebarHovered ? "shadow-lg" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <StudentSidebar />
      </div>

      <div className="flex-1 p-6 ml-56">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">NOTICES</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => fetchNotices(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Refresh Notices
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {notices.length > 0 ? (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white shadow-md rounded-md p-6 mb-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {notice.title}
                  </h2>
                  <p className="text-sm text-gray-500">By: {notice.noticeBy}</p>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  <p>Date: {new Date(notice.createdAt).toLocaleDateString()}</p>
                  <p>Time: {new Date(notice.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <p className="mb-4 text-gray-700">{notice.content}</p>
              <div>
                <strong className="text-gray-800">Attachments:</strong>
                {notice.fileUrls && notice.fileUrls.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {notice.fileUrls.map((url, index) => (
                      <li key={index} className="flex items-center space-x-4">
                        <a
                          href={url}
                          download={
                            url.split("/").pop() || `attachment_${index + 1}`
                          }
                          className="text-orange-500 underline hover:text-orange-700"
                        >
                          Download File {index + 1}
                        </a>
                        {["pdf", "image"].includes(notice.fileTypes[index]) ? (
                          <button
                            onClick={() =>
                              openPreview(url, notice.fileTypes[index])
                            }
                            className="text-blue-500 underline hover:text-blue-600"
                          >
                            Preview
                          </button>
                        ) : (
                          <a
                            href={`https://docs.google.com/viewer?url=${encodeURIComponent(
                              url
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline hover:text-blue-600"
                          >
                            Try Google Docs Viewer
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600"> No attachments</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No notices available.</p>
        )}

        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={closePreview}
          url={previewUrl}
          fileType={previewFileType}
        />
      </div>
    </div>
  );
};

export default StudentNotice;
