import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config";
import { collection, query, where, getDocs } from "firebase/firestore";
import Sidebar from "../Components/Sidebar";

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [userName, setUserName] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Fetch user data to get the username of the logged-in user
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
          setUserName(userData.name); // Set username
        }
      }
    };

    const fetchAssignments = async () => {
      try {
        await fetchUserData(); // Wait for username to be fetched
        if (userName) {
          const q = query(
            collection(db, "Assignments"),
            where("assignedBy", "==", userName) // Filter by assignedBy
          );
          const querySnapshot = await getDocs(q);
          const fetchedAssignments = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAssignments(fetchedAssignments); // Store assignments
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, [userName]);

  // Navigate to the Add Assignment page
  const handleAddAssignments = () => {
    navigate("/add-assignment");
  };

  // Navigate to the Assignment Detail page
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
            ADD ASSIGNMENTS
          </button>
        </div>
        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-300 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewAssignment(assignment.id)} // Redirect to detail page
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
