import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings, Lock, Save, CheckCircle } from 'lucide-react';
import { settingsApi, authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'company' | 'profile' | 'security'>('company');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Company settings state
  const [companyName, setCompanyName] = useState('MV GREENTECH PVT LTD');
  const [companyGst, setCompanyGst] = useState('27AAECM1234F1Z5');
  const [companyAddress, setCompanyAddress] = useState('Plot No. 42, Green Industrial Park, Pune, Maharashtra 411019');
  const [companyCin, setCompanyCin] = useState('U29300MH2021PTC354921');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [bankAccount, setBankAccount] = useState('50200067891234');
  const [bankIfsc, setBankIfsc] = useState('HDFC0001234');
  const [defaultValidity, setDefaultValidity] = useState('30');
  const [defaultGst, setDefaultGst] = useState('18');

  // User Profile state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Save company config
  const saveCompanySettingsMutation = useMutation({
    mutationFn: async () => {
      await settingsApi.update('company_profile', {
        companyName,
        companyGst,
        companyAddress,
        companyCin,
        bankName,
        bankAccount,
        bankIfsc,
        defaultValidity,
        defaultGst,
      });
    },
    onSuccess: () => {
      setSuccessMessage('Company profile settings saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  // Save personal profile
  const saveProfileMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ firstName, lastName, phone }),
    onSuccess: (res) => {
      if (res.data) updateUser(res.data);
      setSuccessMessage('Your profile has been updated.');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setSuccessMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: () => {
      alert('Failed to change password. Please check your current password.');
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-400" />
          Settings & Configuration
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Company legal profile, bank payment credentials, and personal account preferences
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 font-medium transition-colors relative cursor-pointer ${
            activeTab === 'company' ? 'text-teal-400 font-semibold' : 'text-white/50 hover:text-white'
          }`}
        >
          Company Information
          {activeTab === 'company' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-medium transition-colors relative cursor-pointer ${
            activeTab === 'profile' ? 'text-teal-400 font-semibold' : 'text-white/50 hover:text-white'
          }`}
        >
          My Profile
          {activeTab === 'profile' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 font-medium transition-colors relative cursor-pointer ${
            activeTab === 'security' ? 'text-teal-400 font-semibold' : 'text-white/50 hover:text-white'
          }`}
        >
          Security & Password
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab: COMPANY */}
      {activeTab === 'company' && (
        <GlassCard title="Organization & Legal Identity">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="GST Identification Number (GSTIN)"
                value={companyGst}
                onChange={(e) => setCompanyGst(e.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Registered Factory & Corporate Address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
              <Input
                label="Corporate Identity Number (CIN)"
                value={companyCin}
                onChange={(e) => setCompanyCin(e.target.value)}
              />
              <Input
                label="Default Quotation Validity (Days)"
                type="number"
                value={defaultValidity}
                onChange={(e) => setDefaultValidity(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3">
                Banking Details (For Quotations & Invoices)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
                <Input
                  label="Account Number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
                <Input
                  label="IFSC Code"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={saveCompanySettingsMutation.isPending}
                onClick={() => saveCompanySettingsMutation.mutate()}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tab: PROFILE */}
      {activeTab === 'profile' && (
        <GlassCard title="Personal Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email address cannot be changed."
              />
              <Input
                label="Mobile Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={saveProfileMutation.isPending}
                onClick={() => saveProfileMutation.mutate()}
              >
                Update Profile
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tab: SECURITY */}
      {activeTab === 'security' && (
        <GlassCard title="Change Password">
          <div className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button
                variant="primary"
                leftIcon={<Lock className="w-4 h-4" />}
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                isLoading={changePasswordMutation.isPending}
                onClick={() => changePasswordMutation.mutate()}
              >
                Update Password
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
