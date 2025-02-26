// src/components/AddNote.js
import React, { useState, useEffect } from "react";
import { DEPARTMENTS, DIVISIONS, YEARS, SUBJECTS } from "../constants";
import { db } from "../../config"; // Import Firestore instance
import { collection, addDoc } from "firebase/firestore"; // Import addDoc for writing to Firestore
import supabase from "../../supabaseclient"; // Import Supabase client

const AddNote = () => {
  const [formData, setFormData] = useState({
    title: "new",
    description: "",
    department: "BSc.IT", // Default value from DEPARTMENTS
    division: "A", // Default value from DIVISIONS
    year: "Third Year", // Default value from YEARS
    subject: "", // Will be updated dynamically
    unit: "1",
    fileUrl: "", // To store the uploaded file URL
  });

  const [subjects, setSubjects] = useState([]); // State to store filtered subjects
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [file, setFile] = useState(null); // State to store the uploaded file

  // Filter subjects based on the selected department
  useEffect(() => {
    setLoading(true);
    setError(null); // Reset error state

    try {
      console.log("Filtering subjects for department:", formData.department);
      let filteredSubjects = SUBJECTS;  

      if (!filteredSubjects || filteredSubjects.length === 0) {
        console.log("No subjects found for department:", formData.department);
        setSubjects([]);
        setFormData((prev) => ({ ...prev, subject: "" }));
        setError("No subjects available for the selected department.");
        return;
      }

      console.log("Filtered subjects:", filteredSubjects);
      setSubjects(filteredSubjects);

      if (filteredSubjects.length > 0) {
        setFormData((prev) => ({
          ...prev,
          subject: filteredSubjects[0],
        }));
      } else {
        setFormData((prev) => ({ ...prev, subject: "" }));
      }
    } catch (error) {
      console.error("Error filtering subjects:", error);
      setError("Failed to filter subjects. Check console for details.");
      setSubjects([]);
      setFormData((prev) => ({ ...prev, subject: "" }));
    } finally {
      setLoading(false);
    }
  }, [formData.department]); // Re-run when department changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let fileUrl = null;
      if (file) {
        // Upload file to Supabase storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("notes") 
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("notes")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      const notesRef = collection(db, "Notes");
      await addDoc(notesRef, {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        division: formData.division,
        year: formData.year,
        subject: formData.subject,
        unit: formData.unit,
        fileUrl: fileUrl, // Save the file URL
        timestamp: new Date().toISOString(), // Optional: Add a timestamp for when the note was created
      });

      console.log("Note added successfully to Firestore!");
      // Reset the form
      setFormData({
        title: "new",
        description: "",
        department: "BSc.IT",
        division: "A",
        year: "Third Year",
        subject: "",
        unit: "1",
        fileUrl: "",
      });
      setSubjects(SUBJECTS); // Reset subjects to default (for BSc.IT)
      setFile(null); // Reset file input
    } catch (error) {
      console.error("Error adding note to Firestore:", error);
      setError("Failed to save note. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0">
      <div className="w-full h-full bg-white border border-gray-300 rounded-lg p-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-6 h-full"
        >
          {/* Left Column: Title, Description, and Attachments */}
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Add Note</h2>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-32"
              ></textarea>
            </div>

            

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload File
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* Right Column: Department, Division, Year, Subject, Unit, and POST Button */}
          <div className="w-full md:w-1/2 flex flex-col justify-between">
            {/* Department */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Division
              </label>
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                {Object.values(YEARS).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject (Dropdown based on department from constants) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-gray-500">Loading subjects...</p>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <input
                type="number"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Submitting..." : "POST"}
            </button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNote;