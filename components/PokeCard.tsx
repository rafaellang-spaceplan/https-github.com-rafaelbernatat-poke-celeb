import React from 'react';
import { PokemonData } from '../types';

interface PokeCardProps {
  data: PokemonData;
  image: string | null; // Base64 string
  id?: string;
}

// Helper to map types to specific CSS colors/gradients
const getTypeStyles = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('fire')) return { bg: 'bg-red-500', text: 'text-red-900', icon: '🔥' };
  if (t.includes('water')) return { bg: 'bg-blue-400', text: 'text-blue-900', icon: '💧' };
  if (t.includes('grass')) return { bg: 'bg-green-500', text: 'text-green-900', icon: '🌿' };
  if (t.includes('electric')) return { bg: 'bg-yellow-400', text: 'text-yellow-900', icon: '⚡' };
  if (t.includes('psychic')) return { bg: 'bg-purple-500', text: 'text-purple-900', icon: '👁️' };
  if (t.includes('fighting')) return { bg: 'bg-orange-600', text: 'text-orange-900', icon: '🥊' };
  if (t.includes('dark')) return { bg: 'bg-slate-700', text: 'text-slate-100', icon: '🌑' };
  if (t.includes('steel')) return { bg: 'bg-slate-400', text: 'text-slate-800', icon: '⚙️' };
  if (t.includes('fairy')) return { bg: 'bg-pink-400', text: 'text-pink-900', icon: '✨' };
  return { bg: 'bg-slate-200', text: 'text-slate-800', icon: '⚪' }; // Colorless
};

const PokeCard: React.FC<PokeCardProps> = ({ data, image, id }) => {
  const style = getTypeStyles(data.type);

  // Fallback for energy cost rendering
  const renderCost = (costStr: string) => {
    const count = Math.min(costStr.split(' ').length, 4);
    return (
      <div className="flex gap-1 justify-center">
         {Array.from({ length: count }).map((_, i) => (
             <div key={i} className="w-4 h-4 rounded-full shadow-sm border border-black/20 bg-white flex items-center justify-center text-[10px] leading-none z-10">
                {style.icon}
             </div>
         ))}
      </div>
    );
  };

  return (
    <div id={id} className="relative w-[350px] h-[490px] bg-slate-200 rounded-[18px] p-[12px] shadow-2xl font-tcg text-black select-none border border-slate-400 overflow-hidden">
      
      {/* Main Colored Body */}
      <div className={`w-full h-full ${style.bg} relative flex flex-col shadow-inner border border-black/10`}>
        
        {/* === HEADER (Fixed Height ~40px) === */}
        <div className="flex justify-between items-end px-3 pt-2 pb-1 shrink-0 h-[40px]">
            <div className="flex flex-col relative z-10 flex-1 min-w-0 mr-2">
                <div className="bg-slate-100/90 border border-black/10 px-1.5 py-0.5 rounded-full shadow-sm w-fit mb-0.5">
                     <span className="text-[6px] font-bold text-slate-800 uppercase tracking-widest whitespace-nowrap block leading-none">Basic</span>
                </div>
                <h2 className="text-base font-extrabold leading-none tracking-tighter text-black drop-shadow-sm whitespace-nowrap overflow-visible">
                    {data.name}
                </h2>
            </div>

            <div className="flex items-center gap-2 mb-1 shrink-0">
                <span className="text-base font-bold text-black/90 whitespace-nowrap tracking-tighter">HP {data.hp.replace(/[^0-9]/g, '')}</span>
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-xs border border-white/40 shadow-sm text-white shrink-0">
                    {style.icon}
                </div>
            </div>
        </div>

        {/* === IMAGE (Fixed Height ~200px) === */}
        <div className="mx-3 relative shrink-0 h-[200px] bg-gradient-to-br from-yellow-100 via-white to-yellow-50 shadow-md border-[3px] border-[#e0c068]">
            <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white">
            {image ? (
                <img src={`data:image/png;base64,${image}`} alt={data.name} className="object-contain w-full h-full" />
            ) : (
                <div className="text-gray-400 text-xs font-bold animate-pulse">Generating Art...</div>
            )}
            </div>
        </div>

        {/* === INFO STRIP (Fixed Height ~20px) === */}
        <div className="mx-4 h-[18px] bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300 border-x border-b border-black/10 flex items-center justify-center gap-4 shadow-sm shrink-0 transform -translate-y-px z-10 relative overflow-hidden">
             <span className="text-[8px] font-bold text-slate-700 italic whitespace-nowrap px-1">Celeb Pokémon • HT: 1.8m • WT: 80kg</span>
        </div>

        {/* === ATTACKS (Flexible Height) === */}
        <div className="flex-1 flex flex-col justify-start pt-3 pb-1 px-3 gap-3 min-h-0 overflow-hidden relative">
          {data.attacks.slice(0, 2).map((atk, idx) => (
            <div key={idx} className="flex flex-col relative group">
               <div className="flex items-center w-full">
                   {/* Cost */}
                   <div className="w-[50px] shrink-0 flex justify-start -ml-1">
                        {renderCost(atk.cost)}
                   </div>
                   
                   {/* Name */}
                   <div className="flex-1 text-sm font-bold text-black leading-tight text-center relative -left-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {atk.name}
                   </div>

                   {/* Damage */}
                   <div className="w-[30px] shrink-0 text-lg font-normal text-black leading-none text-right whitespace-nowrap">
                        {atk.damage.replace(/[^0-9+x]/g, '') || '30'}
                   </div>
               </div>
               
               {/* Description */}
               <p className="text-[9px] leading-[1.1] text-black/80 font-medium text-center mt-0.5 px-2 line-clamp-2">
                  {atk.description}
               </p>
            </div>
          ))}
        </div>

        {/* === FOOTER STATS (Fixed Height ~25px) === */}
        <div className="mx-3 h-[24px] border-t border-black/20 flex items-center text-center shrink-0">
            {/* Weakness */}
            <div className="flex-1 flex items-center justify-center gap-1">
                <span className="text-[8px] font-bold text-black/70">weakness</span>
                <div className="w-3 h-3 rounded-full bg-black text-white text-[8px] flex items-center justify-center">{style.icon === '🔥' ? '💧' : '🔥'}</div>
                <span className="text-[9px] font-bold">x2</span>
            </div>

            {/* Resistance */}
            <div className="flex-1 flex items-center justify-center gap-1 border-l border-black/10">
                <span className="text-[8px] font-bold text-black/70">resistance</span>
                {data.resistance && data.resistance.toLowerCase() !== 'none' ? (
                     <div className="flex items-center gap-0.5">
                         <div className="w-3 h-3 rounded-full bg-slate-600 text-white text-[8px] flex items-center justify-center">🛡️</div>
                         <span className="text-[9px] font-bold">-30</span>
                     </div>
                ) : null}
            </div>

            {/* Retreat */}
            <div className="flex-1 flex items-center justify-center gap-1 border-l border-black/10">
                <span className="text-[8px] font-bold text-black/70">retreat</span>
                <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(data.retreatCost || 1, 3) }).map((_, i) => (
                        <span key={i} className="text-[10px] leading-none">★</span>
                    ))}
                </div>
            </div>
        </div>

        {/* === FLAVOR TEXT (Fixed Box) === */}
        <div className="mx-3 mb-2 border border-black/15 bg-white/50 p-1.5 rounded-sm shadow-sm shrink-0 h-[48px] flex items-center overflow-hidden">
             <p className="text-[8px] font-serif italic text-black/90 leading-tight w-full line-clamp-4">
                 {data.description}
             </p>
        </div>
        
        {/* Bottom Corner Data */}
        <div className="absolute bottom-0.5 right-2 w-full text-right px-2">
             <span className="text-[6px] font-bold text-black/40 whitespace-nowrap">
                ©2026 Pokémon / Nintendo / Creatures / GAME FREAK
             </span>
        </div>

      </div>
    </div>
  );
};

export default PokeCard;