import Navbar from "../components/Navbar"
import Cards from "../components/Cards"
import Footer from "../components/Footer"
import Specialties from "../components/Specialties"

function Home () {
  return (
<div className="min-h-screen bg-slate-50">
    <Navbar />
    <main>
    <Cards />
    <Specialties />
    </main>
    <Footer/>
    </div>
 )
}

export default Home