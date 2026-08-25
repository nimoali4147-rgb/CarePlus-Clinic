import { HeartPulse } from "lucide-react";

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">

        {/* Logo */}
       

        {/* Links */}
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

        {/* Copyright */}
        <p className="text-md font-bold  text-sky-700">
          © 2026 CarePlus Clinic
        </p>

      </div>
    </footer>
  );
}

export default Footer;