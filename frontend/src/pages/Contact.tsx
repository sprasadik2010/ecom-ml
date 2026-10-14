import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Headphones,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderOrSwId: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'How do I track my dispatched order?',
      a: 'All orders are dispatched via official India Post speed and tracked parcel logistics. Once an administrator approves your order, your tracking Article number is instantly posted on your Orders page with a direct India Post tracking link.'
    },
    {
      q: 'When do my Sales Wallet (SW) points get credited?',
      a: 'SW points are credited to your personal account immediately after the administrator verifies payment and approves the order. If you have an active sponsor and downline binary branches, volume matching and sponsor matching bonuses trigger concurrently.'
    },
    {
      q: 'What is the return policy for damaged items?',
      a: 'We offer a strict 3-Day Return & Replacement Policy for any transit-damaged or defective merchandise. Simply submit a unboxing photo/video within 72 hours of postal delivery.'
    },
    {
      q: 'How does personal member activation work?',
      a: 'To activate your member ID and begin qualifying for 1:1 binary matching pairs, you need a minimum personal cumulative purchase of 50 SW volume points.'
    }
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#7A6369]">
          <Link to="/" className="hover:text-[#A8435D] transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#331B21]">Contact Us</span>
        </nav>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8435D] block">
            Customer Support
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#331B21] font-normal">
            We're Here to Help
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
            Have questions about your order, tracking status, or member SW commissions? Reach out to our dedicated support team anytime.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5EF] text-[#0D7A5C] flex items-center justify-center font-bold">
              <Headphones size={20} />
            </div>
            <h4 className="font-serif text-base text-[#331B21] font-semibold">Customer Helpline</h4>
            <p className="text-xs text-[#7A6369]">Toll-free customer care and order assistance.</p>
            <a
              href="tel:1800289929"
              className="text-xs font-bold text-[#0D7A5C] hover:underline block pt-1"
            >
              1800-BUYWAY-CARE
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F6] text-[#A8435D] flex items-center justify-center font-bold">
              <Mail size={20} />
            </div>
            <h4 className="font-serif text-base text-[#331B21] font-semibold">Email Desk</h4>
            <p className="text-xs text-[#7A6369]">Send us detailed business or technical questions.</p>
            <a
              href="mailto:support@buyway.com"
              className="text-xs font-bold text-[#A8435D] hover:underline block pt-1"
            >
              support@buyway.com
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF2E8] text-[#C07718] flex items-center justify-center font-bold">
              <Phone size={20} />
            </div>
            <h4 className="font-serif text-base text-[#331B21] font-semibold">Helpline</h4>
            <p className="text-xs text-[#7A6369]">Mon - Sat: 9:00 AM - 7:00 PM IST</p>
            <span className="text-xs font-bold text-[#331B21] block pt-1">
              1800-BUYWAY-CARE
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DEF0FB] text-[#1B6CA8] flex items-center justify-center font-bold">
              <MapPin size={20} />
            </div>
            <h4 className="font-serif text-base text-[#331B21] font-semibold">Logistics Hub</h4>
            <p className="text-xs text-[#7A6369]">Official postal routing & dispatch center, India.</p>
            <span className="text-xs font-bold text-[#331B21] block pt-1">
              Bengaluru, Karnataka
            </span>
          </div>
        </div>

        {/* Contact Form & FAQs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-[#EFE2DE] shadow-xs space-y-6">
            <div>
              <h3 className="font-serif text-2xl text-[#331B21] font-semibold">Send a Message</h3>
              <p className="text-xs text-[#7A6369] mt-1">
                Fill in the details below and our customer assistance team will respond promptly.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 bg-[#E8F5EF] rounded-2xl border border-[#C5E8D6] text-center space-y-3">
                <CheckCircle2 size={40} className="text-[#0D7A5C] mx-auto" />
                <h4 className="font-serif text-lg text-[#0D7A5C] font-semibold">Message Received!</h4>
                <p className="text-xs text-[#3E6554] max-w-sm mx-auto">
                  Thank you, <span className="font-bold">{formData.name}</span>. Your support request has been logged. Our team will get back to you at {formData.email}.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', orderOrSwId: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="px-6 py-2 bg-[#0D7A5C] text-white text-xs font-bold rounded-full hover:bg-[#0B6B50] transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A343A]">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-xs text-[#251117] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B8586E]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A343A]">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-xs text-[#251117] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B8586E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A343A]">Order ID or Username (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. #ORD-1042 or username"
                      value={formData.orderOrSwId}
                      onChange={e => setFormData({ ...formData, orderOrSwId: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-xs text-[#251117] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B8586E]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A343A]">Topic</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-xs text-[#251117] font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#B8586E] cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order & Tracking">Order & Postal Tracking</option>
                      <option value="Returns & Defect">3-Day Return Claim</option>
                      <option value="MLM & SW Volume">Member SW Points & Tree</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A343A]">Message Details *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="How can we help you today?"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8D7DC] text-xs text-[#251117] rounded-xl p-4 focus:outline-none focus:border-[#B8586E]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 bg-[#B8586E] hover:bg-[#A3475D] text-white rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Send size={15} />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Frequently Asked Questions */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-10 border border-[#EFE2DE] shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-[#A8435D]">
              <HelpCircle size={20} />
              <h3 className="font-serif text-2xl text-[#331B21] font-semibold">Common Questions</h3>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8D7DC] space-y-1.5">
                  <h4 className="font-semibold text-xs text-[#331B21]">{faq.q}</h4>
                  <p className="text-[11px] text-[#7A6369] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
