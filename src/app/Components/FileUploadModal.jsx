// src/Components/FileUploadModal.jsx
import React from "react";

const FileUploadModal = ({ isOpen, onClose, onFileUpload }) => {
  const [selectedFile, setSelectedFile] = React.useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      onFileUpload(file); // Call onFileUpload with the selected file
      onClose(); // Close the modal after selecting a file
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4">Upload File</h2>
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 w-full hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600"
        >
          Browse
        </label>
        <button
          onClick={onClose}
          className="ml-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FileUploadModal;
