import React, { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import setDoc and getDoc
import { db } from "../../config"; // Firestore configuration
import Sidebar from "../Components/Sidebar"; // Import Sidebar component

const EditTimetable = () => {
  const [day, setDay] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // State for sidebar hover

  const handleSave = async () => {
    if (!day || !location || !subject || !teacher || !startTime || !endTime) {
      alert("Please fill in all fields before saving!");
      return;
    }

    const timetableEntry = {
      location,
      subject,
      teacher,
      timeSlot: `${startTime} to ${endTime}`,
    };

    try {
      const dayDocRef = doc(db, `timetable/Bsc.IT/Third Year/${day}`);
      const dayDoc = await getDoc(dayDocRef);

      let lectures = [];
      if (dayDoc.exists()) {
        lectures = dayDoc.data().lectures || [];
      }

      // Add new lecture to existing lectures
      lectures.push(timetableEntry);

      await setDoc(dayDocRef, { lectures });
      alert("Timetable entry saved successfully!");
    } catch (error) {
      console.error("Error saving timetable entry:", error);
      alert("Failed to save timetable entry. Please try again.");
    }

    // Clear fields after saving
    setDay("");
    setLocation("");
    setSubject("");
    setTeacher("");
    setStartTime("");
    setEndTime("");
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
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white shadow-md rounded-lg p-8 w-96">
          <h1 className="text-center text-2xl font-bold mb-6">
            EDIT TIMETABLE
          </h1>

          {/* Select Day */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full border rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Choose Day
              </option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter Location"
              className="w-full border rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter Subject"
              className="w-full border rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Teacher */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Teacher
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Enter Teacher Name"
              className="w-full border rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Slot */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Time Slot
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-1/2 border rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">TO</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-1/2 border rounded-lg py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTimetable;
