import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./components/DashboardNew";
import StudentProfilePublic from "./components/StudentProfilePublic";
import ChallengesManager from "./components/ChallengesManager";
import ViewerPage from "./components/ViewerPage";
import LoginPage from "./components/LoginPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("ghiras_token"));

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("ghiras_token");
    setToken(null);
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
