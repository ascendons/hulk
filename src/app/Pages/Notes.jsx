import React, { useState, useEffect } from "react";
import AddNotes from "./AddNotes"; // Import the AddNotes component
import Sidebar from "../Components/Sidebar"; // Import the Sidebar component
import { auth, db } from "../../config"; // Import your Firebase configuration
import { collection, query, where, getDocs } from "firebase/firestore";

const Notes = () => {
  const [view, setView] = useState(""); // State to toggle views
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Sidebar hover state
  const [subjects, setSubjects] = useState([]); // State to store fetched subjects
  const [department, setDepartment] = useState(""); // User's department

  const handleAddNotesClick = () => {
    setView("AddNotes"); // Switch to AddNotes view
  };

  useEffect(() => {
    const fetchUserDepartment = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(db, "teachersinfo"),
            where("teacheremail", "==", user.email)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setDepartment(userData.department);
          }
        }
      } catch (error) {
        console.error("Error fetching user department:", error);
      }
    };

    fetchUserDepartment();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (department) {
          const q = query(
            collection(db, "subjects"),
            where("department", "==", department)
          );
          const querySnapshot = await getDocs(q);
          const fetchedSubjects = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSubjects(fetchedSubjects);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [department]);

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
        {view === "AddNotes" ? (
          <AddNotes />
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">NOTES</h1>
            <button
              onClick={handleAddNotesClick}
              className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 mb-6"
            >
              ADD NOTES
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-white shadow-lg rounded-lg p-6"
                >
                  <h2 className="text-xl font-bold mb-4">
                    {subject.subjectName}
                  </h2>
                  <p className="text-gray-600">
                    Subject ID: {subject.subjectId}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notes;
