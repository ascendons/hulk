import React from 'react';
 

const Attendence = () => {
  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-4">Student Details</h1>
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">Name</th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">Age</th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">Grade</th>
            <th className="py-2 px-4 border-b-2 border-gray-200 text-left">Email</th>
          </tr>
        </thead>
        <tbody>
          {/* {students.map((student, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b border-gray-200">{student.name}</td>
              <td className="py-2 px-4 border-b border-gray-200">{student.age}</td>
              <td className="py-2 px-4 border-b border-gray-200">{student.grade}</td>
              <td className="py-2 px-4 border-b border-gray-200">{student.email}</td>
            </tr>
          ))} */}
        </tbody>
      </table>
    </div>
  );
};

export default Attendence;
