'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import * as signalR from '@microsoft/signalr';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Appointment = {
  id: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  status: string;
};

type ChatMessage = {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp?: string;
};

export default function DoctorDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // 📝 প্রেসক্রিপশন স্টেটসমূহ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [prescriptionData, setPrescriptionData] = useState({ medicines: '', advice: '' });

  // 💬 লাইভ চ্যাট স্টেটসমূহ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatPatient, setActiveChatPatient] = useState<{ id: number; name: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // এপিআই থেকে অ্যাপয়েন্টমেন্ট ডাটা লোড করা
  const fetchAppointments = async (doctorId: number) => {
    try {
      const response = await API.get(`/Appointment/doctor/${doctorId}`);
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser) as User;
    // defer setting state to avoid synchronous setState within effect (prevents cascading renders)
    setTimeout(() => setUser(parsedUser), 0);

    // অ্যাপয়েন্টমেন্ট এপিআই ট্রিগার করা (defer to avoid sync setState in effect)
    setTimeout(() => fetchAppointments(parsedUser.id), 0);

    // 🟢 SignalR কানেকশন সেটআপ করা
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5266/chathub')
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Doctor connected to SignalR Hub!');
        setHubConnection(connection);
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    // 🟢 লাইভ মেসেজ রিসিভ করা (ডুপ্লিকেট মেসেজ ফিক্সড)
    connection.on('ReceiveMessage', (senderId: string, message: string) => {
      // মেসেজটি নিজের পাঠানো না হলেই কেবল স্ক্রিনে পুশ হবে
      if (parseInt(senderId) !== parsedUser.id) {
        setMessages((prev) => [...prev, { senderId: parseInt(senderId), receiverId: parsedUser.id, content: message }]);
      }
    });

    return () => {
      clearTimeout(t);
      connection.stop();
    };
  }, [router]);

  // চ্যাট বক্স সবসময় নিচে স্ক্রোল হবে
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 💬 চ্যাট হিস্টোরি লোড ও চ্যাট বক্স ওপেন করা
  const openChatBox = async (patientId: number, patientName: string) => {
    if (!user) return;
    setActiveChatPatient({ id: patientId, name: patientName });
    setIsChatOpen(true);

    try {
      const response = await API.get<ChatMessage[]>(`/Chat/history/${user.id}/${patientId}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  // 💬 ডক্টরের পক্ষ থেকে মেসেজ পাঠানো
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChatPatient || !newMessage.trim()) return;

    const msgData: ChatMessage = {
      senderId: user.id,
      receiverId: activeChatPatient.id,
      content: newMessage
    };

    try {
      await API.post('/Chat/send', msgData);

      if (hubConnection) {
        await hubConnection.invoke('SendMessage', user.id.toString(), activeChatPatient.id.toString(), newMessage);
      }

      setMessages((prev) => [...prev, msgData]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending doctor message:', err);
    }
  };

  // অ্যাপয়েন্টমেন্টের স্ট্যাটাস হ্যান্ডেলার (DTO অবজেক্ট বাইন্ডিং ফিক্স)
  const handleStatusChange = async (id: number, status: string) => {
    try {
      await API.put(`/Appointment/update-status/${id}`, { status: status });
      alert(`Appointment marked as ${status}`);
      if (user) fetchAppointments(user.id);
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  const handleOpenPrescriptionModal = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setPrescriptionData({ medicines: '', advice: '' });
    setIsModalOpen(true);
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId) return;

    try {
      await API.post('/Prescription/create', {
        AppointmentId: selectedAppointmentId,
        Medicines: prescriptionData.medicines,
        Advice: prescriptionData.advice,
      });

      alert('Prescription submitted successfully!');
      setIsModalOpen(false);
      if (user) fetchAppointments(user.id);
    } catch (err) {
      console.error('Error creating prescription:', err);
      alert('Failed to submit prescription.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!isMounted || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* নেভিগেশন বার */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-xl font-bold text-emerald-600">Doctor Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Welcome, Dr. {user.name}</span>
              <button onClick={handleLogout} className="rounded bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* মেইন কন্টেন্ট গ্রিড */}
      <main className="mx-auto max-w-7xl p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* ডক্টর প্রোফাইল কার্ড */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Doctor Profile</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-700">Name:</span> Dr. {user.name}</p>
              <p><span className="font-semibold text-gray-700">Email:</span> {user.email}</p>
              <p><span className="font-semibold text-gray-700">Role:</span> <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">{user.role}</span></p>
            </div>
          </div>

          {/* পেশেন্ট রিকোয়েস্ট টেবিল */}
          <div className="md:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Patient Scheduling & Requests</h3>

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No appointment list found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b">
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action Control</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y text-gray-700">
                    {appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{app.patientName || 'Unknown Patient'}</td>
                        <td className="p-3">{new Date(app.appointmentDate).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-center flex justify-center gap-1.5">
                          <button
                            onClick={() => openChatBox(app.patientId, app.patientName)}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            💬 Chat
                          </button>
                          
                          {app.status === 'Pending' && (
                            <>
                              <button onClick={() => handleStatusChange(app.id, 'Approved')} className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition">Approve</button>
                              <button onClick={() => handleStatusChange(app.id, 'Cancelled')} className="rounded bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Reject</button>
                            </>
                          )}
                          {app.status === 'Approved' && (
                            <button onClick={() => handleOpenPrescriptionModal(app.id)} className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition">✏️ Prescribe</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 💬 ফ্লোটিং চ্যাট বক্স পপ-আপ */}
      {isChatOpen && activeChatPatient && (
        <div className="fixed bottom-5 right-5 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-3.5 text-white flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm">{activeChatPatient.name}</h4>
              <span className="text-[10px] text-blue-100">Live Consultation Room</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200 font-bold text-sm">✕</button>
          </div>

          <div className="grow p-3 overflow-y-auto bg-slate-50 space-y-2 text-xs">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-2.5 rounded-2xl shadow-sm ${
                  msg.senderId === user.id 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-gray-100 flex gap-1.5">
            <input
              type="text"
              required
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type advice or reply..."
              className="grow rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition">Send</button>
          </form>
        </div>
      )}

      {/* প্রেসক্রিপশন ক্রিয়েশন পপ-আপ মডাল */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center pt-16 backdrop-blur-sm bg-slate-500/10 p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Create Medical Prescription</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1">✕</button>
            </div>
            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Rx - Medicines (Name & Dosage)</label>
                <textarea
                  required
                  rows={4}
                  value={prescriptionData.medicines}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, medicines: e.target.value })}
                  placeholder="Example:&#10;1. Napa Extend (1+0+1) - 5 days"
                  className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Special Advice / Guidance</label>
                <textarea
                  required
                  rows={2}
                  value={prescriptionData.advice}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, advice: e.target.value })}
                  placeholder="Take plenty of water and complete rest."
                  className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition">Submit Rx</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}