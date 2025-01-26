import React from "react";

const FileUploadModal = ({ onFileUpload, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-center">Upload File</h2>
        <div className="flex flex-col items-center justify-center space-y-6">
          <label
            htmlFor="file-upload"
            className="bg-blue-500 text-white py-3 px-8 rounded-lg cursor-pointer hover:bg-blue-600 text-center"
          >
            Browse
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={onFileUpload}
          />
          <button
            type="button"
            className="bg-gray-300 text-black py-2 px-8 rounded-lg hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;