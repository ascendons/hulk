// src/components/AddNotes.jsx
import React, { useState, useEffect } from "react";
import { DEPARTMENTS, DIVISIONS, YEARS, SUBJECTS } from "../constants";
import { db } from "../../config"; // Import Firestore instance
import { collection, addDoc } from "firebase/firestore"; // Import addDoc for writing to Firestore
import supabase from "../../supabaseclient"; // Import Supabase client
import FileUploadModal from "../Components/FileUploadModal"; // Import the FileUploadModal component

const AddNotes = () => {
  const [formData, setFormData] = useState({
    title: "new",
    description: "",
    department: "BSc.IT", // Default value from DEPARTMENTS
    division: "A", // Default value from DIVISIONS
    year: "Third Year", // Default value from YEARS
    subject: "", // Will be updated dynamically
    unit: "1",
  });

  const [subjects, setSubjects] = useState([]); // State to store filtered subjects
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [file, setFile] = useState(null); // State to store the selected file
  const [uploadProgress, setUploadProgress] = useState(0); // State for upload progress

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

  const handleFileUpload = (selectedFile) => {
    console.log("File selected in modal:", selectedFile); // Debug log
    setFile(selectedFile);
    setIsModalOpen(false); // Close the modal after selecting a file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let supabaseFilePath = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `notes/${fileName}`; // Use a folder 'notes' in Supabase storage

        const { error: uploadError } = await supabase.storage
          .from("notes") // Supabase bucket name
          .upload(filePath, file, {
            upsert: true,
            onUploadProgress: (progressEvent) => {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            },
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("notes").getPublicUrl(filePath);

        supabaseFilePath = filePath; // Store the Supabase file path
        console.log("File uploaded successfully to Supabase:", publicUrl);
      }

      const notesRef = collection(db, "notes");
      await addDoc(notesRef, {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        division: formData.division,
        year: formData.year,
        subject: formData.subject,
        unit: formData.unit,
        filePath: supabaseFilePath, // Save the Supabase file path instead of URL
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
      });
      setSubjects(SUBJECTS); // Reset subjects to default (for BSc.IT)
      setFile(null); // Reset file
      setUploadProgress(0); // Reset upload progress
    } catch (error) {
      console.error("Error adding note to Firestore or uploading file:", error);
      setError(
        "Failed to save note or upload file. Check console for details."
      );
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
          {/* Left Column: Title, Description, and File Upload */}
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

            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                Upload File
              </label>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-all"
                onClick={() => {
                  console.log("Drop zone clicked, opening modal"); // Debug log
                  setIsModalOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    console.log("Drop zone key pressed, opening modal");
                    setIsModalOpen(true);
                  }
                }}
                role="button"
                tabIndex={0} // Make it focusable for accessibility
              >
                {file ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <>
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/725/725643.png"
                      alt="Upload"
                      className="w-12 h-12 mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      Click to upload a file
                    </p>
                  </>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Uploading: {Math.round(uploadProgress)}%
                  </p>
                  <progress
                    value={uploadProgress}
                    max="100"
                    className="w-full h-2 rounded-lg"
                  />
                </div>
              )}
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

            {/* Unit */}
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

            {/* POST Button */}
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

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log("Modal closed"); // Debug log
            setIsModalOpen(false);
          }}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default AddNotes;
