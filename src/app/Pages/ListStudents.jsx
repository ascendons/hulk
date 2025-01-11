import React from "react";

const ListStudents = () => {
  const students = [
    { id: "S001", name: "John Doe", rollNo: "18" },
    { id: "S002", name: "Jane Smith", rollNo: "19" },
    { id: "S003", name: "Sam Wilson", rollNo: "20" },
    { id: "S004", name: "Chris Evans", rollNo: "21" },
    { id: "S005", name: "Emma Watson", rollNo: "22" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mt-6">
      <div className="grid grid-cols-4 bg-gray-200 p-4 text-lg font-bold">
        <div>ID NO</div>
        <div>NAME</div>
        <div>ROLL NO</div>
        <div>ACTION</div>
      </div>
      {students.map((student, index) => (
        <div key={index} className="grid grid-cols-4 p-4 items-center border-b">
          <div>{student.id}</div>
          <div>{student.name}</div>
          <div>{student.rollNo}</div>
          <button className="text-blue-500 hover:underline">See Profile</button>
        </div>
      ))}
    </div>
  );
};

export default ListStudents;
