import { Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Cards from "./component/Cards";
import Footer from "./component/Footer";
import Specialties from "./component/Specialties";
import Doctors from "./pages/Doctors";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Cards />
            <Specialties />
            <Footer />
          </>
        }
      />

      <Route path="/doctors" element={<Doctors />} />
    </Routes>
  );
}

export default App;