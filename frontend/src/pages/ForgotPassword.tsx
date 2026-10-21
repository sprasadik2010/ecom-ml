import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, ShieldAlert, Send } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';
import bwLogo from '../assets/bwLogo.jpeg';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Could not process password reset request.');
      }

      setSuccessMessage(
        data.message ||
          'If an account exists with this email address, password reset instructions have been sent.'
      );
      setSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Something went wrong. Please check your network and try again.');
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
            Forgot Password
          </h2>
          <p className="text-[#7A6369] text-xs mt-1">
            Enter your email to receive a secure reset link
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs p-3.5 rounded-md mb-5 font-semibold flex items-start gap-2 leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-base text-[#331B21]">Check Your Inbox</h3>
              <p className="text-xs text-[#705960] leading-relaxed">
                {successMessage}
              </p>
              <p className="text-[11px] text-[#8C7077] bg-[#FAF7F2] p-3 rounded-lg border border-[#EFE2DE]">
                The reset link will remain valid for <strong>30 minutes</strong>. If you do not see it in your inbox, please verify your spam or junk folder.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full min-h-[44px] py-2.5 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#B8586E]/20 active:scale-95"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-normal">
            <div>
              <label className="text-[#705960] block mb-1 font-medium">Registered Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full bg-[#FAF7F2] border border-[#EFE2DE] rounded-xl p-3 pl-10 focus:outline-none focus:border-[#B8586E] text-[#251117] text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="name@example.com"
                />
                <Mail size={16} className="text-[#8C7077] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full min-h-[46px] py-3 px-4 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#B8586E]/20 cursor-pointer ${
                submitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              {submitting ? 'Sending Link...' : 'Send Reset Link'}
              <Send size={15} />
            </button>

            <div className="border-t border-[#F2E8E5] mt-6 pt-4 text-center">
              <Link
                to="/login"
                className="text-[#B8586E] hover:text-[#A1455B] font-bold text-xs inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} /> Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
