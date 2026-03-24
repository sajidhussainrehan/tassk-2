import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./components/DashboardNew";
import StudentProfilePublic from "./components/StudentProfilePublic";
import ChallengesManager from "./components/ChallengesManager";
import ViewerPage from "./components/ViewerPage";
import LoginPage from "./components/LoginPage";
import ViewOnlyLogin from "./components/ViewOnlyLogin";
import ViewOnlyDashboard from "./components/ViewOnlyDashboard";
import TeacherLogin from "./components/TeacherLogin";
import TeacherDashboard from "./components/TeacherDashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("ghiras_token"));
  const [viewOnlyToken, setViewOnlyToken] = useState(localStorage.getItem("viewonly_token"));
  const [teacherToken, setTeacherToken] = useState(localStorage.getItem("teacher_token"));

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleViewOnlyLogin = (newToken) => {
    setViewOnlyToken(newToken);
  };

  const handleTeacherLogin = (newToken) => {
    setTeacherToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("ghiras_token");
    setToken(null);
  };

  const handleViewOnlyLogout = () => {
    localStorage.removeItem("viewonly_token");
    setViewOnlyToken(null);
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem("teacher_token");
    setTeacherToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} 
        />
        <Route path="/public/:studentId" element={<StudentProfilePublic />} />
        <Route 
          path="/challenges" 
          element={token ? <ChallengesManager /> : <Navigate to="/login" />} 
        />
        <Route path="/view/:viewerToken" element={<ViewerRoute />} />
        <Route 
          path="/viewonly" 
          element={viewOnlyToken ? <ViewOnlyDashboard onLogout={handleViewOnlyLogout} /> : <Navigate to="/viewonly-login" />} 
        />
        <Route 
          path="/viewonly-login" 
          element={viewOnlyToken ? <Navigate to="/viewonly" /> : <ViewOnlyLogin onLogin={handleViewOnlyLogin} />} 
        />
        <Route 
          path="/teacher" 
          element={teacherToken ? <TeacherDashboard onLogout={handleTeacherLogout} teacherData={JSON.parse(teacherToken)} /> : <Navigate to="/teacher-login" />} 
        />
        <Route 
          path="/teacher-login" 
          element={teacherToken ? <Navigate to="/teacher" /> : <TeacherLogin onLogin={handleTeacherLogin} />} 
        />
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

function ViewerRoute() {
  const viewerToken = window.location.pathname.split("/view/")[1];
  return <ViewerPage token={viewerToken} />;
}

export default App;
