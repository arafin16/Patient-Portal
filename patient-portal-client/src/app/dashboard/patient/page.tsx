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
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  status: string;
};

type DoctorList = {
  id: number;
  name: string;
  isApproved?: boolean;
};

type Prescription = {
  id: number;
  medicines: string;
  advice: string;
  createdAt: string;
};

type ChatMessage = {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp?: string;
};

export default function PatientDashboard() {
  const router = useRouter();
  
  const [user] = useState<User | null>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
  const [isMounted, setIsMounted] = useState(false);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorList[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [activeDoctorName, setActiveDoctorName] = useState('');

  const [bookingData, setBookingData] = useState({ doctorId: '', appointmentDate: '' });

  // 💬 লাইভ চ্যাট স্টেটসমূহ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatDoctor, setActiveChatDoctor] = useState<{ id: number; name: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // অ্যাপয়েন্টমেন্ট লোড করা
  const fetchAppointments = async (patientId: number) => {
    try {
      const response = await API.get(`/Appointment/patient/${patientId}`);
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await API.get<DoctorList[]>('/Admin/doctors');
      const approvedDocs = response.data.filter((d) => d.isApproved);
      setDoctors(approvedDocs);
    } catch (err) {
      console.error('Error fetching doctors:', err);
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

    const loadData = async () => {
      await fetchAppointments(parsedUser.id);
      await fetchDoctors();
    };
    loadData();

    // 🟢 SignalR কানেকশন সেটআপ করা
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5266/chathub')
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Connected to SignalR Hub!');
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

  // চ্যাট বক্স সবসময় নিচে স্ক্রোল হয়ে থাকবে
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 💬 চ্যাট হিস্টোরি লোড ও চ্যাট বক্স ওপেন করা
  const openChatBox = async (doctorId: number, doctorName: string) => {
    if (!user) return;
    setActiveChatDoctor({ id: doctorId, name: doctorName });
    setIsChatOpen(true);

    try {
      const response = await API.get<ChatMessage[]>(`/Chat/history/${user.id}/${doctorId}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  // 💬 মেসেজ পাঠানো
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChatDoctor || !newMessage.trim()) return;

    const msgData: ChatMessage = {
      senderId: user.id,
      receiverId: activeChatDoctor.id,
      content: newMessage
    };

    try {
      await API.post('/Chat/send', msgData);

      if (hubConnection) {
        await hubConnection.invoke('SendMessage', user.id.toString(), activeChatDoctor.id.toString(), newMessage);
      }

      setMessages((prev) => [...prev, msgData]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingData.doctorId || !bookingData.appointmentDate) return;

    try {
      await API.post('/Appointment/book', {
        PatientId: user.id,
        DoctorId: parseInt(bookingData.doctorId),
        AppointmentDate: new Date(bookingData.appointmentDate).toISOString(),
      });

      alert('Appointment booked successfully!');
      setIsModalOpen(false);
      setBookingData({ doctorId: '', appointmentDate: '' });
      fetchAppointments(user.id); 
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert('Failed to book appointment. Try again.');
    }
  };

  const handleViewPrescription = async (appointmentId: number, doctorName: string) => {
    try {
      const response = await API.get(`/Prescription/appointment/${appointmentId}`);
      setActivePrescription(response.data);
      setActiveDoctorName(doctorName);
      setIsPrescriptionModalOpen(true);
    } catch (err) {
      console.error('Error fetching prescription:', err);
      alert('Prescription is still being prepared by the doctor.');
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
      <nav className="bg-white shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">Patient Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="rounded bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* মেইন কন্টেন্ট */}
      <main className="mx-auto max-w-7xl p-6 sm:p-8 print:hidden">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* প্রোফাইল কার্ড */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">My Profile</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-700">Name:</span> {user.name}</p>
              <p><span className="font-semibold text-gray-700">Email:</span> {user.email}</p>
              <p><span className="font-semibold text-gray-700">Role:</span> <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">{user.role}</span></p>
            </div>
          </div>

          {/* অ্যাপয়েন্টমেন্ট টেবিল */}
          <div className="md:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">My Appointments</h3>
              <button onClick={() => setIsModalOpen(true)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition">+ Book New Appointment</button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No appointments scheduled yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b">
                      <th className="p-3">Doctor Name</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y text-gray-700">
                    {appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">Dr. {app.doctorName || 'Unknown'}</td>
                        <td className="p-3">{new Date(app.appointmentDate).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-center flex justify-center gap-2">
                          <button
                            onClick={() => openChatBox(app.doctorId, app.doctorName)}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            💬 Chat
                          </button>
                          {app.status === 'Completed' && (
                            <button onClick={() => handleViewPrescription(app.id, app.doctorName)} className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition">View Rx</button>
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
      {isChatOpen && activeChatDoctor && (
        <div className="fixed bottom-5 right-5 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          <div className="bg-linear-to-r from-emerald-600 to-teal-600 p-3.5 text-white flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm">Dr. {activeChatDoctor.name}</h4>
              <span className="text-[10px] text-emerald-100">Online | Patient Consultancy</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200 font-bold text-sm">✕</button>
          </div>

          <div className="grow p-3 overflow-y-auto bg-slate-50 space-y-2 text-xs">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-2.5 rounded-2xl shadow-sm ${
                  msg.senderId === user.id 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
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
              placeholder="Type a message..."
              className="grow rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition">Send</button>
          </form>
        </div>
      )}

      {/* বুকিং পপ-আপ মডাল */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-slate-500/10 p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">Book New Appointment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1">✕</button>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Select Doctor</label>
                <select
                  required
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 bg-gray-50 focus:bg-white text-sm"
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={bookingData.appointmentDate}
                  onChange={(e) => setBookingData({ ...bookingData, appointmentDate: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 bg-gray-50 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-md">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 প্রেসক্রিপশন ভিউ ও ডাউনলোড মডাল */}
      {isPrescriptionModalOpen && activePrescription && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-slate-500/10 p-4 z-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-indigo-100 border-t-4 border-t-indigo-600 animate-in fade-in duration-200">
            
            <div id="print-area" className="p-2">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Medical Prescription</h3>
                  <p className="text-xs text-gray-500 font-medium">Issued by: Dr. {activeDoctorName}</p>
                </div>
                <button onClick={() => setIsPrescriptionModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 print:hidden">✕</button>
              </div>

              <div className="space-y-4 my-4">
                <div className="text-xs text-gray-600 border-b pb-2 mb-2">
                  <p><strong>Patient Name:</strong> {user.name}</p>
                  <p><strong>Date:</strong> {new Date(activePrescription.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-900 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Rx - Medicines:</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-line font-medium leading-relaxed">
                    {activePrescription.medicines}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Advice:</h4>
                  <p className="text-sm text-gray-700 italic">
                    {activePrescription.advice}
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
                <span>Patient Portal System</span>
                <span>Date: {new Date(activePrescription.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 print:hidden">
              <button type="button" onClick={() => setIsPrescriptionModalOpen(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition">Close</button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const printContent = document.getElementById('print-area')?.innerHTML;
                    const printWindow = window.open('', '_blank');
                    if (printWindow && printContent) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Medical Prescription</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 35px; color: #171717; }
                              h3 { font-size: 24px; font-weight: bold; margin: 0; }
                              p { font-size: 14px; color: #4b5563; }
                              .patient-info { margin: 20px 0; padding-bottom: 10px; border-bottom: 2px solid #111827; }
                              .medicines-card { border: 1px solid #111827; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
                              .advice-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
                              .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; color: #6b7280; }
                            </style>
                          </head>
                          <body>
                            <h3>Medical Prescription</h3>
                            <p>Issued by: Dr. ${activeDoctorName}</p>
                            <div class="patient-info">
                              <p><strong>Patient Name:</strong> ${user.name}</p>
                              <p><strong>Date:</strong> ${new Date(activePrescription.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div class="medicines-card"><h4>Rx - Medicines:</h4><div style="white-space: pre-line;">${activePrescription.medicines}</div></div>
                            <div class="advice-card"><h4>Advice:</h4><p><i>${activePrescription.advice}</i></p></div>
                            <div class="footer"><span>Patient Portal System</span><span>Date: ${new Date(activePrescription.createdAt).toLocaleDateString()}</span></div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                        setIsPrescriptionModalOpen(false);
                      }, 250);
                    }
                  }
                }}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-md transition"
              >
                🖨️ Download / Print PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}