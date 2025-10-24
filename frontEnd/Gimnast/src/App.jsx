import "./App.css";
import Questionnaires from "./pages/Questionnaires/Questionnaires";
import MainPage from "./mainUI/MainPage/MainPage";
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Survey from "./pages/Suervey/Survey";

function App() {
  return (
    <div>
      <BrowserRouter>
        <div className="page"> 
          <MainPage/>
          <main>
            <Routes>
              <Route path="/" element={<Survey />} />
              <Route path="questionnaires" element={<Questionnaires />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
