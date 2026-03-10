import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/DashboardNew";
import StudentProfilePublic from "./components/StudentProfilePublic";
import ChallengesManager from "./components/ChallengesManager";
import ViewerPage from "./components/ViewerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/public/:studentId" element={<StudentProfilePublic />} />
        <Route path="/challenges" element={<ChallengesManager />} />
        <Route path="/view/:viewerToken" element={<ViewerRoute />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function ViewerRoute() {
  const viewerToken = window.location.pathname.split("/view/")[1];
  return <ViewerPage token={viewerToken} />;
}

export default App;
