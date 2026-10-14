import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Sparkles,
  Award,
  ShieldCheck,
  Truck,
  Users,
  TrendingUp,
  Heart,
  ArrowRight
} from 'lucide-react';
import bwLogo from '../assets/bwLogo.jpeg';

export const About: React.FC = () => {
  return (
    <div className="bg-[#FAF7F2] min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#7A6369]">
          <Link to="/" className="hover:text-[#A8435D] transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#331B21]">About Us</span>
        </nav>

        {/* Hero Banner Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F6ECE7] via-[#F3E3DD] to-[#ECD5CD] border border-[#EEDCD6] p-5 sm:p-12 lg:p-16 text-center space-y-4">
          <div className="w-16 sm:w-24 mx-auto mb-2">
            <img src={bwLogo} alt="Buyway" className="w-full h-auto object-contain rounded" />
          </div>
          <span className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.25em] text-[#8C3A4D] block">
            OUR STORY & MISSION
          </span>
          <h1 className="font-serif text-2xl sm:text-5xl text-[#331B21] font-normal max-w-2xl mx-auto leading-tight">
            Shop More, Live Better, <br />
            Earn & Grow Together <span className="text-[#A8435D]">♡</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6D555B] max-w-2xl mx-auto leading-relaxed">
            Buyway was born from a vision to blend seamless, premium e-commerce shopping with an empowering, transparent direct-selling binary rewards system.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF4F6] text-[#A8435D] flex items-center justify-center font-bold">
              <Heart size={24} />
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-[#331B21] font-semibold">Curated Quality</h3>
            <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
              We select every item in our catalog for authentic durability, superior craftsmanship, and modern lifestyle aesthetics.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF2E8] text-[#C07718] flex items-center justify-center font-bold">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-[#331B21] font-semibold">Empowering Rewards</h3>
            <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
              Every purchase earns Sales Wallet (SW) volume points, enabling customers to turn ordinary spending into sustainable recurring earnings.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-[#EFE2DE] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5EF] text-[#0D7A5C] flex items-center justify-center font-bold">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-[#331B21] font-semibold">Integrity & Speed</h3>
            <p className="text-xs sm:text-sm text-[#7A6369] leading-relaxed">
              Transparent binary trees, automated commission calculations, and official India Post tracked logistics for dependable delivery.
            </p>
          </div>
        </div>

        {/* How The Buyway Direct Selling Model Works */}
        <div className="bg-white rounded-3xl p-5 sm:p-12 border border-[#EFE2DE] shadow-xs space-y-6 sm:space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A8435D]">Transparent MLM Architecture</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#331B21]">How Buyway Works</h2>
            <p className="text-xs text-[#7A6369]">Simple, fair, and mathematically balanced direct selling.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8D7DC] space-y-2">
              <div className="text-sm font-bold text-[#A8435D]">Step 1</div>
              <h4 className="font-semibold text-sm text-[#331B21]">Free Registration</h4>
              <p className="text-xs text-[#7A6369] leading-relaxed">
                Sign up with a sponsor referral username or join directly to create your shopping and member account.
              </p>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8D7DC] space-y-2">
              <div className="text-sm font-bold text-[#A8435D]">Step 2</div>
              <h4 className="font-semibold text-sm text-[#331B21]">50 SW Activation</h4>
              <p className="text-xs text-[#7A6369] leading-relaxed">
                Make your first purchase accumulating at least 50 SW volume points to activate your member ID and binary node.
              </p>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8D7DC] space-y-2">
              <div className="text-sm font-bold text-[#A8435D]">Step 3</div>
              <h4 className="font-semibold text-sm text-[#331B21]">Binary Network Growth</h4>
              <p className="text-xs text-[#7A6369] leading-relaxed">
                Refer friends and build Left and Right team branches. Every product order downline contributes volume to both legs.
              </p>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8D7DC] space-y-2">
              <div className="text-sm font-bold text-[#A8435D]">Step 4</div>
              <h4 className="font-semibold text-sm text-[#331B21]">Matching Commissions</h4>
              <p className="text-xs text-[#7A6369] leading-relaxed">
                Receive 1:1 volume matching pairs directly into your wallet balance, plus 20% direct sponsor matching cuts.
              </p>
            </div>
          </div>
        </div>

        {/* CTA to Shop or Join */}
        <div className="bg-gradient-to-r from-[#9C384F] via-[#A8435D] to-[#8C2E42] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-serif text-2xl sm:text-3xl text-[#FFE8EE]">Start Your Journey with Buyway</h3>
            <p className="text-xs sm:text-sm text-[#FDE4EB] max-w-md">
              Discover quality products, become an active member, and build a rewarding business from home.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/shop"
              className="px-8 py-3 bg-white text-[#8C2E42] font-bold rounded-full text-xs sm:text-sm shadow-md hover:bg-[#FFF4F6] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explore Shop</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 bg-[#691C2E] text-white font-bold rounded-full text-xs sm:text-sm border border-white/20 hover:bg-[#571626] transition-all cursor-pointer"
            >
              <span>Sign Up Now</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
