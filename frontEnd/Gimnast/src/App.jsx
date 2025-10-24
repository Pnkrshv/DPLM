import "./App.css";
import Questionnaires from "./pages/Questionnaires/Questionnaires";
import Selections from "./pages/selections/Selections";
import Maps from "./pages/maps/Maps";
import Navigation from './mainUI/Navigation/Navigation'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom';
import Survey from "./pages/Survey/Survey";
import Statistic from "./pages/statistic/Statistic";
import Auth from "./pages/auth/Auth";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  return isAuthenticated ? children : <Navigate to='/login' replace />
};

const MainLayout = () => {
  return (
    <div className="page">
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Survey />} />
          <Route path="questionnaires" element={<Questionnaires />} />
          <Route path="selections" element={<Selections />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/statistic" element={<Statistic />} />
        </Routes>
      </main>
    </div>
  )
};

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
