import React, { useState, useRef } from 'react';
import { AppState, GeneratedAssets } from './types';
import { generatePokemonData, generatePokemonImage, generatePokemonSpeech, generatePokemonGallery } from './services/geminiService';
import { createSilhouette } from './utils/imageProcessing';
import { pcmToWavBlob } from './utils/audioProcessing';
import PokeCard from './components/PokeCard';
import PokedexDataDisplay from './components/PokedexDataDisplay';
import VideoStudio from './components/VideoStudio';
import { Loader2, Wand2, Package, Music, Video } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [celebrity, setCelebrity] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [loadingText, setLoadingText] = useState<string>('');
  const [assets, setAssets] = useState<GeneratedAssets>({
    data: null,
    originalImageBase64: null,
    silhouetteImageBase64: null,
    gallery: [],
    scriptAudioUrl: null,
    introAudioUrl: null,
    outroAudioUrl: null
  });
  const [activeTab, setActiveTab] = useState<'card' | 'creature' | 'silhouette' | 'gallery' | 'video'>('card');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const exportCardRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAssets(prev => ({ ...prev, introAudioUrl: URL.createObjectURL(file) }));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!celebrity.trim()) return;

    setAppState(AppState.GENERATING_DATA);
    setLoadingText(`Pesquisando por ${celebrity} na Pokédex global...`);

    try {
      const data = await generatePokemonData(celebrity);
      setAssets(prev => ({ ...prev, data }));
      
      setAppState(AppState.GENERATING_IMAGE);
      setLoadingText(`Renderizando a forma física de ${data.name}...`);
      const imageBase64 = await generatePokemonImage(data.visualPrompt);
      setAssets(prev => ({ ...prev, originalImageBase64: imageBase64 }));
      
      setAppState(AppState.PROCESSING_SILHOUETTE);
      setLoadingText(`Criando mistério e gravando narrações...`);

      const silhouetteBase64 = await createSilhouette(imageBase64);
      setAssets(prev => ({ ...prev, silhouetteImageBase64: silhouetteBase64 }));

      // Parallel Gallery and Audio
      const [audioBase64, outroAudioBase64, galleryImages] = await Promise.all([
          generatePokemonSpeech(data.script),
          generatePokemonSpeech("E agora, quem deverá ser o próximo Pokémon?"),
          generatePokemonGallery(data.visualPrompt)
      ]);

      const wavBlob = pcmToWavBlob(audioBase64);
      const audioUrl = URL.createObjectURL(wavBlob);

      const outroBlob = pcmToWavBlob(outroAudioBase64);
      const outroUrl = URL.createObjectURL(outroBlob);

      setAssets(prev => ({ 
        ...prev, 
        scriptAudioUrl: audioUrl, 
        outroAudioUrl: outroUrl,
        gallery: galleryImages 
      }));

      setAppState(AppState.COMPLETE);
      setActiveTab('video');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha na geração dos ativos.");
      setAppState(AppState.ERROR);
    }
  };

  const handleDownloadZip = async () => {
      if (!assets.data || !exportCardRef.current) return;
      const zip = new JSZip();
      const folder = zip.folder(`${assets.data.name}_Pokemon_Kit`);
      if (!folder) return;

      folder.file("script.txt", assets.data.script);
      if (assets.scriptAudioUrl) {
          const res = await fetch(assets.scriptAudioUrl);
          folder.file("audio_narration.wav", await res.blob());
      }
      
      const strip = (s: string) => s.replace(/^data:image\/[a-z]+;base64,/, "");
      
      if (assets.originalImageBase64) folder.file("creature_main.png", strip(assets.originalImageBase64), {base64: true});
      if (assets.silhouetteImageBase64) folder.file("silhouette.png", strip(assets.silhouetteImageBase64), {base64: true});
      assets.gallery.forEach((img, i) => folder.file(`gallery/pose_${i+1}.png`, strip(img), {base64: true}));
      
      const cardImg = await toPng(exportCardRef.current, { pixelRatio: 2 });
      folder.file("pokemon_card.png", strip(cardImg), {base64: true});

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${assets.data.name}_Assets.zip`;
      link.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-slate-950 text-white font-sans">
      {assets.data && (
        <div style={{ position: 'fixed', top: -2000, left: -2000, pointerEvents: 'none' }}>
            <div ref={exportCardRef}><PokeCard data={assets.data} image={assets.originalImageBase64} /></div>
        </div>
      )}

      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-yellow-400 rounded-3xl mb-4 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
            <Wand2 className="h-10 w-10 text-slate-900" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter">POKÉ-CELEB <span className="text-yellow-400 underline decoration-wavy">STUDIO</span></h1>
          <p className="text-slate-400 mt-2 text-lg">Crie vídeos virais de celebridades como Pokémon com animação automática.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={celebrity}
                onChange={(e) => setCelebrity(e.target.value)}
                placeholder="Ex: Silvio Santos, Faustão, Neymar..."
                className="flex-1 rounded-2xl bg-slate-900 border-2 border-white/5 p-4 text-xl focus:border-yellow-400 outline-none transition-all placeholder:text-slate-600"
                disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
              />
              <button
                type="submit"
                className="bg-yellow-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-xl hover:bg-yellow-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
                disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
              >
                {appState === AppState.IDLE || appState === AppState.COMPLETE || appState === AppState.ERROR ? <><Video size={24}/> GERAR VÍDEO E ATIVOS</> : <Loader2 className="animate-spin" />}
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-400 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                <Music size={20} className="text-yellow-400" />
                <div className="flex-1">
                    <label className="block font-bold text-slate-200">Áudio "Quem é esse Pokémon?"</label>
                    <p className="text-xs text-slate-500">Opcional: Suba seu próprio áudio de intro para o vídeo.</p>
                </div>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="text-xs file:bg-slate-800 file:text-white file:border-0 file:rounded-xl file:px-4 file:py-2 cursor-pointer hover:file:bg-slate-700" />
            </div>
          </form>

          {appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR && (
             <div className="mt-10 flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-yellow-400/20 rounded-full"></div>
                    <div className="absolute top-0 w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-yellow-400 font-bold animate-pulse text-xl text-center max-w-md">{loadingText}</p>
             </div>
          )}
        </div>

        {appState === AppState.COMPLETE && assets.data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/10 shadow-2xl">
                    <div className="flex gap-2 mb-6 bg-black/40 p-1.5 rounded-2xl overflow-x-auto">
                        {['video', 'card', 'creature', 'silhouette', 'gallery'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === t ? 'bg-yellow-400 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-white/5 relative group">
                        {activeTab === 'video' && (
                            <VideoStudio assets={assets} />
                        )}
                        {activeTab === 'card' && (
                          <div className="w-full h-full flex items-start justify-center p-4 overflow-y-auto custom-scrollbar">
                            <div className="scale-[0.85] origin-top"><PokeCard data={assets.data} image={assets.originalImageBase64} /></div>
                          </div>
                        )}
                        {activeTab === 'creature' && <img src={`data:image/png;base64,${assets.originalImageBase64}`} className="w-full h-full object-contain p-8" />}
                        {activeTab === 'silhouette' && (
                          <div className="w-full h-full bg-blue-600 flex items-center justify-center p-8">
                            <img src={assets.silhouetteImageBase64 || ''} className="w-full h-full object-contain" />
                          </div>
                        )}
                        {activeTab === 'gallery' && (
                            <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto h-full custom-scrollbar">
                                {assets.gallery.map((img, i) => <img key={i} src={`data:image/png;base64,${img}`} className="w-full aspect-square object-contain bg-white rounded-2xl p-2" />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
                <button onClick={handleDownloadZip} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-8 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all group active:scale-95">
                    <Package size={28} className="group-hover:bounce" /> 
                    <span className="text-xl">BAIXAR KIT DE ASSETS COMPLETO (.ZIP)</span>
                </button>
                <div className="flex-1">
                    <PokedexDataDisplay data={assets.data} onCopyScript={() => navigator.clipboard.writeText(assets.data!.script)} audioUrl={assets.scriptAudioUrl} />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;