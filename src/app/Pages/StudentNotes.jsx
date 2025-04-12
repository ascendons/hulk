// src/components/StudentNotes.jsx
import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config"; // Import Firestore instance
import { AuthContext } from "../../authContext"; // Import your authentication context
import StudentSidebar from "../Components/StudentSidebar"; // Import StudentSidebar component
import supabase from "../../supabaseclient"; // Import Supabase client

const CACHE_KEY = "student_notes_cache"; // Key for localStorage
const CACHE_EXPIRY = 5 * 60 * 1000; // Cache expiry time (5 minutes)

const StudentNotes = () => {
  const [notes, setNotes] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [error, setError] = useState(null); // Error state for debugging

  const { user } = useContext(AuthContext);

  // Fetch student name from Firestore based on user.email
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const fetchStudentName = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const usersRef = collection(db, "users"); // Use "users" collection as per your screenshot
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setStudentName(userData.name || "Unknown"); // Use name from Firestore
        } else {
          setStudentName(user.email || "Unknown"); // Fallback to email if no user record found
        }
      } catch (error) {
        console.error("Error fetching student name:", error);
        setError("Failed to fetch student name. Check console for details.");
        setStudentName(user.email || "Unknown"); // Fallback on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentName();
  }, [user]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!studentName || studentName === "Unknown") return;

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

      setIsLoading(true);
      setError(null); // Reset error state

      try {
        const notesRef = collection(db, "notes");
        const querySnapshot = await getDocs(notesRef);

        if (querySnapshot.empty) {
          console.log("No notes found in Firestore.");
        } else {
          const fetchedNotes = [];
          let totalNotes = 0;

          querySnapshot.forEach((doc) => {
            const noteData = {
              id: doc.id,
              ...doc.data(),
            };

            // Filter notes by student name (assuming notes are associated with a student's name or department/division)
            if (
              noteData.department === "Bsc.IT" && // Adjust based on your data structure
              noteData.division === "A" && // Adjust based on your data structure
              noteData.subject // Ensure subject exists
            ) {
              fetchedNotes.push(noteData);
              totalNotes++;
            }
          });

          if (totalNotes > 0) {
            // Fetch file URLs from Supabase for each note
            const notesWithFiles = await Promise.all(
              fetchedNotes.map(async (note) => {
                if (note.filePath) {
                  const {
                    data: { publicUrl },
                    error,
                  } = await supabase.storage
                    .from("notes") // Supabase bucket name
                    .getPublicUrl(note.filePath);

                  if (error) {
                    console.error(
                      "Error fetching file URL from Supabase:",
                      error
                    );
                    note.fileUrl = null; // Set to null if there's an error
                  } else {
                    note.fileUrl = publicUrl; // Store the public URL for the attachment
                  }
                } else {
                  note.fileUrl = null; // No filePath, so no URL
                }
                return note;
              })
            );

            setNotes(notesWithFiles);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ data: notesWithFiles, timestamp: now })
            );
          } else {
            console.log("No notes found for this student.");
          }
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
        setError("Failed to fetch notes. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [studentName]);

  // Group notes by subject
  const groupedNotes = notes.reduce((acc, note) => {
    if (!acc[note.subject]) {
      acc[note.subject] = [];
    }
    acc[note.subject].push(note);
    return acc;
  }, {});

  const handleSubjectClick = (subject) => {
    setExpandedSubject(expandedSubject === subject ? null : subject);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0">
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 ml-56">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-orange-500">NOTES</h1>
          {/* Removed Add Notes button as requested */}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
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

export default StudentNotes;
