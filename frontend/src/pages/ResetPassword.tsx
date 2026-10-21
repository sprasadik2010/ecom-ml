import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';
import bwLogo from '../assets/bwLogo.jpeg';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  // Verification state
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setVerificationError('No password reset token was found in the link. Please request a new link.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/verify-reset-token?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'The reset link is invalid or has expired.');
        }

        setTokenValid(true);
        setTargetUsername(data.username || '');
      } catch (err: any) {
        setTokenValid(false);
        setVerificationError(err.message || 'The reset link is invalid or has expired.');
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (/\s/.test(cleanPass)) {
      setFormError('Password cannot contain spaces.');
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: cleanPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to reset password.');
      }

      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset submit error:', err);
      setFormError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16 min-h-[calc(100dvh-12rem)] flex flex-col justify-center">
      <div className="bg-white border border-[#EFE2DE] rounded-2xl p-5 sm:p-8 shadow-md relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#B8586E]" />

        <div className="text-center mb-6">
          <img src={bwLogo} alt="BuyWay" className="h-12 w-auto mx-auto mb-3 object-contain rounded" />
          <h2 className="font-serif text-2xl text-[#331B21] font-normal tracking-tight">
            Create New Password
          </h2>
          <p className="text-[#7A6369] text-xs mt-1">
            Choose a secure password for your account
          </p>
        </div>

        {/* 1. Verifying Token */}
        {verifying && (
          <div className="py-10 text-center space-y-3">
            <div className="h-8 w-8 border-3 border-[#B8586E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#705960]">Validating security link...</p>
          </div>
        )}

        {/* 2. Token Invalid or Expired */}
        {!verifying && !tokenValid && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <ShieldAlert size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-base text-[#331B21]">Invalid or Expired Link</h3>
              <p className="text-xs text-[#705960] leading-relaxed">
                {verificationError}
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <Link
                to="/forgot-password"
                className="w-full min-h-[44px] py-2.5 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 active:scale-95"
              >
                <KeyRound size={14} /> Request a New Reset Link
              </Link>
              <Link
                to="/login"
                className="w-full py-2 text-xs text-[#8C7077] hover:text-[#331B21] font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* 3. Success Confirmation */}
        {!verifying && tokenValid && resetSuccess && (
          <div className="space-y-5 text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-base text-[#331B21]">Password Reset Complete!</h3>
              <p className="text-xs text-[#705960] leading-relaxed">
                Your password has been updated successfully. You can now use your new password to access your account.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full min-h-[44px] py-2.5 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 active:scale-95 cursor-pointer"
              >
                Sign In Now
              </button>
            </div>
          </div>
        )}

        {/* 4. Reset Password Form */}
        {!verifying && tokenValid && !resetSuccess && (
          <div>
            {targetUsername && (
              <div className="mb-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#EFE2DE] text-xs text-[#705960]">
                Resetting password for account: <strong className="text-[#331B21]">@{targetUsername}</strong>
              </div>
            )}

            {formError && (
              <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs p-3.5 rounded-md mb-4 font-semibold flex items-start gap-2 leading-relaxed">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-normal">
              <div>
                <label className="text-[#705960] block mb-1 font-medium">New Password (min. 6 chars)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 pr-10 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value.replace(/\s+/g, ''))}
                    disabled={submitting}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7077] hover:text-[#331B21] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[#705960] block mb-1 font-medium">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 pr-10 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.replace(/\s+/g, ''))}
                    disabled={submitting}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7077] hover:text-[#331B21] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B8586E]/20 cursor-pointer ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                {submitting ? 'Updating Password...' : 'Save New Password'}
                <Lock size={15} />
              </button>

              <div className="border-t border-[#F2E8E5] mt-6 pt-4 text-center">
                <Link
                  to="/login"
                  className="text-[#B8586E] hover:text-[#A1455B] font-bold text-xs inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
