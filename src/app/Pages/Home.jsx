import React from "react";

const Homes = () => {
  return (
    <div className="flex">


      {/* Main Content */}
      <div className="ml-16 w-full p-8 ">
        <h1 className="text-3xl font-bold mb-8">ADMIN PANEL</h1>

        {/* Top Stats Section */}
        <div className="grid grid-cols-3 gap-80 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6   text-center">
          <h2 className="text-lg font-bold ">Total Students</h2>
            <p className="text-2xl mt-2">200</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6  text-center">
            <h2 className="text-lg font-bold ">Total Teachers</h2>
            <p className="text-2xl mt-2">50</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6  text-center">
            <h2 className="text-lg font-bold ">Waiting Room (1)</h2>
            <p className="text-2xl mt-2">1</p>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="grid grid-cols-3 gap-4">
          {/* Students and Teachers Section */}
          <div className="col-span-2 bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between border-b pb-4">
              <h3 className="font-bold">Students</h3>
              <h3 className="font-bold">Teachers</h3>
            </div>
            <div className="mt-4 space-y-2">
              {[...Array(7)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-md shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src="https://via.placeholder.com/40"
                      alt="Student"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="ml-20">
                      <span className="">Naman Jha</span>
                    </div>
                  </div>
                  <span>18</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="font-bold text-center">SUBJECTS</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homes;