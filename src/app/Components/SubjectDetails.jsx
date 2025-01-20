import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import { db } from "../../config";
import { collection, query, where, getDocs } from "firebase/firestore";

const SubjectDetails = () => {
  const { subjectName } = useParams();
  const [notes, setNotes] = useState([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const q = query(
          collection(db, "Notes"),
          where("subject", "==", subjectName)
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };

    fetchNotes();
  }, [subjectName]);

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
        {/* Header Section */}
        <div className="relative w-full h-48 bg-gray-800 text-white rounded-lg flex items-center justify-center mb-6">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 opacity-75">
            <h1 className="text-3xl font-bold">{subjectName}</h1>
          </div>
          <img
            src="https://via.placeholder.com/1500x400" // Replace with actual image URL
            alt="Subject"
            className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-30"
          />
        </div>

        <div className="flex">
          {/* Date Sidebar */}
          <div className="w-1/4 pr-4">
            <div className="bg-white shadow-lg rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">Date:</h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Notes List */}
          <div className="w-3/4">
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
                        {new Date(note.timestamp?.toDate()).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
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
                No notes available for this subject.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetails;
