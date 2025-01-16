import React, { useState, useEffect } from "react";
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, storage } from "../../config"; // Adjust to your Firebase config path
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CreateNotice = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [noticeBy, setNoticeBy] = useState(""); // For "Notice by"
  const [loading, setLoading] = useState(false);

  // Fetch the current user's name from Firestore
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid; // Get the logged-in user's ID dynamically
        if (!userId) {
          console.error("User is not logged in");
          return;
        }
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setNoticeBy(userDoc.data().name); // Set the user's name
        } else {
          console.error("User document not found");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileURL = "";
      if (file) {
        // Upload file to Firebase Storage
        const fileRef = ref(storage, `notices/${file.name}`);
        await uploadBytes(fileRef, file);
        fileURL = await getDownloadURL(fileRef);
      }

      // Add notice to Firestore
      const newNotice = {
        title,
        content,
        file: fileURL,
        category,
        tag,
        createdAt: new Date().toISOString(),
        noticeBy, // Include "Notice by" field
      };

      const noticeRef = doc(collection(db, "notices"));
      await setDoc(noticeRef, newNotice);

      alert("Notice created successfully!");
      setTitle("");
      setContent("");
      setFile(null);
      setCategory("");
      setTag("");
    } catch (error) {
      console.error("Error creating notice:", error);
      alert("Failed to create notice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="p-6 rounded-lg shadow-lg bg-white max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create Notice</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <label className="font-semibold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded"
            placeholder="Enter title"
            required
          />

          {/* Content */}
          <label className="font-semibold">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="p-2 border rounded"
            placeholder="Enter content"
            required
            rows="5"
          ></textarea>

          {/* File Upload */}
          <label className="font-semibold">Upload File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="p-2 border rounded"
          />

          {/* Category Dropdown */}
          <label className="font-semibold">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border rounded"
            required
          >
            <option value="" disabled>
              Select category
            </option>
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
            <option value="news">News</option>
          </select>

          {/* Tags Dropdown */}
          <label className="font-semibold">Tag</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="p-2 border rounded"
            required
          >
            <option value="" disabled>
              Select a tag
            </option>
            <option value="React">React</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Tailwind">Tailwind</option>
            <option value="CSS">CSS</option>
            <option value="HTML">HTML</option>
          </select>

          {/* Notice By Display */}
          <label className="font-semibold">Notice By</label>
          <input
            type="text"
            value={noticeBy || "Loading..."}
            className="p-2 border rounded bg-gray-100"
            readOnly
          />

          {/* Submit Button */}
          <button
            type="submit"
            className={`p-2 bg-blue-500 text-white rounded ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
            }`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateNotice;
