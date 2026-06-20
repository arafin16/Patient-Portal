'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ব্যাকএন্ডের লগইন এন্ডপয়েন্টে রিকোয়েস্ট পাঠানো
      const response = await API.post('/Auth/login', formData);
      
      // ব্যাকএন্ড থেকে Token এবং User ইনফো রিসিভ করা
      const { token, user } = response.data;

      // ব্রাউজারের localStorage-এ ডাটা সেভ করে রাখা
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      alert(`Welcome back, ${user.name}!`);

      // ইউজারের রোল (Patient/Doctor) অনুযায়ী ড্যাশবোর্ডে রিডাইরেক্ট করা
      if (user.role === 'Doctor') {
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard/patient');
      }
    } catch (err: unknown) {
      let message = 'Invalid email or password!';
      if (typeof err === 'object' && err !== null) {
        const axiosError = err as { response?: { data?: { message?: unknown } } };
        if (
          axiosError.response &&
          axiosError.response.data &&
          typeof axiosError.response.data.message === 'string'
        ) {
          message = axiosError.response.data.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">Register here</a>
        </div>
      </div>
    </div>
  );
}