import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Home from "./pages/Home";
import TeacherLogin from "./pages/VPLogin";
import StudentLogin from "./pages/TALogin";
import TeacherDashboard from "./pages/VPDashboard";
import StudentDashboard from "./pages/TADashboard";
import { useEffect, useState } from 'react';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Data from Neon DB</h1>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}