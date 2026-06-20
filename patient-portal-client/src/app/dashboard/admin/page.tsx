'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, UserCheck, Calendar, Activity, RefreshCw } from 'lucide-react';

type Doctor = {
  id: number;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
};

type AnalyticsData = {
  totalApplications: number;
  approvedDoctors: number;
  pendingApprovals: number;
  totalAppointments: number;
  topDoctors: { name: string; Appointments: number }[];
  monthlyTrend: { name: string; Patients: number; Doctors: number }[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalApplications: 0,
    approvedDoctors: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    topDoctors: [],
    monthlyTrend: []
  });

  const fetchAnalytics = async () => {
    try {
      const response = await API.get<AnalyticsData>('/Admin/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await API.get<Doctor[]>('/Admin/doctors');
      setDoctors(response.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (id: number, approve: boolean) => {
    try {
      if (approve) {
        // 🟢 ব্যাকএন্ডের HttpPut এবং সঠিক রাউটের সাথে ম্যাচ করা হলো
        await API.put(`/Admin/approve-doctor/${id}`);
        alert('Doctor approved successfully!');
      } else {
        // ব্যাকএন্ডে রিজেক্ট এপিআই যোগ না হওয়া পর্যন্ত সাময়িক অ্যালার্ট
        alert('Reject/Revoke feature endpoint needs to be added in backend.');
        return;
      }
      fetchDoctors();
      fetchAnalytics();
    } catch (err) {
      console.error('Error updating doctor status:', err);
      alert('Failed to update doctor status. Check CORS or backend logs.');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchDoctors(), fetchAnalytics()]);
    };
    void loadInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 🧭 নেভিগেশন বার */}
      <nav className="bg-slate-900 shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <span className="text-xl font-black tracking-wider text-white">
              🛠️ ADMIN<span className="text-blue-400">PANEL</span>
            </span>
            <button 
              onClick={() => router.push('/')} 
              className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl p-6 sm:p-8 space-y-8">
        
        {/* 🟢 মিনি কার্ডস গ্রুপ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Doctors</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{analytics.totalApplications}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Doctors</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{analytics.approvedDoctors}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><UserCheck size={24} /></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{analytics.pendingApprovals}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Activity size={24} /></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Appointments</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{analytics.totalAppointments}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Calendar size={24} /></div>
          </div>
        </div>

        {/* 📊 চার্ট সেকশন (min-w-0 যোগ করে ফিক্স করা হয়েছে) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* চার্ট ১: মাসিক রেজিস্ট্রেশন ট্রেন্ড */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-w-0">
            <div>
              <h4 className="text-base font-bold text-slate-800">Monthly Registration Trend</h4>
              <p className="text-xs text-slate-400 mt-0.5">ডাটাবেজ থেকে রিয়েল-টাইম সাইন-আপ গ্রাফ।</p>
            </div>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Patients" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Doctors" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* চার্ট ২: মোস্ট পপুলার ডক্টরস */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-w-0">
            <div>
              <h4 className="text-base font-bold text-slate-800">Top Appointed Doctors</h4>
              <p className="text-xs text-slate-400 mt-0.5">সবচেয়ে বেশি অ্যাপয়েন্টমেন্ট পাওয়া টপ ৫ ডক্টর।</p>
            </div>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topDoctors} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Appointments" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 📋 ডক্টর ম্যানেজমেন্ট টেবিল কার্ড */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 text-sm">Application Waitlist</h3>
            <button 
              onClick={() => { fetchDoctors(); fetchAnalytics(); }} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Everything
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-sm font-medium text-slate-400">Loading doctor requests...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">No doctor registration requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="p-4 pl-6">Doctor Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-center pr-6">Management Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 pl-6 font-semibold text-slate-900">Dr. {doc.name}</td>
                      <td className="p-4 text-slate-500">{doc.email}</td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                          {doc.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          doc.isApproved 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {doc.isApproved ? '● Active / Approved' : '○ Pending Approval'}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6">
                        <div className="flex justify-center gap-2">
                          {!doc.isApproved ? (
                            <>
                              <button onClick={() => handleApproval(doc.id, true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition">Approve</button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No Actions Needed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}