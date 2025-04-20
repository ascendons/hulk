import React from "react";

const AttendanceAnalytics = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
      <div className="text-center">
        {/* ClassMate Header with Icon */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src="/studenticon.png"
            alt="ClassMate Icon"
            className="w-8 h-8 mr-2"
          />
          <h1 className="text-4xl font-bold text-black">CLASSMATE</h1>
        </div>

        {/* Coming Soon Text with Gradient Colors */}
        <h1 className="text-6xl md:text-8xl font-bold mb-4">
          <span className="text-purple-500">C</span>
          <span className="text-pink-500">O</span>
          <span className="text-blue-500">M</span>
          <span className="text-purple-500">I</span>
          <span className="text-pink-500">N</span>
          <span className="text-blue-500">G</span>
          <span className="text-transparent"> </span>
          <span className="text-purple-500">S</span>
          <span className="text-pink-500">O</span>
          <span className="text-blue-500">O</span>
          <span className="text-purple-500">N</span>
          <span className="text-blue-500">!</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-gray-600">
          We are currently working hard on this page!
        </p>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
