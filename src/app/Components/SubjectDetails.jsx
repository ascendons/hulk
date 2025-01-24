import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import { db } from "../../config";
import { collection, query, where, getDocs } from "firebase/firestore";

const SubjectDetails = ({ userDepartment }) => {
  const { subjectName } = useParams();
  const [notes, setNotes] = useState([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      console.log("Fetching notes for subject:", subjectName);
      console.log("Fetching notes for department:", userDepartment);

      try {
        const q = query(
          collection(db, "Notes"),
          where("subject", "==", subjectName),
          where("department", "==", userDepartment) // Filter by department
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched Notes:", fetchedNotes);
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };

    fetchNotes();
  }, [subjectName, userDepartment]);

  return (
    <div className="flex min-h-screen bg-gray-100">
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
      <div className="flex-grow p-6">
        <h1 className="text-2xl font-bold">Notes</h1>
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white shadow-lg rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h2 className="text-lg font-bold">{note.title}</h2>
                  <p className="text-gray-600">{note.description}</p>
                  <p className="text-sm text-gray-500">
                    Posted on:{" "}
                    {note.timestamp
                      ? new Date(note.timestamp.toDate()).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Unknown"}
                  </p>
                </div>
                <div className="flex space-x-4">
                  {note.fileURL && (
                    <a
                      href={note.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      Download
                    </a>
                  )}
                  {note.youtubeLink && (
                    <a
                      href={note.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 underline"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            No notes available for this subject and department.
          </p>
        )}
      </div>
    </div>
  );
};

export default SubjectDetails;
