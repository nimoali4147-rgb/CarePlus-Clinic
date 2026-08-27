import { Routes, Route } from "react-router-dom";
import Doctors from "./pages/Doctors";
import Home from "./pages/Home";


function App() {
  return (
    <Routes>
     <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
     
    
    </Routes>
  );
}

export default App;