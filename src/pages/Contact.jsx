import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar hideHero={true} />
      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
            Get In Touch
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
            We're Here to Support You
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Have questions about doctor appointments, clinic services, or your medical profile? Reach out to our 24/7 care team.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Phone Support</h3>
              <p className="text-xs text-slate-500 mt-1">Direct emergency and helpline</p>
              <p className="text-sm font-semibold text-sky-800 mt-2">+254 700 123 456</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Email Inquiries</h3>
              <p className="text-xs text-slate-500 mt-1">General inquiries & feedback</p>
              <p className="text-sm font-semibold text-emerald-800 mt-2">support@careplus.clinic</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Clinic Location</h3>
              <p className="text-xs text-slate-500 mt-1">Main medical center</p>
              <p className="text-sm font-semibold text-purple-800 mt-2">Medical Plaza, Wing A, 4th Floor</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
