import React from 'react';
import { useAuth } from '../context/AuthContext';

export const FloatingWhatsApp: React.FC = () => {
  const { user, token, loading } = useAuth();

  // Display only on non-logged-in pages / for guest visitors
  if (loading || user || token) {
    return null;
  }

  const phoneNumber = '919446707043';
  const message = 'Hello BuyWay! I would like to know more about your products and business opportunities.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <aside aria-label="WhatsApp Support">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with BuyWay support at 9446707043"
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white pl-3.5 pr-4 py-2.5 sm:py-3 sm:px-4 rounded-full shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.6)] transition-all duration-300 border-2 border-white/95 group cursor-pointer select-none"
      >
        {/* Animated WhatsApp Icon Container */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 sm:w-7 sm:h-7 fill-white drop-shadow-xs transition-transform duration-300 group-hover:scale-110"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {/* Pulsing Online Status Indicator */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border border-emerald-500 shadow-xs"></span>
          </span>
        </div>

        {/* Text Details (Optimized for Mobile & Desktop) */}
        <div className="flex flex-col text-left pr-0.5">
          <span className="text-[9.5px] sm:text-[10px] font-bold text-white/95 uppercase tracking-wider leading-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse"></span>
            Need Help?
          </span>
          <span className="text-xs sm:text-sm font-extrabold tracking-tight leading-tight text-white font-sans mt-0.5 whitespace-nowrap">
            Chat on WhatsApp
          </span>
        </div>
      </a>
    </aside>
  );
};

