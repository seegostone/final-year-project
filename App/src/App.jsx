import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage'; // adjust path
import RegisterPage from './components/RegisterPage'; // adjust path

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* your other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;


