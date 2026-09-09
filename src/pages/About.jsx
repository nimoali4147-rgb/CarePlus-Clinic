import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Shield, Users, Clock, Award, CheckCircle2 } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar hideHero={true} />
      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
            About CarePlus Clinic
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Delivering World-Class Healthcare With Compassion & Excellence
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            CarePlus is a digital healthcare clinic management platform bridging the gap between licensed doctors and patients, ensuring fast scheduling and clinical coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-16">
          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 mb-6">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Certified Specialists</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Every doctor on CarePlus is verified with legitimate licenses, qualifications, and extensive clinical experience.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-6">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Real-Time Scheduling</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Smart scheduling prevents double-bookings, allows flexible slot reservations, and provides real-time status updates.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 mb-6">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Secure Records</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Patient data and medical histories are securely isolated and accessible only to authorized medical staff.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
