import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { Toast } from '../components/Toast';
import {
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Bell,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
  studentName: string;
  studentId: string;
  batch: string;
  course: string;
  mentorName: string;
  attendancePercentage: number;
  courseProgress: number;
  pendingAssignments: number;
  upcomingClasses: Array<{
    id: string;
    subject: string;
    startTime: string;
    endTime: string;
    liveUrl?: string;
    mentorName: string;
  }>;
  emis: Array<{
    id: string;
    emiNumber: number;
    amount: number;
    dueDate: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
  feeDetails: {
    totalFee: number;
    scholarship: number;
    discount: number;
    remainingBalance: number;
  };
}

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/students/dashboard');
        setData(res.data);
      } catch (err: any) {
        setToastMessage(err.response?.data?.error || 'Failed to load dashboard data');
        setToastType('error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handlePayEmi = async (emiId: string) => {
    try {
      const res = await api.post('/fees/pay', { emiId, method: 'RAZORPAY' });
      setToastMessage(res.data.message || 'Payment completed!');
      setToastType('success');
      // Refresh dashboard
      const refreshed = await api.get('/students/dashboard');
      setData(refreshed.data);
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Payment failed');
      setToastType('error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-google-blue-light p-6 dark:bg-google-blue/10 border border-google-blue/20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-google-blue dark:text-google-blue-dark">
              Welcome back, {data.studentName}!
            </h2>
            <p className="mt-1 text-sm text-google-gray-700 dark:text-google-gray-300">
              Batch: <span className="font-semibold">{data.batch}</span> | ID: <span className="font-semibold">{data.studentId}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-google-gray-750 dark:bg-google-surface-dark dark:text-white border border-google-gray-200 dark:border-google-gray-800">
              Course: {data.course}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Course Progress */}
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">Course Progress</span>
            <div className="rounded-lg bg-google-blue-light p-2 text-google-blue dark:bg-google-blue/15 dark:text-google-blue-dark">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-google-gray-800 dark:text-white">{data.courseProgress}%</span>
            <span className="text-xs text-google-gray-500">syllabus covered</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-google-gray-100 dark:bg-google-gray-800">
            <div
              className="h-2 rounded-full bg-google-blue dark:bg-google-blue-dark transition-all duration-500"
              style={{ width: `${data.courseProgress}%` }}
            />
          </div>
        </div>

        {/* Attendance Percentage */}
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">Attendance</span>
            <div className="rounded-lg bg-google-green-light p-2 text-google-green dark:bg-google-green/15 dark:text-google-green-dark">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-google-gray-800 dark:text-white">{data.attendancePercentage}%</span>
            <span className="text-xs text-google-gray-500">overall present</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-google-gray-100 dark:bg-google-gray-800">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                data.attendancePercentage >= 75 ? 'bg-google-green dark:bg-google-green-dark' : 'bg-google-yellow'
              }`}
              style={{ width: `${data.attendancePercentage}%` }}
            />
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">Pending Tasks</span>
            <div className="rounded-lg bg-google-red-light p-2 text-google-red dark:bg-google-red/15 dark:text-google-red-dark">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-google-gray-800 dark:text-white">{data.pendingAssignments}</span>
            <span className="text-xs text-google-gray-500">tasks remaining</span>
          </div>
          <p className="mt-4 text-xs text-google-gray-500 dark:text-google-gray-400">
            Assigned Mentor: <span className="font-semibold">{data.mentorName}</span>
          </p>
        </div>

        {/* Pending Fee Balance */}
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">EMI Balance</span>
            <div className="rounded-lg bg-google-yellow-light p-2 text-google-yellow dark:bg-google-yellow/15 dark:text-google-yellow-dark">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-google-gray-800 dark:text-white">₹{data.feeDetails.remainingBalance}</span>
            <span className="text-xs text-google-gray-500">payable balance</span>
          </div>
          <p className="mt-4 text-xs text-google-gray-500 dark:text-google-gray-400">
            Total Course Fee: ₹{data.feeDetails.totalFee}
          </p>
        </div>
      </div>

      {/* Main Grid split: Timetables and EMIs / Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timetables (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Classes */}
          <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
            <div className="flex items-center justify-between border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
              <h3 className="font-bold text-google-gray-800 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-google-blue" />
                Upcoming Live Lectures
              </h3>
              <Link to="/classes" className="text-xs font-semibold text-google-blue dark:text-google-blue-dark flex items-center gap-1 hover:underline">
                View Timetable <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-google-gray-100 dark:divide-google-gray-850">
              {data.upcomingClasses.length === 0 ? (
                <div className="py-8 text-center text-sm text-google-gray-500">
                  No upcoming classes scheduled today.
                </div>
              ) : (
                data.upcomingClasses.map((c) => (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-google-gray-800 dark:text-white text-sm">
                        {c.subject}
                      </h4>
                      <p className="text-xs text-google-gray-500 dark:text-google-gray-400 mt-1">
                        Mentor: {c.mentorName} | Time: {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <a
                        href={c.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-google-blue px-4 py-2 text-xs font-bold text-white hover:bg-google-blue/90 dark:bg-google-blue-dark dark:text-google-gray-900 transition-colors"
                      >
                        Join Class
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EMI Ledger */}
          <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
            <h3 className="font-bold text-google-gray-800 dark:text-white flex items-center gap-2 border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
              <CreditCard className="h-5 w-5 text-google-yellow" />
              EMI Fees Schedule
            </h3>
            
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-google-gray-250 text-google-gray-500 dark:border-google-gray-800 dark:text-google-gray-400">
                    <th className="py-2.5">EMI No</th>
                    <th className="py-2.5">Due Date</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {data.emis.map((e) => (
                    <tr key={e.id} className="text-google-gray-700 dark:text-google-gray-300">
                      <td className="py-3 font-semibold">#{e.emiNumber}</td>
                      <td className="py-3">{new Date(e.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold">₹{e.amount}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            e.status === 'PAID'
                              ? 'bg-google-green-light text-google-green dark:bg-google-green/10'
                              : e.status === 'OVERDUE'
                              ? 'bg-google-red-light text-google-red dark:bg-google-red/10'
                              : 'bg-google-yellow-light text-google-yellow dark:bg-google-yellow/10'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {e.status === 'PAID' ? (
                          <span className="text-xs text-google-gray-400 font-semibold">Fully Cleared</span>
                        ) : (
                          <button
                            onClick={() => handlePayEmi(e.id)}
                            className="rounded-lg bg-google-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-google-blue/90 dark:bg-google-blue-dark dark:text-google-gray-900 transition-colors"
                          >
                            Pay Online
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Announcements and Notifications */}
        <div className="space-y-6">
          {/* Announcements Widget */}
          <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
            <h3 className="font-bold text-google-gray-800 dark:text-white flex items-center gap-2 border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
              <Volume2 className="h-5 w-5 text-google-red" />
              Portal Announcements
            </h3>

            <div className="mt-4 space-y-4">
              {data.announcements.length === 0 ? (
                <p className="text-center text-xs text-google-gray-500 py-4">No recent announcements.</p>
              ) : (
                data.announcements.map((a) => (
                  <div key={a.id} className="rounded-xl border border-google-gray-100 p-4 dark:border-google-gray-850 bg-google-gray-50/50 dark:bg-google-gray-850/50">
                    <h4 className="font-bold text-xs text-google-gray-850 dark:text-white uppercase tracking-wider">
                      {a.title}
                    </h4>
                    <p className="text-xs text-google-gray-500 mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-google-gray-700 dark:text-google-gray-300 mt-2 line-clamp-3">
                      {a.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};
