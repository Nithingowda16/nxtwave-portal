import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-google-red-light text-google-red mb-6 dark:bg-google-red/10 dark:text-google-red-dark">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-extrabold text-google-gray-800 dark:text-white">Page Not Found</h2>
      <p className="text-sm text-google-gray-500 mt-2 max-w-sm">
        The link you requested might be broken, or you may not have sufficient permissions to view this administrative resource.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-xl bg-google-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-google-blue/90"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};
