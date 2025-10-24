import "./App.css";
import Questionnaires from "./pages/Questionnaires/Questionnaires";
import Selections from "./pages/selections/Selections"
import Maps from "./pages/maps/Maps"
import MainPage from "./mainUI/MainPage/MainPage";
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Survey from "./pages/Suervey/Survey";
import Statistic from "./pages/statistic/Statistic"

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
              <Route path="selections" element={<Selections />} />
              <Route path="/maps" element={<Maps />} />
              <Route path="/statistic" element={<Statistic />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
