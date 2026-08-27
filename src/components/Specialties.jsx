import {
  UserRound,
  Baby,
  HeartPulse,
  Smile,
  Microscope,
} from "lucide-react";

function Specialties() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-8">
          <p className="text-blue-900 text-xl font-bold uppercase">
            Our Services
          </p>

          <h1 className="text-sky-600 text-2xl font-bold mt-2">
            Explore Our Medical Specialties
          </h1>

          <p className="text-gray-800 text-sm max-w-2xl mx-auto mt-3">
            Find the right specialist for your healthcare needs and get
            professional care from trusted doctors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">

          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <UserRound size={28} className="text-[#085A93] mx-auto mb-4" />

            <h2 className="text-[#102A43] font-bold text-sm">
              General Physician
            </h2>

            <p className="text-gray-500 text-xs mt-2">
              Complete primary healthcare
            </p>

            <p className="text-[#085A93] text-xs font-semibold mt-4">
              View Doctors →
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <Baby size={28} className="text-[#085A93] mx-auto mb-4" />

            <h2 className="text-[#102A43] font-bold text-sm">
              Pediatrics
            </h2>

            <p className="text-gray-500 text-xs mt-2">
              Expert care for children
            </p>

            <p className="text-[#085A93] text-xs font-semibold mt-4">
              View Doctors →
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <HeartPulse size={28} className="text-[#085A93] mx-auto mb-4" />

            <h2 className="text-[#102A43] font-bold text-sm">
              Cardiology
            </h2>

            <p className="text-gray-500 text-xs mt-2">
              Specialized heart care
            </p>

            <p className="text-[#085A93] text-xs font-semibold mt-4">
              View Doctors →
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <Smile size={28} className="text-[#085A93] mx-auto mb-4" />

            <h2 className="text-[#102A43] font-bold text-sm">
              Dentistry
            </h2>

            <p className="text-gray-500 text-xs mt-2">
              Healthy smiles for everyone
            </p>

            <p className="text-[#085A93] text-xs font-semibold mt-4">
              View Doctors →
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition">
            <Microscope size={28} className="text-[#085A93] mx-auto mb-4" />

            <h2 className="text-[#102A43] font-bold text-sm">
              Dermatology
            </h2>

            <p className="text-gray-500 text-xs mt-2">
              Healthy skin and care
            </p>

            <p className="text-[#085A93] text-xs font-semibold mt-4">
              View Doctors →
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Specialties;