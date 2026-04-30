import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage'; // adjust path
import RegisterPage from './components/RegisterPage'; // adjust path
import { TasksAssignmentDashboard } from './components/TaskAssignmentDashboard';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import TaskResolution from './components/TaskResolution';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<TasksAssignmentDashboard />} />
        <Route path="/complaint-submission" element={<ComplaintSubmission />} />
        <Route path="/task-resolution" element={<TaskResolution />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


