import React, { useState, useEffect, useCallback } from "react";
import { db, storage } from "../../config";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../Components/Sidebar";
import FileUploadModal from "../Components/FileUploadModal";
import YoutubeLinkModal from "../Components/YoutubeLinkModal";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants";
import { useParams, useNavigate } from "react-router-dom"; // For editing functionality

const AddNotes = () => {
  const { noteId } = useParams(); // Get noteId from URL for editing
  const navigate = useNavigate(); // For navigation after saving
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS.BSCIT);
  const [division, setDivision] = useState(DIVISIONS.A);
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [file, setFile] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  // const [isDepartmentDivisionLocked, setIsDepartmentDivisionLocked] = useState(false);
  const [isRestricted] = useState(false);

  // Fetch note data if in edit mode
  useEffect(() => {
    if (noteId) {
      const fetchNote = async () => {
        try {
          const noteDoc = await getDoc(doc(db, "Notes", noteId));
          if (noteDoc.exists()) {
            const noteData = noteDoc.data();
            setTitle(noteData.title);
            setDescription(noteData.description);
            setDepartment(noteData.department);
            setDivision(noteData.division);
            setYear(noteData.year);
            setSubject(noteData.subject);
            setUnit(noteData.unit);
            setYoutubeLink(noteData.youtubeLink || "");
            // Note: File URL is not editable directly; re-upload if needed
          } else {
            toast.error("Note not found.");
            navigate("/notes"); // Redirect if note doesn't exist
          }
        } catch (error) {
          console.error("Error fetching note:", error);
          toast.error("Failed to fetch note.");
        }
      };

      fetchNote();
    }
  }, [noteId, navigate]);

  const handleFileUpload = useCallback((e) => {
    setFile(e.target.files[0]);
    setIsUploadModalOpen(false);
  }, []);

  const handleYoutubeSubmit = useCallback((e) => {
    e.preventDefault();
    if (!youtubeLink) {
      toast.error("Please provide a YouTube link.");
      return;
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(youtubeLink)) {
      toast.error("Please provide a valid YouTube link.");
      return;
    }

    toast.success("YouTube Link Added!");
    setIsYoutubeModalOpen(false);
  }, [youtubeLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !department || !division || !year || !subject || !unit) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      let fileURL = "";

      if (file) {
        const storageRef = ref(storage, `notes/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const toastId = toast.loading("Uploading file...");

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              toast.update(toastId, { progress: progress });
            },
            (error) => {
              toast.update(toastId, {
                render: "Upload failed!",
                type: toast.TYPE.ERROR,
                isLoading: false,
                autoClose: 3000,
              });
              reject(error);
            },
            async () => {
              fileURL = await getDownloadURL(uploadTask.snapshot.ref);
              toast.update(toastId, {
                render: "Upload complete!",
                type: toast.TYPE.SUCCESS,
                isLoading: false,
                autoClose: 3000,
              });
              resolve();
            }
          );
        });
      }

      const newNote = {
        title,
        description,
        department,
        division,
        year,
        subject,
        unit,
        youtubeLink,
        fileURL: fileURL || (noteId ? undefined : ""), // Preserve existing fileURL if not uploading a new file
        timestamp: new Date(),
      };

      if (noteId) {
        // Update existing note
        await updateDoc(doc(db, "Notes", noteId), newNote);
        toast.success("Note updated successfully!");
      } else {
        // Add new note
        await addDoc(collection(db, "Notes"), newNote);
        toast.success("Note added successfully!");
      }

      // Reset form and redirect
      setTitle("");
      setDescription("");
      setDepartment(DEPARTMENTS.BSCIT);
      setDivision(DIVISIONS.A);
      setYear("");
      setSubject("");
      setUnit("");
      setFile(null);
      setYoutubeLink("");
      navigate("/notes"); // Redirect to notes list after saving
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-8">
            {noteId ? "Edit Note" : "Add Note"}
          </h1>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department, Division, Year, Subject, Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isRestricted}
              >
                {Object.values(DEPARTMENTS).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Division</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isRestricted}
              >
                {Object.values(DIVISIONS).map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.values(YEARS).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Enter unit"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* File and YouTube Links */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Attachments</label>
            <div className="flex space-x-4">
              <button
                type="button"
                className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <span>Upload File</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
                onClick={() => setIsYoutubeModalOpen(true)}
              >
                <span>Add YouTube Link</span>
              </button>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{file.type || "Unknown"}</p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => setFile(null)}
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
              </div>
            )}

            {youtubeLink && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://img.youtube.com/vi/${
                        youtubeLink.split("v=")[1]
                      }/hqdefault.jpg`}
                      alt="YouTube Thumbnail"
                      className="w-16 h-16 rounded-md"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 truncate w-64">
                        Placeholder Title
                      </p>
                      <p className="text-sm text-gray-500">
                        YouTube video • Placeholder duration
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => setYoutubeLink("")}
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
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              onClick={handleSubmit}
            >
              {isLoading ? (noteId ? "Updating..." : "Submitting...") : noteId ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isYoutubeModalOpen && (
        <YoutubeLinkModal
          youtubeLink={youtubeLink}
          setYoutubeLink={setYoutubeLink}
          onSubmit={handleYoutubeSubmit}
          onClose={() => setIsYoutubeModalOpen(false)}
        />
      )}

      {isUploadModalOpen && (
        <FileUploadModal
          onFileUpload={handleFileUpload}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AddNotes;