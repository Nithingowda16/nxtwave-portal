import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { Toast } from '../components/Toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, CreditCard, ShieldAlert, FileSpreadsheet, Award, Calendar, FolderOpen, Search, User, Trash, BadgeAlert
} from 'lucide-react';

interface Counters {
  totalStudents: number;
  activeStudents: number;
  totalRevenue: number;
  pendingRevenue: number;
  todayAttendanceCount: number;
  activeMentors: number;
  liveClassesCount: number;
}

interface AdminData {
  counters: Counters;
  charts: {
    revenueChart: any[];
    admissionsChart: any[];
    attendanceChart: any[];
    assignmentChart: any[];
  };
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'mentors' | 'fees' | 'audits'>('overview');

  // Lists
  const [students, setStudents] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Modals / Creates
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    email: '', password: '', name: '', mobile: '', batchId: '1', courseId: '1', totalFee: '60000', scholarship: '0', discount: '0'
  });

  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorForm, setMentorForm] = useState({ email: '', password: '', name: '', mobile: '' });

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchOverview = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err: any) {
      setToastMessage('Failed to fetch dashboard data');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const loadStudents = async () => {
    setListLoading(true);
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      setToastMessage('Failed to load students');
    } finally {
      setListLoading(false);
    }
  };

  const loadMentors = async () => {
    setListLoading(true);
    try {
      const res = await api.get('/mentors');
      setMentors(res.data);
    } catch (err) {
      setToastMessage('Failed to load mentors');
    } finally {
      setListLoading(false);
    }
  };

  const loadPayments = async () => {
    setListLoading(true);
    try {
      const res = await api.get('/fees/payments');
      setPayments(res.data);
    } catch (err) {
      setToastMessage('Failed to load payments');
    } finally {
      setListLoading(false);
    }
  };

  const loadAudits = async () => {
    setListLoading(true);
    try {
      const res = await api.get('/reports/audit-logs');
      setAuditLogs(res.data);
    } catch (err) {
      setToastMessage('Failed to load audits');
    } finally {
      setListLoading(false);
    }
  };

  // Switch tabs triggers
  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'mentors') loadMentors();
    if (activeTab === 'fees') loadPayments();
    if (activeTab === 'audits') loadAudits();
  }, [activeTab]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', {
        ...studentForm,
        totalFee: parseFloat(studentForm.totalFee),
        scholarship: parseFloat(studentForm.scholarship),
        discount: parseFloat(studentForm.discount),
      });
      setToastMessage(res.data.message || 'Student created!');
      setToastType('success');
      setShowStudentModal(false);
      loadStudents();
      fetchOverview();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Student creation failed');
      setToastType('error');
    }
  };

  const handleCreateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/mentors', mentorForm);
      setToastMessage(res.data.message || 'Mentor profile created!');
      setToastType('success');
      setShowMentorModal(false);
      loadMentors();
      fetchOverview();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Mentor creation failed');
      setToastType('error');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this student record?')) return;
    try {
      const res = await api.delete(`/students/${id}`);
      setToastMessage(res.data.message || 'Student profile deleted');
      setToastType('success');
      loadStudents();
      fetchOverview();
    } catch (err: any) {
      setToastMessage('Deletion failed');
      setToastType('error');
    }
  };

  const handleGenerateCertificate = async (studentId: string) => {
    try {
      const res = await api.post('/reports/certificate', {
        studentId,
        courseName: 'MERN Full Stack Development',
      });
      setToastMessage(`Certificate ID ${res.data.certificate.certificateId} generated successfully!`);
      setToastType('success');
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to generate certificate');
      setToastType('error');
    }
  };

  const COLORS = ['#34a853', '#ea4335'];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-6 sm:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Tab selection */}
      <div className="flex border-b border-google-gray-200 dark:border-google-gray-800 gap-4">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: FolderOpen },
          { id: 'students', label: 'Student Management', icon: Users },
          { id: 'mentors', label: 'Mentor Directory', icon: User },
          { id: 'fees', label: 'EMI Collections', icon: CreditCard },
          { id: 'audits', label: 'System Audit Logs', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-colors outline-none ${
                activeTab === tab.id
                  ? 'border-google-blue text-google-blue dark:border-google-blue-dark dark:text-google-blue-dark'
                  : 'border-transparent text-google-gray-500 hover:text-google-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <span className="text-xs font-semibold text-google-gray-500 uppercase tracking-wider">Total Active Students</span>
              <h3 className="text-3xl font-extrabold text-google-gray-850 dark:text-white mt-2">{data.counters.totalStudents}</h3>
            </div>
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <span className="text-xs font-semibold text-google-gray-500 uppercase tracking-wider">Total Collected Revenue</span>
              <h3 className="text-3xl font-extrabold text-google-gray-850 dark:text-white mt-2">₹{data.counters.totalRevenue}</h3>
            </div>
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <span className="text-xs font-semibold text-google-gray-500 uppercase tracking-wider">Outstanding EMI Balance</span>
              <h3 className="text-3xl font-extrabold text-google-gray-850 dark:text-white mt-2 text-google-red">₹{data.counters.pendingRevenue}</h3>
            </div>
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <span className="text-xs font-semibold text-google-gray-500 uppercase tracking-wider">Active Mentors</span>
              <h3 className="text-3xl font-extrabold text-google-gray-850 dark:text-white mt-2">{data.counters.activeMentors}</h3>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue chart */}
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <h4 className="font-bold text-google-gray-800 dark:text-white text-sm mb-4">6-Month Revenue Aggregation (INR)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#1a73e8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Admissions trend */}
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <h4 className="font-bold text-google-gray-800 dark:text-white text-sm mb-4">Admissions Cumulative Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.admissionsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students" fill="#34a853" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-google-gray-800 dark:text-white">Active Student Ledger</h3>
            <button
              onClick={() => setShowStudentModal(true)}
              className="rounded-xl bg-google-blue text-white py-2 px-4 text-xs font-bold"
            >
              Create New Student
            </button>
          </div>

          {listLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-google-gray-250 text-google-gray-500">
                    <th className="py-2.5">Student ID</th>
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Remaining Balance</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 font-semibold">{s.studentId}</td>
                      <td className="py-3 font-medium text-google-gray-800 dark:text-white">{s.name}</td>
                      <td className="py-3">{s.email}</td>
                      <td className="py-3 font-semibold">₹{s.balance}</td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleGenerateCertificate(s.id)}
                          className="rounded-lg border border-google-gray-250 px-2 py-1 text-xs font-bold text-google-gray-600 dark:border-google-gray-700 dark:text-google-gray-400"
                        >
                          Certificate
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="rounded-lg bg-google-red-light text-google-red p-1.5 inline-flex"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MENTORS TAB */}
      {activeTab === 'mentors' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-google-gray-800 dark:text-white">Mentor Directory</h3>
            <button
              onClick={() => setShowMentorModal(true)}
              className="rounded-xl bg-google-blue text-white py-2 px-4 text-xs font-bold"
            >
              Create New Mentor
            </button>
          </div>

          {listLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-google-gray-250 text-google-gray-500">
                    <th className="py-2.5">Employee ID</th>
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Assigned Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {mentors.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 font-semibold">{m.employeeId}</td>
                      <td className="py-3 font-medium text-google-gray-800 dark:text-white">{m.name}</td>
                      <td className="py-3">{m.email}</td>
                      <td className="py-3 font-semibold">{m.studentsCount} students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FEES TAB */}
      {activeTab === 'fees' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm space-y-6">
          <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
            Payment Approvals ledger
          </h3>
          {listLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-google-gray-250 text-google-gray-500">
                    <th className="py-2.5">Tx ID</th>
                    <th className="py-2.5">Student Name</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Payment Date</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 font-mono text-xs">{p.transactionId}</td>
                      <td className="py-3 font-medium text-google-gray-800 dark:text-white">{p.studentName}</td>
                      <td className="py-3 font-semibold">₹{p.amount}</td>
                      <td className="py-3">{new Date(p.paymentDate).toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className="rounded-full bg-google-green-light px-2.5 py-0.5 text-xs font-bold text-google-green dark:bg-google-green/10">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audits' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm space-y-6">
          <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
            System Event Audit Stream
          </h3>
          {listLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-google-gray-250 text-google-gray-500">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">User Email</th>
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">IP Address</th>
                    <th className="py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="text-google-gray-700 dark:text-google-gray-300">
                      <td className="py-2.5">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 font-semibold text-google-blue dark:text-google-blue-dark">{log.user?.email || 'SYSTEM'}</td>
                      <td className="py-2.5">{log.action}</td>
                      <td className="py-2.5">{log.ipAddress}</td>
                      <td className="py-2.5 font-sans">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Student Create Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-google-surface-dark border border-google-gray-200 dark:border-google-gray-800">
            <h4 className="font-bold text-lg text-google-gray-800 dark:text-white mb-4">Admit New Student</h4>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="password"
                  placeholder="Password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={studentForm.mobile}
                  onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  type="number"
                  placeholder="Total Fee (e.g. 60000)"
                  value={studentForm.totalFee}
                  onChange={(e) => setStudentForm({ ...studentForm, totalFee: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Scholarship"
                  value={studentForm.scholarship}
                  onChange={(e) => setStudentForm({ ...studentForm, scholarship: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Discount"
                  value={studentForm.discount}
                  onChange={(e) => setStudentForm({ ...studentForm, discount: e.target.value })}
                  className="rounded-xl border py-2 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="rounded-xl border py-2 px-4 text-xs font-semibold text-google-gray-600 dark:text-google-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-google-blue text-white py-2 px-4 text-xs font-bold"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentor Create Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-google-surface-dark border border-google-gray-200 dark:border-google-gray-800">
            <h4 className="font-bold text-lg text-google-gray-800 dark:text-white mb-4">Register New Mentor</h4>
            <form onSubmit={handleCreateMentor} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={mentorForm.name}
                onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                className="rounded-xl border py-2.5 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={mentorForm.email}
                onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                className="rounded-xl border py-2.5 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={mentorForm.password}
                onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                className="rounded-xl border py-2.5 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                required
              />
              <input
                type="text"
                placeholder="Mobile Contact"
                value={mentorForm.mobile}
                onChange={(e) => setMentorForm({ ...mentorForm, mobile: e.target.value })}
                className="rounded-xl border py-2.5 px-3 text-sm w-full dark:bg-google-gray-850 dark:text-white"
                required
              />
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="rounded-xl border py-2 px-4 text-xs font-semibold text-google-gray-600 dark:text-google-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-google-blue text-white py-2 px-4 text-xs font-bold"
                >
                  Register Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
