import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { Toast } from '../components/Toast';
import { Video, FileText, Calendar, PlayCircle } from 'lucide-react';

interface TimetableItem {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  liveUrl?: string;
  mentorName: string;
}

interface RecordedClass {
  id: string;
  title: string;
  videoUrl: string;
  notesUrl?: string;
  createdAt: string;
}

interface Chapter {
  id: string;
  title: string;
  recordedClasses: RecordedClass[];
}

interface Module {
  id: string;
  title: string;
  chapters: Chapter[];
}

export const LiveClassPage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // Fetch dashboard to find student batch and course details
        const dashRes = await api.get('/students/dashboard');
        
        // Mock fetch timetable
        setTimetable(dashRes.data.upcomingClasses);

        // Retrieve recorded classes and notes PDF from API
        // For seed course, let's query resources mock
        const res = await api.get(`/classes/resources/1`); // Mock courseId 1
        setModules(res.data || []);
      } catch (err) {
        setToastMessage('Failed to load class resources');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

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
      {/* Timetable Section */}
      <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
        <h3 className="font-bold text-google-gray-800 dark:text-white flex items-center gap-2 border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-4">
          <Calendar className="h-5 w-5 text-google-blue" />
          Scheduled Live Workshops
        </h3>

        <div className="divide-y divide-google-gray-150 dark:divide-google-gray-800">
          {timetable.length === 0 ? (
            <p className="text-center text-xs text-google-gray-500 py-6">No live lectures scheduled currently.</p>
          ) : (
            timetable.map((c) => (
              <div key={c.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm text-google-gray-850 dark:text-white">{c.subject}</h4>
                  <p className="text-xs text-google-gray-500 mt-1">
                    Instructor: {c.mentorName} | Timings: {new Date(c.startTime).toLocaleString()}
                  </p>
                </div>
                <a
                  href={c.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-google-blue text-white py-2 px-4 text-xs font-bold hover:bg-google-blue/90"
                >
                  Join Google Meet
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recorded Classes Section */}
      <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
        <h3 className="font-bold text-google-gray-800 dark:text-white flex items-center gap-2 border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-6">
          <PlayCircle className="h-5 w-5 text-google-green" />
          Recorded lectures & Materials
        </h3>

        <div className="space-y-6">
          {modules.length === 0 ? (
            <p className="text-center text-xs text-google-gray-500 py-6">No recorded lectures uploaded yet.</p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="space-y-4">
                <h4 className="font-bold text-sm text-google-blue dark:text-google-blue-dark">{mod.title}</h4>
                <div className="space-y-3 pl-4">
                  {mod.chapters.map((chap) => (
                    <div key={chap.id} className="border border-google-gray-200 dark:border-google-gray-800 rounded-xl p-4 space-y-4">
                      <h5 className="font-semibold text-xs text-google-gray-800 dark:text-white uppercase tracking-wider">{chap.title}</h5>
                      <div className="space-y-2">
                        {chap.recordedClasses.map((rec) => (
                          <div key={rec.id} className="flex justify-between items-center bg-google-gray-50 dark:bg-google-gray-850 p-3 rounded-xl">
                            <span className="text-xs font-semibold text-google-gray-750 dark:text-google-gray-300 flex items-center gap-2">
                              <Video className="h-4 w-4 text-google-blue" />
                              {rec.title}
                            </span>
                            <div className="flex gap-2">
                              {rec.notesUrl && (
                                <a
                                  href={rec.notesUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg border border-google-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-google-gray-600 hover:bg-google-gray-100 flex items-center gap-1 dark:bg-google-surface-dark dark:border-google-gray-700 dark:text-google-gray-400"
                                >
                                  <FileText className="h-3 w-3" />
                                  Notes PDF
                                </a>
                              )}
                              <a
                                href={rec.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-google-green text-white px-3 py-1 text-xs font-bold"
                              >
                                Watch Lecture
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};
