'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* 🧭 নেভিগেশন বার */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            
            {/* লোগো/ব্র্যান্ড নেম */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-blue-600">
                Patient<span className="text-indigo-600">Portal</span>
              </span>
            </div>

            {/* ডানদিকের অ্যাকশন বাটনসমূহ */}
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm hover:shadow transition"
              >
                Register
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* 🚀 হিরো সেকশন */}
      <main className="grow flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-center space-y-8">
          
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wide uppercase">
              Welcome to the Future of Healthcare
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl leading-tight">
              Manage Appointments & <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                Prescriptions Effortlessly
              </span>
            </h1>
            <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              একটি ওয়ান-স্টপ মেডিকেল পোর্টাল যেখানে পেশেন্টরা সহজেই অভিজ্ঞ ডক্টরদের অ্যাপয়েন্টমেন্ট বুক করতে পারবেন এবং ডিজিটাল প্রেসক্রিপশন সরাসরি ডাউনলোড করতে পারবেন।
            </p>
          </div>

          {/* 🎯 মূল বাটন গ্রুপ (Login, Registration, Admin) */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            
            {/* পেশেন্ট/ডক্টর লগইন বাটন */}
            <Link 
              href="/login" 
              className="w-44 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-center"
            >
              🔐 Portal Login
            </Link>

            {/* রেজিস্ট্রেশন বাটন */}
            <Link 
              href="/register" 
              className="w-44 rounded-xl bg-white border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all text-center"
            >
              📝 Create Account
            </Link>

            {/* অ্যাডমিন পোর্টাল বাটন */}
            <Link 
              href="/dashboard/admin" // যেহেতু অ্যাডমিনও প্রথমে লগইন করবে, তাই এটি লগইন পেজে রিডাইরেক্ট করবে
              className="w-44 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              🛠️ Admin Access
            </Link>

          </div>

          {/* 📊 একটি ছোট ফিচার গ্রিড প্রিভিউ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 border-t border-slate-200/60 max-w-2xl mx-auto">
            <div className="p-4 rounded-xl bg-white border border-slate-100 text-left">
              <span className="text-xl">📅</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">Easy Booking</h4>
              <p className="text-xs text-slate-400 mt-0.5">Book approved doctors in a click.</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-100 text-left">
              <span className="text-xl">📄</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">Digital Rx</h4>
              <p className="text-xs text-slate-400 mt-0.5">Get and save prescriptions instantly.</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-100 text-left">
              <span className="text-xl">📥</span>
              <h4 className="font-bold text-slate-800 mt-1 text-sm">PDF Download</h4>
              <p className="text-xs text-slate-400 mt-0.5">Download official medical layouts.</p>
            </div>
          </div>

        </div>
      </main>

      {/* 👣 ফুটার */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 print:hidden">
        © {new Date().getFullYear()} Patient Portal System. All rights reserved.
      </footer>

    </div>
  );
}