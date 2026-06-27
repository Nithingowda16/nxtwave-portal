import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { Toast } from '../components/Toast';
import {
  Users,
  Calendar,
  ClipboardCheck,
  CheckSquare,
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileSpreadsheet,
  Link as LinkIcon
} from 'lucide-react';

interface MentorData {
  mentorName: string;
  studentsAssigned: number;
  activeChats: number;
  pendingAssignmentsCount: number;
  todayClasses: Array<{
    id: string;
    subject: string;
    startTime: string;
    endTime: string;
    liveUrl?: string;
    batch: { id: string; name: string };
  }>;
  pendingAssignmentsList: Array<{
    submissionId: string;
    studentName: string;
    assignmentTitle: string;
    submitTime: string;
    fileUrl: string;
  }>;
  feePendingStudentsList: Array<{
    studentName: string;
    remainingBalance: number;
    pendingEmisCount: number;
  }>;
}

interface StudentAttendanceRow {
  studentId: string;
  studentIdNum: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export const MentorDashboard: React.FC = () => {
  const [data, setData] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grading' | 'schedule'>('overview');
  
  // Attendance state
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSubject, setAttendanceSubject] = useState('Full Stack Class');
  const [attendanceRows, setAttendanceRows] = useState<StudentAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Grading state
  const [evaluatingSub, setEvaluatingSub] = useState<string | null>(null);
  const [marksGiven, setMarksGiven] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState('');

  // Class scheduler state
  const [scheduleSubject, setScheduleSubject] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleUrl, setScheduleUrl] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/mentors/dashboard');
      setData(res.data);
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to load dashboard data');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Load batches (normally we fetch, here we hardcode or mock-fetch)
    setBatches([
      { id: '1', name: 'CCBP-Batch-2026-A' },
      { id: '2', name: 'CCBP-Batch-2026-B' },
    ]);
    setSelectedBatch('1');
  }, []);

  // Fetch student lists when batch changes for attendance
  const handleLoadAttendanceGrid = async () => {
    if (!selectedBatch || !attendanceDate) return;
    setAttendanceLoading(true);
    try {
      const res = await api.get(`/attendance/batch?batchId=${selectedBatch}&date=${attendanceDate}`);
      setAttendanceRows(res.data);
    } catch (err: any) {
      setToastMessage('Failed to load batch list');
      setToastType('error');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: any) => {
    setAttendanceRows((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, status } : row))
    );
  };

  const handleSubmitAttendance = async () => {
    try {
      const records = attendanceRows.map((r) => ({
        studentId: r.studentId,
        status: r.status,
      }));
      const res = await api.post('/attendance/mark', {
        date: attendanceDate,
        subject: attendanceSubject,
        records,
      });
      setToastMessage(res.data.message || 'Attendance marked successfully!');
      setToastType('success');
      setActiveTab('overview');
      fetchDashboard();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to submit attendance');
      setToastType('error');
    }
  };

  const handleSubmitGrade = async (submissionId: string) => {
    if (!marksGiven) return;
    try {
      const res = await api.post('/assignments/grade', {
        submissionId,
        marks: parseFloat(marksGiven),
        feedback: feedbackGiven,
      });
      setToastMessage(res.data.message || 'Evaluation saved!');
      setToastType('success');
      setEvaluatingSub(null);
      setMarksGiven('');
      setFeedbackGiven('');
      fetchDashboard();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Failed to submit grade');
      setToastType('error');
    }
  };

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleSubject || !scheduleStart || !scheduleEnd) return;
    try {
      const res = await api.post('/classes/schedule', {
        batchId: selectedBatch,
        subject: scheduleSubject,
        startTime: scheduleStart,
        endTime: scheduleEnd,
        liveUrl: scheduleUrl,
      });
      setToastMessage(res.data.message || 'Class scheduled successfully!');
      setToastType('success');
      setScheduleSubject('');
      setScheduleStart('');
      setScheduleEnd('');
      setScheduleUrl('');
      setActiveTab('overview');
      fetchDashboard();
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Scheduling failed');
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
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Mentor Welcome */}
      <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-google-gray-800 dark:text-white">
              Instructor Panel: {data.mentorName}
            </h2>
            <p className="text-sm text-google-gray-500 mt-1">
              Select an action tab to manage classes, mark batch attendance, or grade submissions.
            </p>
          </div>
          {/* Tabs header */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'attendance', label: 'Mark Attendance', icon: ClipboardCheck },
              { id: 'grading', label: 'Grades Pending', icon: CheckSquare },
              { id: 'schedule', label: 'Schedule Class', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'attendance') handleLoadAttendanceGrid();
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                    activeTab === tab.id
                      ? 'bg-google-blue border-google-blue text-white dark:bg-google-blue-dark dark:text-google-gray-900'
                      : 'bg-white border-google-gray-250 text-google-gray-600 hover:bg-google-gray-50 dark:bg-google-gray-850 dark:border-google-gray-850 dark:text-google-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Rendering */}
      {activeTab === 'overview' && (
        <>
          {/* Overview counters */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">Students Assigned</span>
                <Users className="h-5 w-5 text-google-blue" />
              </div>
              <h3 className="mt-4 text-3xl font-extrabold text-google-gray-800 dark:text-white">
                {data.studentsAssigned}
              </h3>
            </div>

            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">Pending Gradings</span>
                <CheckSquare className="h-5 w-5 text-google-red" />
              </div>
              <h3 className="mt-4 text-3xl font-extrabold text-google-gray-800 dark:text-white">
                {data.pendingAssignmentsCount}
              </h3>
            </div>

            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-google-gray-500 dark:text-google-gray-400">Active Chat Threads</span>
                <Users className="h-5 w-5 text-google-green" />
              </div>
              <h3 className="mt-4 text-3xl font-extrabold text-google-gray-800 dark:text-white">
                {data.activeChats}
              </h3>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Today Classes lists */}
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-4">
                Today's Scheduled Workshops
              </h3>
              <div className="space-y-4">
                {data.todayClasses.length === 0 ? (
                  <p className="text-center text-xs text-google-gray-500 py-6">No classes scheduled for today.</p>
                ) : (
                  data.todayClasses.map((c) => (
                    <div key={c.id} className="flex justify-between items-center py-2">
                      <div>
                        <h4 className="font-semibold text-google-gray-850 dark:text-white text-sm">
                          {c.subject}
                        </h4>
                        <p className="text-xs text-google-gray-500 mt-1">
                          Batch: {c.batch.name} | Time: {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <a
                        href={c.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-google-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-google-blue/90"
                      >
                        Start Session
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overdue Fee alerts */}
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
              <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-4 text-google-yellow">
                EMI Overdue / Pending Students
              </h3>
              <div className="space-y-4">
                {data.feePendingStudentsList.length === 0 ? (
                  <p className="text-center text-xs text-google-gray-500 py-6">No students with overdue fees.</p>
                ) : (
                  data.feePendingStudentsList.map((fps, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <div>
                        <h4 className="font-semibold text-google-gray-850 dark:text-white text-sm">
                          {fps.studentName}
                        </h4>
                        <p className="text-xs text-google-gray-500 mt-1">
                          Pending EMI: {fps.pendingEmisCount} count(s)
                        </p>
                      </div>
                      <span className="text-xs font-bold text-google-red">
                        ₹{fps.remainingBalance}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mark Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm space-y-6">
          <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
            Batch Attendance Sheet
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Select Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-700 dark:text-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Class Subject</label>
              <input
                type="text"
                value={attendanceSubject}
                onChange={(e) => setAttendanceSubject(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-700 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleLoadAttendanceGrid}
            className="rounded-xl bg-google-blue px-4 py-2 text-xs font-bold text-white hover:bg-google-blue/90"
          >
            Load Student List
          </button>

          {attendanceLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-google-gray-250 text-google-gray-500">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Student Name</th>
                    <th className="py-2.5">Status Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {attendanceRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-xs text-google-gray-500">
                        Click "Load Student List" or select another batch.
                      </td>
                    </tr>
                  ) : (
                    attendanceRows.map((row) => (
                      <tr key={row.studentId}>
                        <td className="py-3 font-semibold">{row.studentIdNum}</td>
                        <td className="py-3 font-medium text-google-gray-800 dark:text-white">{row.name}</td>
                        <td className="py-3 flex gap-2">
                          {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(row.studentId, status as any)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                                row.status === status
                                  ? status === 'PRESENT'
                                    ? 'bg-google-green text-white border-google-green'
                                    : status === 'ABSENT'
                                    ? 'bg-google-red text-white border-google-red'
                                    : 'bg-google-yellow text-white border-google-yellow'
                                  : 'bg-white text-google-gray-500 border-google-gray-200 dark:bg-google-gray-850 dark:border-google-gray-700'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {attendanceRows.length > 0 && (
            <button
              onClick={handleSubmitAttendance}
              className="w-full rounded-xl bg-google-green py-2.5 font-bold text-white hover:bg-google-green/90 dark:bg-google-green-dark dark:text-google-gray-900 transition-colors"
            >
              Submit Attendance Records
            </button>
          )}
        </div>
      )}

      {/* Grading Tab */}
      {activeTab === 'grading' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-6">
            Grading Queue (Pending Reviews)
          </h3>

          <div className="space-y-6">
            {data.pendingAssignmentsList.length === 0 ? (
              <p className="text-center text-sm text-google-gray-500 py-6">All assignments are graded! Excellent job.</p>
            ) : (
              data.pendingAssignmentsList.map((sub) => (
                <div key={sub.submissionId} className="border border-google-gray-200 dark:border-google-gray-800 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-google-gray-850 dark:text-white">
                        {sub.assignmentTitle}
                      </h4>
                      <p className="text-xs text-google-gray-500 mt-0.5">
                        Student: <span className="font-semibold">{sub.studentName}</span> | Submitted: {new Date(sub.submitTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-google-gray-200 dark:border-google-gray-700 bg-google-gray-50 hover:bg-google-gray-100 text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-google-blue" />
                        Download PDF/ZIP
                      </a>
                      <button
                        onClick={() => setEvaluatingSub(sub.submissionId)}
                        className="rounded-lg bg-google-blue text-white px-3.5 py-1.5 text-xs font-bold"
                      >
                        Evaluate
                      </button>
                    </div>
                  </div>

                  {evaluatingSub === sub.submissionId && (
                    <div className="rounded-xl bg-google-gray-50 dark:bg-google-gray-850 p-4 border border-google-gray-250 dark:border-google-gray-700 space-y-4 animate-slide-in">
                      <h5 className="text-xs font-bold uppercase text-google-gray-500">Grading Dashboard</h5>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs font-semibold text-google-gray-500">Marks (out of 100)</label>
                          <input
                            type="number"
                            placeholder="e.g. 85"
                            value={marksGiven}
                            onChange={(e) => setMarksGiven(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-google-gray-300 py-1.5 px-3 text-sm dark:bg-google-surface-dark dark:border-google-gray-750 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-google-gray-500">Feedback Comments</label>
                          <input
                            type="text"
                            placeholder="Great API architecture. Missing unit tests."
                            value={feedbackGiven}
                            onChange={(e) => setFeedbackGiven(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-google-gray-300 py-1.5 px-3 text-sm dark:bg-google-surface-dark dark:border-google-gray-750 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitGrade(sub.submissionId)}
                          className="rounded-lg bg-google-green text-white px-4 py-2 text-xs font-bold"
                        >
                          Submit Grades
                        </button>
                        <button
                          onClick={() => setEvaluatingSub(null)}
                          className="rounded-lg border border-google-gray-300 text-google-gray-600 px-4 py-2 text-xs font-bold dark:border-google-gray-700 dark:text-google-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Class Tab */}
      {activeTab === 'schedule' && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-6">
            Schedule a Live Workshop / Lecture
          </h3>

          <form onSubmit={handleScheduleClass} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Select Target Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Lecture Subject / Title</label>
              <input
                type="text"
                placeholder="Live Workshop: Designing Database indexes with PostgreSQL"
                value={scheduleSubject}
                onChange={(e) => setScheduleSubject(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-google-gray-500 uppercase">Start Time</label>
                <input
                  type="datetime-local"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-google-gray-500 uppercase">End Time</label>
                <input
                  type="datetime-local"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Zoom / Meet link URL</label>
              <input
                type="url"
                placeholder="https://zoom.us/meet/1234"
                value={scheduleUrl}
                onChange={(e) => setScheduleUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-google-blue py-3 font-bold text-white hover:bg-google-blue/90 dark:bg-google-blue-dark dark:text-google-gray-900 transition-colors"
            >
              Add Timetable Schedule
            </button>
          </form>
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
