'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, ExclamationTriangleIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName((user as any).firstName ?? '');
      setMiddleName((user as any).middleName ?? '');
      setLastName((user as any).lastName ?? '');
      setUsername((user as any).username ?? '');
    }
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    router.replace('/login');
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaved(false);
    setProfileError('');
    try {
      await api.profile.update({
        firstName: firstName.trim() || undefined,
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
      }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.profile.changePassword({ currentPassword, newPassword }, token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeactivate() {
    if (!token) return;
    const confirmed = confirm(
      'Are you sure you want to deactivate your account?\n\nYour account will be inactive for 30 days. If you log in within that period, your account will be automatically reactivated. After 30 days without login, your account will be permanently deleted.'
    );
    if (!confirmed) return;
    setDeactivating(true);
    try {
      await api.profile.deactivate(token);
      logout();
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate account');
      setDeactivating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center gap-3">
          <UserCircleIcon className="w-7 h-7 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Profile form */}
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Profile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Grace"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Middle Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="input-field"
                  placeholder="Wanjiku"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Mwangi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="input-field pl-7"
                  placeholder="grace_mwangi"
                  pattern="^[a-z0-9_]{3,30}$"
                  title="3-30 characters: lowercase letters, numbers, underscores only"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                3–30 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </div>

            {profileError && (
              <p className="text-sm text-rose-600">{profileError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyIcon className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                autoComplete="new-password"
              />
            </div>

            {passwordError && (
              <p className="text-sm text-rose-600">{passwordError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="btn-primary disabled:opacity-50"
              >
                {changingPassword ? 'Updating…' : 'Update Password'}
              </button>
              {passwordChanged && (
                <span className="text-sm text-green-600 font-medium">Password updated!</span>
              )}
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border border-rose-100">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Deactivate Account</h2>
              <p className="text-sm text-slate-500 mb-4">
                Your account will be deactivated and you will be signed out. You can reactivate by
                logging back in within <strong>30 days</strong>. After 30 days without login, your
                account will be permanently deleted.
              </p>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                {deactivating ? 'Deactivating…' : 'Deactivate my account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
