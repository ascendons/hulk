import React, { useState, useEffect } from "react";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants";
import { db } from "../../config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import supabase from "../../supabaseclient";
import FileUploadModal from "../Components/FileUploadModal";
import Sidebar from "../Components/Sidebar";

const AddNotes = () => {
  const [formData, setFormData] = useState({
    title: "new",
    description: "",
    department: "Bsc.IT",
    division: "A",
    year: "Third Year",
    subject: "",
    unit: "1",
  });

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Fetch subjects based on department
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.department) {
        setSubjects([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const subjectsRef = collection(db, "subjects");
        const q = query(subjectsRef, where("department", "==", formData.department.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("No subjects found for the selected department.");
          setSubjects([]);
          return;
        }

        const fetchedSubjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().subjectName || "Unknown",
        }));

        setSubjects(fetchedSubjects);
        setFormData((prev) => ({
          ...prev,
          subject: fetchedSubjects[0]?.name || "",
        }));
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setError("Failed to fetch subjects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [formData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (selectedFile) => {
    setFile(selectedFile);
    setIsModalOpen(false);
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
        const filePath = `notes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("notes")
          .upload(filePath, file, {
            upsert: true,
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            },
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("notes").getPublicUrl(filePath);
        supabaseFilePath = filePath;
        console.log("File uploaded successfully:", publicUrl);
      }

      await addDoc(collection(db, "notes"), {
        ...formData,
        filePath: supabaseFilePath,
        timestamp: new Date().toISOString(),
      });

      console.log("Note added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding note:", error);
      setError("Failed to save note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "new",
      description: "",
      department: "Bsc.IT",
      division: "A",
      year: "Third Year",
      subject: "",
      unit: "1",
    });
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="bg-gray-100 flex p-0">
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      <div className="w-full h-screen bg-white border border-gray-300 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 h-full">
          <div className="w-full md:w-1/2">
            <h2 className="text-5xl font-bold text-blue-600 mb-4">Add Notes</h2>
            <FormField label="Title" name="title" value={formData.title} onChange={handleChange} />
            <FormField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              isTextArea
            />
            <FileUploadSection
              file={file}
              uploadProgress={uploadProgress}
              onUploadClick={() => setIsModalOpen(true)}
            />
          </div>

          {/* Right Column: Department, Division, Year, Subject, Unit, and POST Button */}
          <div className="w-full md:w-1/2 flex flex-col justify-between">
            <FormSelect
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={DEPARTMENTS}
            />
            <FormSelect
              label="Division"
              name="division"
              value={formData.division}
              onChange={handleChange}
              options={DIVISIONS}
            />
            <FormSelect
              label="Year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              options={Object.values(YEARS)}
            />
            <FormSelect
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              options={subjects.map((subj) => subj.name)}
              isLoading={loading}
              error={error}
            />
            <FormField
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              type="number"
            />
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
          onClose={() => setIsModalOpen(false)}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

const FormField = ({ label, name, value, onChange, type = "text", isTextArea = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {isTextArea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-32"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
      />
    )}
  </div>
);

const FormSelect = ({ label, name, value, onChange, options, isLoading = false, error = null }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full border-gray-300 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const FileUploadSection = ({ file, uploadProgress, onUploadClick }) => (
  <div className="mb-6">
    <label className="block text-gray-700 font-bold mb-2">Upload File</label>
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-all"
      onClick={onUploadClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onUploadClick()}
      role="button"
      tabIndex={0}
    >
      {file ? (
        <div className="text-center">
          <p className="text-sm text-gray-600">{file.name}</p>
          <p className="text-xs text-gray-500 mt-2">Click to change file</p>
        </div>
      ) : (
        <>
          <img
            src="https://cdn-icons-png.flaticon.com/512/725/725643.png"
            alt="Upload"
            className="w-12 h-12 mb-2"
          />
          <p className="text-sm text-gray-600">Click to upload a file</p>
        </>
      )}
    </div>
    {uploadProgress > 0 && uploadProgress < 100 && (
      <div className="mt-4">
        <p className="text-sm text-gray-600">Uploading: {Math.round(uploadProgress)}%</p>
        <progress value={uploadProgress} max="100" className="w-full h-2 rounded-lg" />
      </div>
    )}
  </div>
);

export default AddNotes;