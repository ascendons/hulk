import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../config";
import { FiChevronRight } from "react-icons/fi";
import { AuthContext } from "../../authContext";

const Syllabus = () => {
  const {
    userId,
    loading: authLoading,
    error: authError,
  } = useContext(AuthContext);
  const [syllabusData, setSyllabusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSyllabusData = async () => {
      console.log("Auth Loading:", authLoading);
      console.log("Auth Error:", authError);
      console.log("User ID from AuthContext:", userId);

      if (authLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !userId) {
          setError("User not authenticated or userId is unavailable.");
          setIsLoading(false);
          return;
        }

        const q = query(
          collection(db, "syllabus"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot:", querySnapshot);

        const data = querySnapshot.docs.map((doc) => {
          const docData = doc.data();
          console.log("Document Data:", docData);

          // Compute the class name (e.g., TYBSCIT A)
          const year = docData.year || "N/A";
          const department = docData.department || "N/A";
          const division = docData.division || "N/A";

          // Format the year (e.g., "Third Year" to "TY")
          const yearPrefix =
            year === "Third Year"
              ? "TY"
              : year === "Second Year"
              ? "SY"
              : year === "First Year"
              ? "FY"
              : year;

          // Format the department (e.g., "BSc.IT" to "BSCIT")
          const formattedDepartment = department
            .replace(/\./g, "")
            .toUpperCase();

          // Combine to form the class name
          const className = `${yearPrefix}${formattedDepartment} ${division}`;

          return {
            id: doc.id,
            subject: docData.subject || "N/A",
            lectureTaken: docData.unit || 0,
            completion: docData.progress
              ? `${parseProgressToPercentage(docData.progress)}%`
              : "0%",
            department: docData.department || "N/A",
            year: docData.year || "N/A",
            division: docData.division || "N/A",
            class: className, // Add the computed class field
          };
        });

        console.log("Mapped Syllabus Data:", data);
        setSyllabusData(data);
      } catch (error) {
        console.error("Error fetching syllabus data:", error);
        setError("Failed to fetch syllabus data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyllabusData();
  }, [userId, authLoading]);

  const parseProgressToPercentage = (progress) => {
    const progressMap = {
      "In Progress": 50,
      Completed: 100,
      "Not Started": 0,
    };
    return progressMap[progress] || 0;
  };

  const handleSyllabusClick = (subject) => {
    navigate(`/syllabustracker/${subject}`);
  };

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  if (authLoading || isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (authError || error) {
    console.log("Error condition triggered:", authError || error);
    if (
      error === "User not authenticated or userId is unavailable." &&
      !auth.currentUser
    ) {
      return <Navigate to="/signup" replace />;
    }
    return (
      <div className="text-center py-10 text-red-500">{authError || error}</div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-4">
        <button
          onClick={handleBackClick}
          className="flex items-center text-blue-800 hover:text-blue-600 mr-4"
          aria-label="Go back to dashboard"
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
        <h1 className="text-3xl font-bold text-blue-600">Syllabus</h1>
      </div>
      {syllabusData.length === 0 ? (
        <p className="text-center text-gray-600">
          No syllabus data available for you.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex text-sm font-medium text-gray-700 bg-gray-200 py-3 px-4 rounded-t-lg">
            <div className="w-1/4">Subject</div>
            <div className="w-1/4 text-center">Class</div>{" "}
            {/* New Class column */}
            <div className="w-1/4 text-center">Lecture Taken</div>
            <div className="w-1/4 text-center">Completion</div>
          </div>
          {syllabusData.map((item) => (
            <div
              key={item.id}
              className="flex items-center bg-white shadow-md rounded-lg py-3 px-4 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleSyllabusClick(item.subject)}
            >
              <div className="w-1/4">
                <span className="inline-block bg-blue-700 text-white px-4 py-1 rounded-lg">
                  {item.subject}
                </span>
              </div>
              <div className="w-1/4 text-center">{item.class}</div>{" "}
              {/* Display the computed class */}
              <div className="w-1/4 text-center">{item.lectureTaken}</div>
              <div className="w-1/4 text-center">{item.completion}</div>
              <div className="w-1/12 text-right">
                <FiChevronRight className="text-gray-500 hover:text-gray-700" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Syllabus;
