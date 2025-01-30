import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config";
import { collection, query, where, getDocs } from "firebase/firestore";
import Sidebar from "../Components/Sidebar";

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", user.email)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserName(userData.name);
        }
      }
    };

    fetchUserData();
  }, []);

  // Fetch assignments based on the username
  useEffect(() => {
    const fetchAssignments = async () => {
      if (userName) {
        try {
          setIsLoading(true);
          setError("");
          const q = query(
            collection(db, "Assignments"),
            where("assignedBy", "==", userName)
          );
          const querySnapshot = await getDocs(q);
          const fetchedAssignments = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAssignments(fetchedAssignments);
        } catch (error) {
          console.error("Error fetching assignments:", error);
          setError("Failed to fetch assignments. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAssignments();
  }, [userName]);

  const handleAddAssignments = () => {
    navigate("/add-assignment");
  };

  const handleViewAssignment = (id) => {
    navigate(`/assignment/${id}`);
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
      <div className="flex-grow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ASSIGNMENTS</h1>
          <button
            onClick={handleAddAssignments}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Create Assignment
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Assignments List */}
        {isLoading ? (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">Loading assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-300 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewAssignment(assignment.id)}
              >
                <h2 className="text-lg font-bold text-gray-700">
                  {assignment.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Due Date: {assignment.dueDate}
                </p>
                <p className="text-sm text-gray-600">
                  Marks: {assignment.marks}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">
              No assignments available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
