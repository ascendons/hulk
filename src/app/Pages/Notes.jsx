import React, { useState } from "react";
import AddNotes from "./AddNotes"; // Import the AddNotes component

const Notes = () => {
  const [showAddNotes, setShowAddNotes] = useState(false); // State to toggle AddNotes component

  const handleAddNotesClick = () => {
    setShowAddNotes(true); // Show the AddNotes component
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {!showAddNotes ? (
        <div className="bg-white shadow-lg rounded-lg w-3/4 p-6">
          <h1 className="text-2xl font-bold mb-6">NOTES</h1>
          <button
            onClick={handleAddNotesClick} // Handle click to show AddNotes
            className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600"
          >
            ADD NOTES
          </button>
        </div>
      ) : (
        <AddNotes /> // Render AddNotes component when state is true
      )}
    </div>
  );
};

export default Notes;
