import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import { auth, db } from "../../config";
import { collection, query, where, getDocs } from "firebase/firestore";

const Notes = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [department, setDepartment] = useState("");
  const navigate = useNavigate();

  // Fetch the user's department
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

  // Fetch subjects based on the user's department
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

  // Handle subject card click
  const handleSubjectClick = (subjectName) => {
    navigate(`/subject/${subjectName}`); // Navigate to the subject details page
  };

  // Navigate to Add Notes page
  const handleAddNotesClick = () => {
    navigate("/add-notes");
  };

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
        <h1 className="text-4xl font-bold mb-6">NOTES</h1>
        <button
          onClick={handleAddNotesClick}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg mb-6 font-bold hover:bg-blue-600"
        >
          ADD NOTES
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => handleSubjectClick(subject.subjectName)}
            >
              <h2 className="text-2xl font-bold mb-4">{subject.subjectName}</h2>
              <p className="text-gray-600">Subject ID: {subject.subjectId}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notes;
