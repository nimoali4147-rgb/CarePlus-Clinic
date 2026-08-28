import { Routes, Route } from "react-router-dom";
import Doctors from "./pages/Doctors";
import Home from "./pages/Home";
import BookAppointment from "./pages/BookAppointment";
import Login from "./pages/Login";


function App() {
  return (
    <Routes>
     <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/login" element={<Login />} />
       <Route path="/booking" element={<BookAppointment />} />
     
    
    </Routes>
  );
}

export default App;