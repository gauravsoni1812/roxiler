import { BrowserRouter, Routes , Route} from "react-router-dom";
import Home from './components/Home';
import Chart from "./components/Chart";
import PieChart from "./components/pieChart";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/barchart" element={<Chart />} />
        <Route path="/piechart" element={<PieChart/>} />
        {/* Add more Route components for other views */}
      </Routes>
    </BrowserRouter>
  );
}
