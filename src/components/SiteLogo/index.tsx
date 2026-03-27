import React from 'react';
import { Sparkles } from 'lucide-react';

const SiteLogo: React.FC = () => (
  <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center">
    <div className="w-16 h-16 bg-gradient-to-tr from-[#FFB7C5] to-[#a1c4fd] rounded-full flex items-center justify-center mb-4 shadow-inner text-white animate-[float_4s_ease-in-out_infinite]">
      <Sparkles size={28} />
    </div>
    <h1 className="text-lg font-bold text-brown mb-1 tracking-wide">sakura-offer-hub</h1>
    <p className="text-xs text-[#8D6E63] font-medium opacity-80">Anime Job Hub</p>
  </div>
);

export default React.memo(SiteLogo);
