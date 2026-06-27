import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { Toast } from '../components/Toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) {
      setToastMessage('Please enter both your ID/Email and Password.');
      setToastType('error');
      return;
    }

    setLoading(true);
    try {
      await login(identity, password);
      setToastMessage('Signed in successfully!');
      setToastType('success');
      
      // Delay navigation slightly so user sees success state
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err: any) {
      setToastMessage(err.message || 'Incorrect credentials. Please try again.');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-google-gray-50 px-4 dark:bg-google-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-google-gray-200 bg-white p-8 shadow-sm transition-all duration-200 dark:border-google-gray-800 dark:bg-google-surface-dark">
        {/* Header Icon & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-google-blue-light text-google-blue dark:bg-google-blue/15 dark:text-google-blue-dark">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-google-gray-800 dark:text-white">
            Sign in to NxtWave Portal
          </h2>
          <p className="mt-1.5 text-sm text-google-gray-500 dark:text-google-gray-400">
            Enter your Email, Student ID, or Employee ID
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-google-gray-700 dark:text-google-gray-300">
              Identity ID / Email Address
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-google-gray-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="nithin@nxtwave.in or NW-STUD-1001"
                className="w-full rounded-xl border border-google-gray-300 bg-google-gray-50 py-2.5 pl-10 pr-4 text-sm text-google-gray-800 outline-none transition-all focus:border-google-blue focus:bg-white dark:border-google-gray-700 dark:bg-google-gray-850 dark:text-white dark:focus:border-google-blue-dark"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-google-gray-700 dark:text-google-gray-300">
                Password
              </label>
              <a
                href="#forgot"
                onClick={() => {
                  setToastMessage('Reset password link has been sent to your registered email.');
                  setToastType('success');
                }}
                className="text-xs font-semibold text-google-blue hover:underline dark:text-google-blue-dark"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-google-gray-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-google-gray-300 bg-google-gray-50 py-2.5 pl-10 pr-4 text-sm text-google-gray-800 outline-none transition-all focus:border-google-blue focus:bg-white dark:border-google-gray-700 dark:bg-google-gray-850 dark:text-white dark:focus:border-google-blue-dark"
                required
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-google-gray-300 text-google-blue outline-none focus:ring-0 dark:border-google-gray-750 dark:bg-google-gray-800"
            />
            <label
              htmlFor="remember"
              className="ml-2 text-xs text-google-gray-500 hover:text-google-gray-800 dark:text-google-gray-400 dark:hover:text-white cursor-pointer"
            >
              Remember my session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-google-blue py-3 font-semibold text-white shadow-md hover:bg-google-blue/90 disabled:bg-google-blue/50 dark:bg-google-blue-dark dark:text-google-gray-900 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing you in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="mt-6 rounded-xl bg-google-gray-50 p-4 dark:bg-google-gray-850 border border-google-gray-200 dark:border-google-gray-800">
          <p className="text-xs font-semibold text-google-blue dark:text-google-blue-dark">
            Demo credentials (pre-hashed in seed):
          </p>
          <div className="mt-2 space-y-1 text-xs text-google-gray-650 dark:text-google-gray-400">
            <p><span className="font-bold">Student:</span> student@nxtwave.in / student123</p>
            <p><span className="font-bold">Mentor:</span> mentor@nxtwave.in / mentor123</p>
            <p><span className="font-bold">Admin:</span> admin@nxtwave.in / admin123</p>
          </div>
        </div>
      </div>

      {/* Success/Error Alerts */}
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
