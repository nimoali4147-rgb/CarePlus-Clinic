import {
  CalendarCheck,
  UserRoundCheck,
  Headset,
  HandHeart,
} from "lucide-react";

function Cards() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl">

        <div className="mb-10 text-center">
          <p className="mb-2 text-xl font-semibold uppercase tracking-wider text-emerald-400">
            Why Choose CarePlus
          </p>

          <h2 className="text-3xl font-bold text-sky-700">
            Healthcare Made Simple
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-800">
            We make it easier to find trusted doctors, book appointments,
            and get the care you need from anywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="relative rounded-xl border border-gray-100 bg-white px-8 py-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#085A93]"></div>

            <CalendarCheck
              size={26}
              className="mx-auto mb-5 text-[#085A93]"
            />

            <h3 className="text-base font-bold text-[#102A43]">
              Easy Booking
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Book your appointment in just a few clicks.
            </p>
          </div>

          <div className="relative rounded-xl border border-gray-100 bg-white px-6 py-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#085A93]"></div>

            <UserRoundCheck
              size={26}
              className="mx-auto mb-5 text-[#085A93]"
            />

            <h3 className="text-base font-bold text-[#102A43]">
              Trusted Doctors
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Connect with verified and experienced professionals.
            </p>
          </div>

          <div className="relative rounded-xl border border-gray-100 bg-white px-6 py-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#085A93]"></div>

            <Headset
              size={26}
              className="mx-auto mb-5 text-[#085A93]"
            />

            <h3 className="text-base font-bold text-[#102A43]">
              24/7 Support
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Our support team is always here when you need us.
            </p>
          </div>

          <div className="relative rounded-xl border border-gray-100 bg-white px-6 py-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-[#085A93]"></div>

            <HandHeart
              size={26}
              className="mx-auto mb-5 text-[#085A93]"
            />

            <h3 className="text-base font-bold text-[#102A43]">
              Affordable Care
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Quality healthcare designed for everyone.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Cards;