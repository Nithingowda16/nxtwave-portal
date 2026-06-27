import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { Toast } from '../components/Toast';
import { FileText, FileZip, CheckCircle2, AlertCircle, Clock, UploadCloud } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  maxMarks: number;
  deadline: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  fileUrl: string;
  submitTime: string;
  marks?: number;
  feedback?: string;
  assignment: Assignment;
}

export const AssignmentPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submit state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchAssignmentsData = async () => {
    try {
      const res = await api.get('/students/dashboard');
      // Set assignments (extracted from dashboard course mock data or hardcoded)
      // Since student dashboard fetches complete structures, let's load submissions & assignments
      setSubmissions(res.data.submissions || []);
      
      // Seed an active assignment if list is empty
      setAssignments([
        {
          id: 'assign-1',
          title: 'Assignment 1: Build a Task Management Express API',
          description: 'Implement complete CRUD routes and SQLite/Postgres Prisma schema integration.',
          fileUrl: 'https://nxtwave-lms-assets.s3.amazonaws.com/assignments/task-mgmt-spec.pdf',
          maxMarks: 100,
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (err) {
      setToastMessage('Failed to load assignments list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmission = async (assignmentId: string) => {
    if (!selectedFile) {
      setToastMessage('Please select a file to submit.');
      setToastType('error');
      return;
    }

    setSubmittingId(assignmentId);
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setToastMessage(res.data.message || 'File uploaded successfully!');
      setToastType('success');
      setSelectedFile(null);
      fetchAssignmentsData(); // Reload submissions
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Upload failed');
      setToastType('error');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <StatCardSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Active Tasks Grid */}
      <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
        <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-6">
          Assigned Tasks & Projects
        </h3>

        <div className="space-y-6">
          {assignments.map((task) => {
            const submission = submissions.find((sub) => sub.assignmentId === task.id);
            const isSubmitted = !!submission;
            const isGraded = isSubmitted && submission.marks !== undefined;

            return (
              <div key={task.id} className="border border-google-gray-200 dark:border-google-gray-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base text-google-gray-850 dark:text-white">{task.title}</h4>
                    <p className="text-xs text-google-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Deadline: {new Date(task.deadline).toLocaleString()} | Max Marks: {task.maxMarks}
                    </p>
                    <p className="text-xs text-google-gray-700 dark:text-google-gray-300 mt-3">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {task.fileUrl && (
                      <a
                        href={task.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-google-gray-200 bg-google-gray-50 py-1.5 px-3 text-xs font-semibold text-google-gray-700 hover:bg-google-gray-150 flex items-center gap-1.5"
                      >
                        <FileText className="h-4 w-4 text-google-blue" />
                        Download Specification PDF
                      </a>
                    )}
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="rounded-xl bg-google-gray-50 dark:bg-google-gray-850 p-4 border border-google-gray-250 dark:border-google-gray-750 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-google-gray-500 uppercase tracking-wider block">Submission Status</span>
                    {isSubmitted ? (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-google-green font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        Submitted (on {new Date(submission.submitTime).toLocaleString()})
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-google-yellow font-bold">
                        <AlertCircle className="h-4 w-4" />
                        Pending Submission
                      </div>
                    )}
                  </div>

                  {/* Submission Form OR Grades display */}
                  <div className="flex items-center gap-4">
                    {isGraded ? (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-google-gray-500">Graded:</span>
                        <div className="text-base font-extrabold text-google-blue dark:text-google-blue-dark">
                          {submission.marks} / {task.maxMarks}
                        </div>
                        {submission.feedback && (
                          <p className="text-[10px] text-google-gray-600 dark:text-google-gray-400 mt-0.5">
                            Feedback: {submission.feedback}
                          </p>
                        )}
                      </div>
                    ) : isSubmitted ? (
                      <span className="text-xs text-google-gray-500">Awaiting Evaluation</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          id={`upload-${task.id}`}
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.zip"
                        />
                        <label
                          htmlFor={`upload-${task.id}`}
                          className="rounded-lg border border-google-blue text-google-blue bg-white hover:bg-google-blue-light py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer dark:bg-google-surface-dark dark:border-google-blue-dark dark:text-google-blue-dark"
                        >
                          <UploadCloud className="h-4 w-4" />
                          {selectedFile ? selectedFile.name : 'Select PDF/ZIP'}
                        </label>
                        {selectedFile && (
                          <button
                            onClick={() => handleUploadSubmission(task.id)}
                            disabled={submittingId === task.id}
                            className="rounded-lg bg-google-blue text-white px-3.5 py-1.5 text-xs font-bold"
                          >
                            {submittingId === task.id ? 'Uploading...' : 'Submit'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
