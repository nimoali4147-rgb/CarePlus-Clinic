import { Routes, Route } from "react-router-dom";
import Doctors from "./pages/Doctors";
import BookAppointment from "./pages/BookAppointment";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
     <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/booking" element={<BookAppointment />} />
    </Routes>
  );
}

export default App;