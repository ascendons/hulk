import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config";

const Syllabustracker = () => {
  const { subject } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const [trackerData, setTrackerData] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrackerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const q = query(
          collection(db, "syllabus"),
          where("subject", "==", subject)
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched syllabus data for subject", subject, data);

        // Group data by unit and calculate unit-level progress
        const groupedByUnit = data.reduce((acc, item) => {
          const unit = item.unit || "Extra Unit";
          if (!acc[unit]) {
            acc[unit] = [];
          }
          acc[unit].push({
            topic: item.topic || "Untitled Topic",
            progress: item.progress || "Not Started",
            completionDate: item.currentDate || "N/A",
          });
          return acc;
        }, {});

        const formattedData = Object.keys(groupedByUnit).map((unit) => {
          const topics = groupedByUnit[unit];
          const hasInProgress = topics.some(
            (topic) => topic.progress?.toLowerCase() === "in progress"
          );
          const allDone = topics.every(
            (topic) => topic.progress?.toLowerCase() === "done"
          );
          const unitStatus = hasInProgress
            ? "In Progress"
            : allDone
            ? "Complete"
            : "Not Started";

          return {
            unit,
            topics,
            unitStatus,
          };
        });

        console.log("Formatted tracker data:", formattedData);
        setTrackerData(formattedData);

        // Calculate overall completion percentage
        const totalTopics = data.length;
        const completedTopics = data.filter(
          (item) => item.progress?.toLowerCase() === "done"
        ).length;
        const percentage =
          totalTopics > 0
            ? Math.round((completedTopics / totalTopics) * 100)
            : 0;
        setCompletionPercentage(percentage);
      } catch (error) {
        console.error("Error fetching syllabus tracker data:", error);
        setError(
          "Failed to fetch syllabus tracker data. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackerData();
  }, [subject]);

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  const handleBackClick = () => {
    navigate("/syllabus"); // Navigate back to the Syllabus page
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Back Button and Header */}
      <div className="flex items-center mb-4">
        <button
          onClick={handleBackClick}
          className="flex items-center text-blue-800 hover:text-blue-600 mr-4"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-blue-800">{subject}</h1>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800">
          Completion: {completionPercentage}%
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-600 rounded-full mr-2"></span>
            <span className="text-sm text-gray-600">Complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-red-600 rounded-full mr-2"></span>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
        </div>
      </div>

      {trackerData.length === 0 ? (
        <p className="text-center text-gray-600">
          No syllabus tracker data available for {subject}.
        </p>
      ) : (
        <div className="space-y-4">
          {trackerData.map((unitData, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  {unitData.unit === "Extra Unit"
                    ? "Extra Unit"
                    : `Unit ${unitData.unit}`}
                </h2>
                <div className="flex items-center">
                  <span
                    className={`w-4 h-4 rounded-full mr-2 ${
                      unitData.unitStatus === "Complete"
                        ? "bg-green-600"
                        : unitData.unitStatus === "In Progress"
                        ? "bg-red-600"
                        : "bg-gray-400"
                    }`}
                  ></span>
                  <span className="text-sm text-gray-600">
                    {unitData.unitStatus}
                  </span>
                </div>
              </div>
              {unitData.topics.map((topicData, topicIndex) => (
                <div
                  key={topicIndex}
                  className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-gray-700">{topicData.topic}</p>
                    <p className="text-sm text-gray-500">
                      Completion date: {topicData.completionDate}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`w-4 h-4 rounded-full ${
                        topicData.progress?.toLowerCase() === "done"
                          ? "bg-green-600"
                          : topicData.progress?.toLowerCase() === "in progress"
                          ? "bg-red-600"
                          : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Syllabustracker;
