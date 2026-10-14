import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Clock,
  Camera,
  Truck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  PackageCheck,
  Send
} from 'lucide-react';
import bwLogo from '../assets/bwLogo.jpeg';

export const ReturnPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#705960] hover:text-[#A8435D] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Catalog
      </Link>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#F6ECE7] via-[#F3E3DD] to-[#ECD5CD] border border-[#EEDCD6] rounded-3xl p-8 sm:p-10 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#8C3A4D] block">
            BUYWAY CUSTOMER CARE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#331B21] font-normal leading-tight">
            Return & Replacement Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#6D555B] leading-relaxed">
            We are committed to delivering premium quality products. Please review our official transit damage and replacement guidelines below.
          </p>
        </div>

        <div className="p-4 bg-white/80 rounded-2xl border border-white/60 shadow-sm shrink-0">
          <div className="flex items-center gap-2 text-[#A8435D] font-bold text-sm">
            <Clock size={20} />
            <span>3-Day Window</span>
          </div>
          <p className="text-[11px] text-[#705960] mt-1 text-center">From delivery date</p>
        </div>
      </div>

      {/* Core Policy Points (Exact User Specifications) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Return & Replacement Eligibility */}
        <div className="bg-white border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#F5EDE9] pb-4">
            <div className="p-2.5 bg-[#E8F5EF] text-[#0D7A5C] rounded-xl shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#331B21] font-normal">Return Policy</h2>
              <p className="text-[11px] text-[#705960]">Applicable for transit damaged products</p>
            </div>
          </div>

          <ul className="space-y-4 text-xs text-[#4A343A] leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A5C] mt-1.5 shrink-0" />
              <span>
                <strong>3-Day Notice Window:</strong> BuyWay accepts return requests for products that arrive damaged, provided the request is submitted within <strong>3 days of delivery</strong>.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A5C] mt-1.5 shrink-0" />
              <span>
                <strong>Photo Proof & Order ID:</strong> Customers must provide the valid order number and clear photographs of the damaged product and parcel packaging.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A5C] mt-1.5 shrink-0" />
              <span>
                <strong>Review & Approval:</strong> The reported damage will be reviewed by our quality verification team before the return is approved.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A5C] mt-1.5 shrink-0" />
              <span>
                <strong>Zero Return Shipping Cost:</strong> BuyWay will bear the return shipping cost for verified damaged products.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A5C] mt-1.5 shrink-0" />
              <span>
                <strong>Replacement:</strong> A prompt replacement will be provided subject to stock availability and applicable consumer law.
              </span>
            </li>
          </ul>
        </div>

        {/* 2. Non-Eligible Returns */}
        <div className="bg-white border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#F5EDE9] pb-4">
            <div className="p-2.5 bg-[#FDF2F2] text-[#B91C1C] rounded-xl shrink-0">
              <XCircle size={22} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#331B21] font-normal">Non-Eligible Returns</h2>
              <p className="text-[11px] text-[#705960]">Items and conditions not covered</p>
            </div>
          </div>

          <ul className="space-y-4 text-xs text-[#4A343A] leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] mt-1.5 shrink-0" />
              <span>
                <strong>Customer Misuse or Wear:</strong> Products damaged through customer misuse, alteration, wear, or physical mishandling after delivery.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] mt-1.5 shrink-0" />
              <span>
                <strong>Missing Tags & Accessories:</strong> Products returned without required original brand tags, labels, packaging, or accessories, where applicable.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] mt-1.5 shrink-0" />
              <span>
                <strong>Requests After 3 Days:</strong> Ordinary return requests submitted after the 3-day delivery window has expired, except where applicable consumer law provides otherwise.
              </span>
            </li>
          </ul>

          <div className="bg-[#FAF7F2] border border-[#EFE2DE] p-4 rounded-xl text-[11px] text-[#705960] leading-normal">
            💡 <strong>Helpful Tip:</strong> When receiving parcels via India Post, please inspect the external box before opening and take a quick unboxing video or photos.
          </div>
        </div>
      </div>

      {/* 3. Step-by-Step Claim Process */}
      <div className="bg-white border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="font-serif text-xl text-[#331B21] font-normal">How to Submit a Damage Return Request</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FDF4F6] text-[#A8435D] font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-xs text-[#331B21]">Take Clear Photos</h4>
            <p className="text-[11px] text-[#705960] leading-relaxed">
              Capture photos showing the damaged product area along with the postal shipping label on the package.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FDF4F6] text-[#A8435D] font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-xs text-[#331B21]">Contact Support in 3 Days</h4>
            <p className="text-[11px] text-[#705960] leading-relaxed">
              Contact our customer support desk or email support@buyway.com with your Order Number (e.g. #0012) and the photos.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FDF4F6] text-[#A8435D] font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-xs text-[#331B21]">Review & Replacement</h4>
            <p className="text-[11px] text-[#705960] leading-relaxed">
              Once verified, we arrange reverse pickup at our cost and dispatch your replacement parcel.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Contact Support Action Card */}
      <div className="bg-[#FAF4F0] border border-[#EFE2DE] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h4 className="font-serif text-xl text-[#331B21]">Have a Damaged Parcel to Report?</h4>
          <p className="text-xs text-[#7A6369] mt-1 max-w-lg">
            Our customer support desk is ready to assist you. Submit your Order ID and details through our support desk for expedited replacement.
          </p>
        </div>

        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-7 py-3 bg-[#A8435D] hover:bg-[#8C2E42] text-white rounded-full text-xs font-bold shadow-md shadow-[#A8435D]/20 transition-all shrink-0"
        >
          <Send size={15} />
          <span>Submit Support Ticket</span>
        </Link>
      </div>
    </div>
  );
};

export default ReturnPolicy;
