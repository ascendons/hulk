import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";
import { Link } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import supabase from "../../supabaseclient";

const CACHE_KEY = "notes_cache";
const CACHE_EXPIRY = 5 * 60 * 1000;

const ShowNotes = () => {
  const [notes, setNotes] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchNotes = async () => {
      // Check if cached data exists and is not expired
      const cachedData = localStorage.getItem(CACHE_KEY);
      const now = new Date().getTime();

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (now - timestamp < CACHE_EXPIRY) {
          setNotes(data);
          setIsLoading(false);
          return; // Use cached data
        }
      }

      // Fetch fresh data from Firestore
      try {
        const notesRef = collection(db, "notes");
        const notesSnapshot = await getDocs(notesRef);
        const notesData = await Promise.all(
          notesSnapshot.docs.map(async (doc) => {
            const noteData = {
              id: doc.id,
              ...doc.data(),
            };

            // Fetch the public URL for the file from Supabase if filePath exists
            if (noteData.filePath) {
              const {
                data: { publicUrl },
                error,
              } = await supabase.storage
                .from("notes") // Supabase bucket name
                .getPublicUrl(noteData.filePath);

              if (error) {
                console.error("Error fetching file URL from Supabase:", error);
                noteData.fileUrl = null; // Set to null if there's an error
              } else {
                noteData.fileUrl = publicUrl; // Store the public URL for the attachment
              }
            } else {
              noteData.fileUrl = null; // No filePath, so no URL
            }

            return noteData;
          })
        );

        // Update state and cache
        setNotes(notesData);
        setIsLoading(false);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: notesData, timestamp: now })
        );
      } catch (error) {
        console.error("Error fetching notes:", error);
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Group notes by subject
  const groupedNotes = notes.reduce((acc, note) => {
    if (!acc[note.subject]) {
      acc[note.subject] = [];
    }
    acc[note.subject].push(note);
    return acc;
  }, {});

  // Handle subject click
  const handleSubjectClick = (subject) => {
    setExpandedSubject(expandedSubject === subject ? null : subject);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Fixed Sidebar */}
      <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        {" "}
        {/* Fixed width, no borders or outlines */}
        <Sidebar />
      </div>

      {/* Main Content with Margin for Fixed Sidebar */}
      <div className="flex-1 p-6 ml-56">
        {" "}
        {/* Added margin-left to avoid overlap with fixed sidebar */}
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">NOTES</h1>
          <Link
            to="/add-notes" // Replace with your Add Notes route
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Add Notes
          </Link>
        </div>
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : /* Subject-Wise Notes */
        Object.keys(groupedNotes).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedNotes).map(([subject, notes]) => (
              <div key={subject} className="bg-white rounded-lg shadow-md">
                {/* Subject Header */}
                <div
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => handleSubjectClick(subject)}
                >
                  <h2 className="text-xl font-semibold text-gray-800">
                    {subject}
                  </h2>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transform transition-transform ${
                      expandedSubject === subject ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Notes List (Collapsible) */}
                {expandedSubject === subject && (
                  <div className="p-4 border-t">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="mb-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <h3 className="text-lg font-medium text-gray-700">
                          {note.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{note.description}</p>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>
                            <span className="font-medium">Department:</span>{" "}
                            {note.department}
                          </p>
                          <p>
                            <span className="font-medium">Division:</span>{" "}
                            {note.division}
                          </p>
                          <p>
                            <span className="font-medium">Year:</span>{" "}
                            {note.year}
                          </p>
                          <p>
                            <span className="font-medium">Unit:</span>{" "}
                            {note.unit}
                          </p>
                        </div>

                        {/* File Attachment Link */}
                        <div className="mt-2 space-x-4">
                          {note.fileUrl && (
                            <a
                              href={note.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 underline"
                            >
                              Download Attachment
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No notes found.</p>
        )}
      </div>
    </div>
  );
};

export default ShowNotes;
