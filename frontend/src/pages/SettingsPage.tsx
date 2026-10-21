import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Lock, Save, CheckCircle, Building2, User, ShieldCheck } from 'lucide-react';
import { settingsApi, authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

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

  // Fetch real company settings from DB
  const { data: settingsResponse, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings-all'],
    queryFn: () => settingsApi.getAll(),
  });

  // Sync state whenever settings are loaded or updated
  useEffect(() => {
    if (settingsResponse) {
      const companyProfile =
        (settingsResponse as any)?.settings?.company_profile ||
        (settingsResponse as any)?.data?.find((s: any) => s.key === 'company_profile')?.value;

      if (companyProfile) {
        if (companyProfile.companyName) setCompanyName(companyProfile.companyName);
        if (companyProfile.companyGst) setCompanyGst(companyProfile.companyGst);
        if (companyProfile.companyAddress) setCompanyAddress(companyProfile.companyAddress);
        if (companyProfile.companyCin) setCompanyCin(companyProfile.companyCin);
        if (companyProfile.bankName) setBankName(companyProfile.bankName);
        if (companyProfile.bankAccount) setBankAccount(companyProfile.bankAccount);
        if (companyProfile.bankIfsc) setBankIfsc(companyProfile.bankIfsc);
        if (companyProfile.defaultValidity) setDefaultValidity(String(companyProfile.defaultValidity));
        if (companyProfile.defaultGst) setDefaultGst(String(companyProfile.defaultGst));
      }
    }
  }, [settingsResponse]);

  // Save company config (Director & Administrator)
  const saveCompanySettingsMutation = useMutation({
    mutationFn: async () => {
      return settingsApi.update('company_profile', {
        companyName: companyName.trim(),
        companyGst: companyGst.trim(),
        companyAddress: companyAddress.trim(),
        companyCin: companyCin.trim(),
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        bankIfsc: bankIfsc.trim(),
        defaultValidity: defaultValidity.trim(),
        defaultGst: defaultGst.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-all'] });
      // Update local storage and broadcast event for immediate real-time sync across UI
      localStorage.setItem('mv_company_name', companyName.trim());
      window.dispatchEvent(new Event('company_settings_updated'));

      setSuccessMessage('Company information saved! Quotations, PDFs, and system branding have been updated automatically.');
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to save settings. Please verify you are logged in as Director or Administrator.');
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

  const canEditCompany = user?.role === 'DIRECTOR' || user?.role === 'ADMINISTRATOR';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-600" />
          Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Company legal profile, bank payment credentials, and personal account preferences
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 font-medium transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'company'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Information
          {activeTab === 'company' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-medium transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          My Profile
          {activeTab === 'profile' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 font-medium transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'security'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Security & Password
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab: COMPANY */}
      {activeTab === 'company' && (
        <GlassCard title="Organization & Legal Identity" subtitle="Changes here update automatically across all quotations, PDFs, and invoices">
          <div className="space-y-5">
            {!canEditCompany && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Only Director or Administrator can modify company legal and banking credentials.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!canEditCompany || isLoadingSettings}
                placeholder="e.g. MV GREENTECH PVT LTD"
                required
              />
              <Input
                label="GST Identification Number (GSTIN)"
                value={companyGst}
                onChange={(e) => setCompanyGst(e.target.value.toUpperCase())}
                disabled={!canEditCompany || isLoadingSettings}
                placeholder="e.g. 27AAECM1234F1Z5"
              />
              <div className="md:col-span-2">
                <Input
                  label="Registered Factory & Corporate Address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  disabled={!canEditCompany || isLoadingSettings}
                  placeholder="Plot No, Industrial Area, City, State, PIN"
                />
              </div>
              <Input
                label="Corporate Identity Number (CIN)"
                value={companyCin}
                onChange={(e) => setCompanyCin(e.target.value.toUpperCase())}
                disabled={!canEditCompany || isLoadingSettings}
                placeholder="e.g. U29300MH2021PTC354921"
              />
              <Input
                label="Default Quotation Validity (Days)"
                type="number"
                value={defaultValidity}
                onChange={(e) => setDefaultValidity(e.target.value)}
                disabled={!canEditCompany || isLoadingSettings}
                placeholder="30"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-3">
                Banking Details (Printed on Commercial Quotations & Invoices)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={!canEditCompany || isLoadingSettings}
                  placeholder="e.g. HDFC Bank Ltd"
                />
                <Input
                  label="Account Number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  disabled={!canEditCompany || isLoadingSettings}
                  placeholder="e.g. 50200067891234"
                />
                <Input
                  label="IFSC Code"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  disabled={!canEditCompany || isLoadingSettings}
                  placeholder="e.g. HDFC0001234"
                />
              </div>
            </div>

            {canEditCompany && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={saveCompanySettingsMutation.isPending}
                  onClick={() => saveCompanySettingsMutation.mutate()}
                >
                  Save Settings
                </Button>
              </div>
            )}
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

            <div className="flex justify-end pt-4 border-t border-slate-100">
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

            <div className="flex justify-end pt-4 border-t border-slate-100">
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
