import { Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Cards from "./component/Cards";
import Footer from "./component/Footer";
import Specialties from "./component/Specialties";

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
    </Routes>
  );
}

export default App;