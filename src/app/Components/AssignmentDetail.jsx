import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../config";
import { doc, getDoc } from "firebase/firestore";

const AssignmentDetail = () => {
  const { id } = useParams(); // Get the assignment ID from the URL
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const docRef = doc(db, "assignments", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAssignment(docSnap.data());
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
      }
    };

    fetchAssignment();
  }, [id]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {assignment ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {assignment.title}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Assigned By: {assignment.assignedBy}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Due Date: {assignment.dueDate}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Marks: {assignment.marks}
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Description: {assignment.description}
          </p>
        </div>
      ) : (
        <p className="text-gray-600">Loading assignment details...</p>
      )}
    </div>
  );
};

export default AssignmentDetail;
