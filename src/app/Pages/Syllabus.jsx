import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config"; // Ensure db is imported from your config

const Syllabus = () => {
  const [syllabusData, setSyllabusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSyllabusData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const syllabusCollection = collection(db, "syllabus");
        const querySnapshot = await getDocs(syllabusCollection);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSyllabusData(data);
      } catch (error) {
        console.error("Error fetching syllabus data:", error);
        setError("Failed to fetch syllabus data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyllabusData();
  }, []);

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-green-500 mb-6 text-center">
        Syllabus
      </h1>
      {syllabusData.length === 0 ? (
        <p className="text-center text-gray-600">No syllabus data available.</p>
      ) : (
        <div className="space-y-6">
          {syllabusData.map((item) => (
            <div
              key={item.id}
              className="bg-white shadow-lg rounded-lg p-4 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-800">
                Subject: {item.subject}
              </h2>
              <p className="text-gray-600">
                <strong>Department:</strong> {item.department}
              </p>
              <p className="text-gray-600">
                <strong>Year:</strong> {item.year}
              </p>
              <p className="text-gray-600">
                <strong>Division:</strong> {item.division}
              </p>
              <p className="text-gray-600">
                <strong>Unit:</strong> {item.unit}
              </p>
              <p className="text-gray-600">
                <strong>Topic:</strong> {item.topic}
              </p>
              <p className="text-gray-600">
                <strong>Progress:</strong> {item.progress}
              </p>
              <p className="text-gray-600">
                <strong>Remark:</strong> {item.remark || "N/A"}
              </p>
              <p className="text-gray-600">
                <strong>Current Date:</strong> {item.currentDate}
              </p>
              <p className="text-gray-600">
                <strong>Created At:</strong>{" "}
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="text-gray-600">
                <strong>User ID:</strong> {item.userId}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Syllabus;
