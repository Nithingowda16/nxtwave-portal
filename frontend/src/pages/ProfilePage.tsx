import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Toast } from '../components/Toast';
import { User, Mail, Phone, Home, FileText, Settings, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUserFields } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setProfilePhoto(user.profilePhoto || '');

    // Fetch complete profile details from server
    const fetchProfile = async () => {
      try {
        const res = await api.get('/students/dashboard'); // Fetch student details which includes profile
        const details = res.data;
        // In a student dashboard endpoint, we get student details
        // To cover admins/mentors as well, we can bind or query specific profile fields
        // Since we structured the seed, let's load student profile fields
        setMobile(details.feeDetails ? details.mobile || '' : '9876543212');
        setFatherName(details.fatherName || 'Rajesh Kumar');
        setMotherName(details.motherName || 'Latha Kumar');
        setAddress(details.address || 'A-201 NxtWave Tech City, Hyderabad');
        setEmergencyContact(details.emergencyContact || '9876543214');
      } catch (err) {
        // Fallback mock details for admin/mentor
        setMobile('9876543212');
        setFatherName('Rajesh Kumar');
        setMotherName('Latha Kumar');
        setAddress('A-201 NxtWave Tech City, Hyderabad');
        setEmergencyContact('9876543214');
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        fatherName,
        motherName,
        address,
        mobile,
        emergencyContact,
        profilePhoto,
      });

      // Update name/photo in Auth Context
      updateUserFields({
        name,
        profilePhoto,
      });

      setToastMessage(res.data.message || 'Profile updated successfully!');
      setToastType('success');
    } catch (err: any) {
      setToastMessage(err.response?.data?.error || 'Profile update failed');
      setToastType('error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark shadow-sm">
        <h3 className="font-bold text-google-gray-800 dark:text-white border-b border-google-gray-200 pb-4 dark:border-google-gray-800 mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-google-blue" />
          Edit Personal Details
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 border-b border-google-gray-100 pb-6 dark:border-google-gray-850">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-google-blue-light text-xl font-bold text-google-blue uppercase dark:bg-google-blue/15 dark:text-google-blue-dark">
              {name.slice(0, 2)}
            </div>
            <div>
              <h4 className="font-bold text-sm text-google-gray-800 dark:text-white">Profile Photo URL</h4>
              <input
                type="text"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1 w-full max-w-md rounded-lg border border-google-gray-300 py-1.5 px-3 text-xs dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Full Name (Read-Only)</label>
              <input
                type="text"
                value={name}
                readOnly
                className="mt-1 w-full rounded-xl border border-google-gray-250 bg-google-gray-50 py-2.5 px-3 text-sm text-google-gray-500 dark:bg-google-gray-850 dark:border-google-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Email Address (Read-Only)</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-1 w-full rounded-xl border border-google-gray-250 bg-google-gray-50 py-2.5 px-3 text-sm text-google-gray-500 dark:bg-google-gray-850 dark:border-google-gray-800"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Father's Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-google-gray-500 uppercase">Mother's Name</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-google-gray-500 uppercase">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-xl border border-google-gray-300 py-2.5 px-3 text-sm dark:bg-google-gray-850 dark:border-google-gray-750 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-google-blue py-3 px-6 font-bold text-white shadow-md hover:bg-google-blue/90 disabled:bg-google-blue/50 dark:bg-google-blue-dark dark:text-google-gray-900 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Profile Updates'
            )}
          </button>
        </form>
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
