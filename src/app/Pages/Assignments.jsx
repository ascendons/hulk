import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Sidebar from "../Components/Sidebar";
import supabase from "../../supabaseclient";

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filter, setFilter] = useState("mine"); // "mine" or "all"

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

  useEffect(() => {
    const fetchAssignments = async () => {
      if (userName) {
        try {
          setIsLoading(true);
          setError("");
          
          let q;
          if (filter === "mine") {
            q = query(
              collection(db, "assignments"),
              where("assignedBy", "==", userName)
            );
          } else {
            q = query(collection(db, "assignments"));
          }

          const querySnapshot = await getDocs(q);
          const fetchedAssignments = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const assignmentData = doc.data();
              if (assignmentData.filePath) {
                const { data: fileData } = await supabase
                  .storage
                  .from('assignments')
                  .getPublicUrl(assignmentData.filePath);
                return {
                  id: doc.id,
                  ...assignmentData,
                  fileURL: fileData.publicUrl,
                };
              }
              return {
                id: doc.id,
                ...assignmentData,
              };
            })
          );
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
  }, [userName, filter]);

  const handleAddAssignments = () => {
    navigate("/add-assignment");
  };

  const handleViewAssignment = (id) => {
    navigate(`/assignment/${id}`);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleDeleteAssignment = async (id, filePath) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await deleteDoc(doc(db, "assignments", id));
        if (filePath) {
          await supabase.storage.from('assignments').remove([filePath]);
        }
        setAssignments(assignments.filter(assignment => assignment.id !== id));
      } catch (error) {
        console.error("Error deleting assignment:", error);
        setError("Failed to delete assignment. Please try again.");
      }
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      const assignmentRef = doc(db, "assignments", selectedAssignment.id);
      await updateDoc(assignmentRef, {
        subject: selectedAssignment.subject,
        description: selectedAssignment.description,
        dueDate: selectedAssignment.dueDate,
        marks: selectedAssignment.marks
      });
      
      setAssignments(assignments.map(assignment => 
        assignment.id === selectedAssignment.id ? selectedAssignment : assignment
      ));
      setIsEditModalOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error("Error updating assignment:", error);
      setError("Failed to update assignment. Please try again.");
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex">
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      <div className="flex-grow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ASSIGNMENTS</h1>
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="mine">My Assignments</option>
              <option value="all">All Assignments</option>
            </select>
            <button
              onClick={handleAddAssignments}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Assignment
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">Loading assignments...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded-lg p-4 border border-gray-300 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleViewAssignment(assignment.id)}
                  >
                    <h1 className="text-lg font-bold text-gray-700">{assignment.subject}</h1>
                    <p className="text-sm text-gray-600">{assignment.description}</p>
                    <p className="text-sm text-gray-600">Due Date: {assignment.dueDate}</p>
                    <p className="text-sm text-gray-600">Marks: {assignment.marks}</p>
                    <p className="text-sm text-gray-600">Created by: {assignment.assignedBy}</p>
                    {assignment.fileURL && (
                      <a
                        href={assignment.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 underline"
                      >
                        Download File
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {assignment.assignedBy === userName && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAssignment(assignment);
                          }}
                          className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssignment(assignment.id, assignment.filePath);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <p className="text-gray-600 text-center">No assignments available.</p>
          </div>
        )}
      </div>

      {/* Edit Assignment Modal */}
      {isEditModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Assignment</h2>
            <form onSubmit={handleUpdateAssignment}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={selectedAssignment.subject}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    subject: e.target.value
                  })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={selectedAssignment.description}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    description: e.target.value
                  })}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={selectedAssignment.dueDate}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    dueDate: e.target.value
                  })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Marks</label>
                <input
                  type="number"
                  value={selectedAssignment.marks}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    marks: e.target.value
                  })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;