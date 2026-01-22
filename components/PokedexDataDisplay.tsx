import React, { useState } from 'react';
import { PokemonData } from '../types';
import { Copy, Volume2, Activity, Shield, Zap, ArrowRight, FileText, Database, Play, Download, Loader2 } from 'lucide-react';

interface PokedexProps {
  data: PokemonData;
  onCopyScript: () => void;
  audioUrl: string | null;
}

const PokedexDataDisplay: React.FC<PokedexProps> = ({ data, onCopyScript, audioUrl }) => {
  const [mode, setMode] = useState<'stats' | 'script'>('stats');

  return (
    <div className="w-full h-full bg-red-600 rounded-lg p-2 shadow-2xl border-l-8 border-red-800 flex flex-col relative overflow-hidden">
        
        {/* Top Camera/Sensor Bar */}
        <div className="h-16 flex items-start gap-4 p-2 border-b-4 border-red-800/30 mb-2">
            <div className="w-12 h-12 rounded-full bg-blue-400 border-4 border-white shadow-[0_0_10px_rgba(59,130,246,0.6)] relative overflow-hidden">
                <div className="absolute top-2 left-2 w-4 h-4 bg-white/60 rounded-full blur-[1px]"></div>
            </div>
            <div className="flex gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-red-800 border border-red-900"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
            </div>
        </div>

        {/* Main Screen Container */}
        <div className="flex-1 bg-slate-200 rounded-bl-3xl px-4 py-4 border-4 border-slate-300 shadow-inner flex flex-col gap-2 min-h-0">
            
            {/* The Screen Itself */}
            <div className="flex-1 bg-emerald-900 rounded-md border-4 border-slate-400 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] p-4 overflow-hidden relative font-lcd text-green-100 flex flex-col min-h-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,50,30,0.1)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none z-10 opacity-20"></div>
                
                {mode === 'stats' ? (
                    <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4 h-full">
                        <div className="border-b border-green-700/50 pb-2">
                            <h2 className="text-2xl uppercase tracking-widest text-green-300">{data.name}</h2>
                            <div className="flex justify-between text-sm opacity-80">
                                <span>TYPE: {data.type}</span>
                                <span>HP: {data.hp}</span>
                            </div>
                        </div>

                        <div className="text-sm leading-relaxed text-green-200/90 italic">
                            "{data.description}"
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs uppercase bg-green-800/40 px-1 inline-block text-green-400">Attacks</div>
                            {data.attacks.map((atk, idx) => (
                                <div key={idx} className="bg-emerald-950/50 p-2 rounded border border-emerald-700/30">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>{atk.name}</span>
                                        <span>{atk.damage}</span>
                                    </div>
                                    <div className="text-xs text-green-400/70">{atk.cost}</div>
                                    <div className="text-xs mt-1 leading-tight">{atk.description}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-emerald-950/30 p-1">
                                <span className="text-green-500 block">WEAKNESS</span>
                                {data.weakness || 'None'}
                            </div>
                            <div className="bg-emerald-950/30 p-1">
                                <span className="text-green-500 block">RESISTANCE</span>
                                {data.resistance || 'None'}
                            </div>
                            <div className="bg-emerald-950/30 p-1 col-span-2">
                                <span className="text-green-500 block">EVOLUTION</span>
                                {data.evolution || 'None'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                         <div className="flex justify-between items-center bg-green-800/40 px-1 mb-2 shrink-0">
                            <span className="text-xs uppercase text-green-400">TikTok Script</span>
                            
                            <div className="flex items-center gap-2">
                                {audioUrl && (
                                    <a 
                                        href={audioUrl} 
                                        download={`${data.name}_script.wav`}
                                        className="flex items-center gap-1 bg-green-600/50 hover:bg-green-600 text-[10px] px-2 py-0.5 rounded text-white transition-colors"
                                    >
                                        <Download size={10} />
                                        SAVE WAV
                                    </a>
                                )}
                            </div>
                         </div>
                         
                         <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 mb-2">
                             <p className="whitespace-pre-wrap text-sm leading-6 tracking-wide font-sans text-green-100">
                                 {data.script}
                             </p>
                         </div>

                         {audioUrl ? (
                             <div className="shrink-0 mt-auto border-t border-green-700/50 pt-2">
                                <audio controls src={audioUrl} className="w-full h-6 opacity-80" />
                             </div>
                         ) : (
                             <div className="shrink-0 mt-auto border-t border-green-700/50 pt-2 text-xs text-green-500/50 text-center">
                                 Generating audio...
                             </div>
                         )}
                    </div>
                )}
            </div>

            {/* Controls Area */}
            <div className="h-16 flex justify-between items-center px-2 shrink-0">
                
                {/* Mode Buttons */}
                <div className="flex gap-4">
                    <button 
                        onClick={() => setMode('stats')}
                        className={`w-10 h-10 rounded-full border-2 border-slate-400 shadow-md flex items-center justify-center transition-all ${mode === 'stats' ? 'bg-blue-500 text-white translate-y-0.5 shadow-none' : 'bg-slate-800 text-slate-400'}`}
                        title="Data Mode"
                    >
                        <Database size={18} />
                    </button>
                    <button 
                        onClick={() => setMode('script')}
                        className={`w-10 h-10 rounded-full border-2 border-slate-400 shadow-md flex items-center justify-center transition-all ${mode === 'script' ? 'bg-blue-500 text-white translate-y-0.5 shadow-none' : 'bg-slate-800 text-slate-400'}`}
                        title="Script Mode"
                    >
                        <FileText size={18} />
                    </button>
                </div>

                {/* D-Pad Decoration */}
                <div className="w-16 h-16 relative scale-75">
                    <div className="absolute left-1/2 -translate-x-1/2 w-4 h-full bg-slate-800 rounded"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-full bg-slate-800 rounded"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 rounded-full"></div>
                </div>

                {/* Action Button */}
                 <button 
                    onClick={onCopyScript}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                    <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-sm flex items-center justify-center text-yellow-900">
                        <Copy size={14} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600">COPY</span>
                </button>

            </div>
        </div>

        {/* Bottom Deco */}
        <div className="mt-2 flex justify-between items-center px-4 shrink-0">
             <div className="text-white/40 font-mono text-xs">VER 1.0</div>
             <div className="flex gap-1">
                 <div className="w-8 h-2 bg-slate-800 rounded-full"></div>
                 <div className="w-8 h-2 bg-slate-800 rounded-full"></div>
             </div>
        </div>
    </div>
  );
};

export default PokedexDataDisplay;