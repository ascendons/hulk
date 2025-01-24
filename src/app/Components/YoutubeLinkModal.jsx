import React from "react";

const YoutubeLinkModal = ({ youtubeLink, setYoutubeLink, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl p-8 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Add YouTube Link</h2>
        <form onSubmit={onSubmit}>
          <input
            type="url"
            placeholder="Paste YouTube URL"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            required
          />
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="bg-gray-300 text-black py-2 px-6 rounded-lg hover:bg-gray-400"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
            >
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default YoutubeLinkModal;