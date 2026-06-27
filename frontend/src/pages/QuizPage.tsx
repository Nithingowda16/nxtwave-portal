import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Toast } from '../components/Toast';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { Clock, HelpCircle, Trophy, Award, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  content: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  durationMin: number;
  maxMarks: number;
  negativeMark: number;
  questions: Question[];
}

export const QuizPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  // Solving state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [quizActive, setQuizActive] = useState(false);

  // Result state
  const [quizResult, setQuizResult] = useState<{ score: number; maxMarks: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Load quizzes (simulated list linked to student course)
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Fetch dashboard to obtain course details, then retrieve quizzes
        const dashRes = await api.get('/students/dashboard');
        const courseTitle = dashRes.data.course;
        
        // Mock list of quizzes
        setQuizzes([
          {
            id: 'quiz-1',
            title: 'Node.js Express Foundations Quiz',
            durationMin: 10,
            maxMarks: 20,
            negativeMark: 0.5,
            questions: [
              {
                id: 'q-1',
                content: 'Which HTTP status code represents "201 Created"?',
                options: ['Successful resource creation', 'Success with empty payload', 'Resource redirect', 'Bad request'],
              },
              {
                id: 'q-2',
                content: 'In Express, which middleware is used to parse JSON requests?',
                options: ['express.json()', 'express.urlencoded()', 'cors()', 'helmet()'],
              },
              {
                id: 'q-3',
                content: 'Prisma ORM connects to PostgreSQL by default via what file configuration?',
                options: ['package.json', 'schema.prisma', 'tsconfig.json', 'docker-compose.yml'],
              },
            ],
          },
        ]);
      } catch (err) {
        setToastMessage('Failed to fetch quizzes list');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!quizActive || timeLeft <= 0) {
      if (quizActive && timeLeft === 0) {
        // Auto-submit on timeout
        handleSubmitQuiz();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizActive, timeLeft]);

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setTimeLeft(quiz.durationMin * 60);
    setQuizActive(true);
    setQuizResult(null);
  };

  const handleOptionChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    setQuizActive(false);

    try {
      const timeTaken = selectedQuiz.durationMin * 60 - timeLeft;
      const res = await api.post('/quizzes/submit', {
        quizId: selectedQuiz.id,
        answers,
        timeTaken,
      });

      setQuizResult({
        score: res.data.score,
        maxMarks: res.data.maxMarks,
      });

      setToastMessage('Quiz submitted successfully!');
      setToastType('success');

      // Fetch leaderboard
      const lbRes = await api.get(`/quizzes/leaderboard/${selectedQuiz.id}`);
      setLeaderboard(lbRes.data);
    } catch (err: any) {
      setToastMessage('Quiz submission failed');
      setToastType('error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      {/* Quiz list Selection */}
      {!selectedQuiz && (
        <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
          <h3 className="font-bold text-google-gray-800 dark:text-white mb-4">Available Quizzes</h3>
          <div className="divide-y divide-google-gray-150 dark:divide-google-gray-800">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="py-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm text-google-gray-850 dark:text-white">{quiz.title}</h4>
                  <p className="text-xs text-google-gray-500 mt-1">
                    Duration: {quiz.durationMin} mins | Max Marks: {quiz.maxMarks} | Penalty: -{quiz.negativeMark} per error
                  </p>
                </div>
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  className="rounded-xl bg-google-blue text-white py-2 px-4 text-xs font-bold"
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Quiz Solving Form */}
      {selectedQuiz && quizActive && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm space-y-8">
              <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800">
                {selectedQuiz.title}
              </h3>

              {selectedQuiz.questions.map((q, qIndex) => (
                <div key={q.id} className="space-y-4">
                  <h4 className="font-semibold text-sm text-google-gray-850 dark:text-white flex gap-2">
                    <span className="text-google-blue font-extrabold">{qIndex + 1}.</span>
                    {q.content}
                  </h4>
                  <div className="space-y-2 pl-6">
                    {q.options.map((opt, oIndex) => {
                      const isChecked = answers[q.id] === oIndex;
                      return (
                        <label
                          key={oIndex}
                          className={`flex items-center gap-3 p-3 rounded-xl border border-google-gray-200 dark:border-google-gray-750 hover:bg-google-gray-50 dark:hover:bg-google-gray-850 cursor-pointer transition-colors ${
                            isChecked ? 'bg-google-blue-light border-google-blue dark:bg-google-blue/10 dark:border-google-blue-dark' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={isChecked}
                            onChange={() => handleOptionChange(q.id, oIndex)}
                            className="h-4 w-4 border-google-gray-300 text-google-blue dark:border-google-gray-700"
                          />
                          <span className="text-xs font-semibold text-google-gray-750 dark:text-google-gray-300">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmitQuiz}
                className="w-full rounded-xl bg-google-green text-white py-3 font-bold hover:bg-google-green/90 dark:bg-google-green-dark dark:text-google-gray-900 transition-colors"
              >
                Submit Answers
              </button>
            </div>
          </div>

          {/* Time Counter Sidebar */}
          <div>
            <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm flex flex-col items-center">
              <Clock className="h-10 w-10 text-google-red mb-2" />
              <span className="text-xs font-semibold text-google-gray-500 uppercase">Time Remaining</span>
              <h2 className="text-4xl font-extrabold text-google-gray-800 dark:text-white mt-1">
                {formatTime(timeLeft)}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Submission Results and Leaderboard */}
      {selectedQuiz && !quizActive && quizResult && (
        <div className="grid gap-6 lg:grid-cols-3 animate-slide-in">
          {/* Results Score */}
          <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-14 w-14 text-google-green mb-4" />
            <h3 className="font-extrabold text-xl text-google-gray-800 dark:text-white">Evaluation Score</h3>
            <h2 className="text-5xl font-black text-google-blue dark:text-google-blue-dark mt-2">
              {quizResult.score} <span className="text-lg font-normal text-google-gray-500">/ {quizResult.maxMarks}</span>
            </h2>
            <p className="text-xs text-google-gray-500 mt-2">Includes negative marking penalties on error options.</p>
            <button
              onClick={() => setSelectedQuiz(null)}
              className="mt-6 rounded-xl border border-google-gray-300 py-2 px-4 text-xs font-bold text-google-gray-700 hover:bg-google-gray-50 dark:border-google-gray-700 dark:text-google-gray-300"
            >
              Back to Quiz List
            </button>
          </div>

          {/* Quiz Leaderboard */}
          <div className="lg:col-span-2 rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
            <h3 className="font-bold text-google-gray-800 dark:text-white flex items-center gap-2 border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-4">
              <Trophy className="h-5 w-5 text-google-yellow" />
              Quiz Performance Leaderboard
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-google-gray-200 text-google-gray-500">
                    <th className="py-2.5">Rank</th>
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Score Obtained</th>
                    <th className="py-2.5">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-google-gray-100 dark:divide-google-gray-850">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-google-gray-500">No submission rankings logged.</td>
                    </tr>
                  ) : (
                    leaderboard.map((item) => (
                      <tr key={item.rank} className="text-google-gray-700 dark:text-google-gray-300">
                        <td className="py-3 font-extrabold text-google-blue dark:text-google-blue-dark">#{item.rank}</td>
                        <td className="py-3 font-semibold">{item.name}</td>
                        <td className="py-3 font-bold text-google-gray-850 dark:text-white">{item.score} / {selectedQuiz.maxMarks}</td>
                        <td className="py-3">{Math.floor(item.timeTaken / 60)}m {item.timeTaken % 60}s</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
