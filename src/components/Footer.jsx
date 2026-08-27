

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 ml-20 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#about"
            className="text-md font-bold  text-sky-700 hover:text-blue-600"
          >
            About Us
          </a>

          <a
            href="#services"
            className="text-md font-bold text-sky-700 hover:text-blue-600"
          >
            Services
          </a>

          <a
            href="#contact"
            className="text-md font-bold  text-sky-700 hover:text-blue-600"
          >
            Contact
          </a>

          <a
            href="#privacy"
            className="text-md font-bold  text-sky-700 hover:text-blue-600"
          >
            Privacy Policy
          </a>
        </div>

     
        <p className="text-md font-bold mr-20 text-sky-700">
          © 2026 CarePlus Clinic
        </p>

      </div>
    </footer>
  );
}


export default Footer;
