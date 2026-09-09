import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import BookAppointment from "./pages/BookAppointment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Unauthorized from "./pages/Unauthorized";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientProfile from "./pages/patient/PatientProfile";

// Doctor Layout & Pages
import DoctorLayout from "./layouts/DoctorLayout";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorProfile from "./pages/doctor/DoctorProfile";

// Admin Layout & Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/AdminDoctors";
import CreateDoctor from "./pages/admin/CreateDoctor";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminUserRegistration from "./pages/admin/AdminUserRegistration";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminSchedules from "./pages/admin/AdminSchedules";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminDatabaseReset from "./pages/admin/AdminDatabaseReset";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:doctorId" element={<BookAppointment />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Appointment Booking (Patient Only or Guest with redirect) */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <BookAppointment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/:doctorId"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <BookAppointment />
          </ProtectedRoute>
        }
      />

      {/* Patient Portal Routes */}
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />

      {/* Doctor Portal Routes (Protected under DoctorLayout) */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Legacy Doctor Route Redirections */}
      <Route path="/dashboard" element={<Navigate to="/doctor/dashboard" replace />} />
      <Route path="/schedule" element={<Navigate to="/doctor/schedule" replace />} />

      {/* Admin Portal (Protected under AdminLayout) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="doctors/new" element={<CreateDoctor />} />
        <Route path="doctors/:doctorId/edit" element={<CreateDoctor />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="users" element={<AdminUserRegistration />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="schedules" element={<AdminSchedules />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="reset" element={<AdminDatabaseReset />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;