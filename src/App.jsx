import { Routes, Route } from "react-router-dom";
import Doctors from "./pages/Doctors";
import Home from "./pages/Home";
import BookAppointment from "./pages/BookAppointment";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import DoctorDashboard from "./pages/DoctorDashbord";
import Schedule from "./pages/Schedule";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/booking" element={<BookAppointment />} />
      <Route path="/dashboard" element={<DoctorDashboard />} />
      <Route path="/schedule" element={<Schedule />} />
    </Routes>
  );
}

export default App;