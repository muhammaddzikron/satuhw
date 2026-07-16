import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Zap, Share2, Compass, RefreshCw, Copy, Check, ArrowLeft, ChevronLeft, ChevronRight, Languages, ArrowLeftRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
const model = "gemini-3.5-flash";

const getAi = () => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'null') {
      console.warn('Gemini API Key is missing. Translation feature will be disabled.');
      return null;
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--'
};

const SEMAFOR_ANGLES: Record<string, [number, number]> = {
  'A': [180, 225], 'B': [180, 270], 'C': [180, 315], 'D': [180, 0],
  'E': [45, 180], 'F': [90, 180], 'G': [135, 180],
  'H': [225, 270], 'I': [225, 315], 'J': [0, 90], 
  'K': [0, 225], 'L': [45, 225], 'M': [90, 225], 'N': [135, 225],
  'O': [315, 270], 'P': [0, 270], 'Q': [45, 270], 'R': [90, 270],
  'S': [135, 270], 'T': [0, 315], 'U': [45, 315], 'V': [135, 0],
  'W': [45, 90], 'X': [135, 315], 'Y': [90, 315], 'Z': [90, 135],
  ' ': [180, 180]
};

export default function ToolsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'morse';
  
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Translation State
  const [sourceLang, setSourceLang] = useState('Indonesian');
  const [targetLang, setTargetLang] = useState('English');

  const languages = [
    { name: 'Indonesian', code: 'id' },
    { name: 'English', code: 'en' },
    { name: 'Arabic', code: 'ar' },
    { name: 'Japanese', code: 'ja' },
    { name: 'Korean', code: 'ko' },
    { name: 'Mandarin', code: 'zh' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
  ];

  // Morse Logic
  const convertToMorse = (text: string) => {
    const chars: Record<string, string> = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', ' ': '/'
    };
    return text.toUpperCase().split('').map(c => chars[c] || '').join(' ');
  };

  useEffect(() => {
    if (type === 'morse') {
      setOutput(convertToMorse(input));
    } else if (type === 'semafor') {
      setOutput(input.toUpperCase());
      setActiveIndex(0);
    }
  }, [input, type]);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    const aiClient = getAi();
    if (!aiClient) {
      setOutput('Fitur terjemahan tidak tersedia karena konfigurasi AI belum diatur.');
      return;
    }

    setLoading(true);
    try {
      const response = await aiClient.models.generateContent({
        model: model,
        contents: `Translate the following text from ${sourceLang} to ${targetLang}. Only provide the translated text. Original text: "${input}"`
      });
      setOutput(response.text || '');
    } catch (error) {
      console.error('Translation error:', error);
      setOutput('Terjadi kesalahan saat menerjemahkan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (output) {
      setInput(output);
      setOutput('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="p-3 bg-hw-green/10 rounded-2xl text-hw-green">
          {type === 'morse' && <Zap size={24} />}
          {type === 'semafor' && <Share2 size={24} />}
          {type === 'translate' && <Languages size={24} />}
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-800 capitalize">
          {type === 'morse' ? 'Translate Morse' : type === 'semafor' ? 'Translate Semafora' : 'Translate Bahasa'}
        </h2>
      </div>

      {type === 'translate' && (
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mb-2">
          <select 
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs font-bold text-hw-green focus:ring-0 cursor-pointer"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.name}>{lang.name}</option>
            ))}
          </select>
          <button 
            onClick={handleSwap}
            className="p-2 text-gray-400 hover:text-hw-green transition-colors"
          >
            <ArrowLeftRight size={14} />
          </button>
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs font-bold text-hw-green focus:ring-0 cursor-pointer text-right"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.name}>{lang.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Teks Input</label>
            <div className="relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik sesuatu di sini..."
                rows={4}
                className="w-full bg-white border border-gray-100 rounded-[2rem] p-6 focus:ring-2 focus:ring-hw-green/20 outline-none shadow-sm text-sm"
              />
              <button 
                onClick={() => setInput('')}
                className="absolute right-4 bottom-4 p-2 text-gray-300 hover:text-gray-500 transition-colors"
                title="Hapus"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">
              Hasil {type === 'morse' ? 'Morse' : type === 'semafor' ? 'Semafor' : 'Terjemahan'}
            </label>
            <div className="relative">
              {type === 'semafor' && input.length > 0 ? (
                <div className="w-full bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center gap-6">
                  {/* Semafor Visualizer */}
                  <div className="relative w-56 h-56 bg-gray-50/50 rounded-full flex items-center justify-center border border-gray-100">
                    {/* Compass Guide */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                      <div key={angle} className="absolute w-full h-px bg-gray-200/50" style={{ transform: `rotate(${angle}deg)` }} />
                    ))}

                    <div className="relative w-full h-full flex items-center justify-center">
                       {/* Person Body */}
                      <div className="w-4 h-24 bg-gray-300 rounded-lg absolute bottom-[50%] mb-[-12px] z-10" /> 
                      <div className="w-10 h-10 bg-gray-400 rounded-full absolute top-[18%] z-10 border-4 border-white shadow-sm" /> 
                      
                      {/* Left Arm (from observer view) */}
                      <motion.div 
                        className="absolute w-2 h-24 bg-gray-400 origin-bottom bottom-[50%] mb-[-8px] z-20 rounded-full"
                        initial={{ rotate: 180 }}
                        animate={{ rotate: SEMAFOR_ANGLES[input[activeIndex]?.toUpperCase()]?.[0] ?? 180 }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                      >
                         <div className="absolute top-0 w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-400 rounded-sm -left-5 border border-white shadow-sm" /> 
                      </motion.div>

                      {/* Right Arm (from observer view) */}
                      <motion.div 
                        className="absolute w-2 h-24 bg-gray-400 origin-bottom bottom-[50%] mb-[-8px] z-20 rounded-full"
                        initial={{ rotate: 180 }}
                        animate={{ rotate: SEMAFOR_ANGLES[input[activeIndex]?.toUpperCase()]?.[1] ?? 180 }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                      >
                         <div className="absolute top-0 w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-400 rounded-sm -left-5 border border-white shadow-sm" /> 
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex items-center gap-6">
                      <span className="text-6xl font-black text-hw-green drop-shadow-sm">
                        {input[activeIndex]?.toUpperCase() === ' ' ? '␣' : input[activeIndex]?.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full max-w-xs bg-gray-50 p-2 rounded-2xl border border-gray-100">
                      <button 
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                        className="p-3 bg-white shadow-sm rounded-xl text-gray-500 disabled:opacity-30 hover:text-hw-green transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Karakter</span>
                        <span className="text-sm font-bold text-gray-800">
                          {activeIndex + 1} / {input.length}
                        </span>
                      </div>

                      <button 
                         disabled={activeIndex === input.length - 1}
                         onClick={() => setActiveIndex(Math.min(input.length - 1, activeIndex + 1))}
                         className="p-3 bg-hw-green shadow-sm rounded-xl text-white disabled:opacity-30 hover:bg-hw-green-dark transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-hw-dark text-white rounded-[2rem] p-6 shadow-xl min-h-[120px] font-mono break-all leading-relaxed tracking-widest relative overflow-hidden">
                  {loading && (
                    <div className="absolute inset-0 bg-hw-dark/50 flex items-center justify-center backdrop-blur-sm z-10">
                      <RefreshCw size={24} className="animate-spin text-hw-green" />
                    </div>
                  )}
                  {output || <span className="opacity-30 italic font-sans text-sm">Hasil akan muncul di sini...</span>}
                </div>
              )}
              {output && (type === 'morse' || type === 'translate') && (
                <button 
                  onClick={handleCopy}
                  className="absolute right-4 bottom-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
                >
                  {copied ? <Check size={18} className="text-hw-green" /> : <Copy size={18} />}
                </button>
              )}
            </div>
          </div>
          
          {type === 'translate' && (
            <button 
              onClick={handleTranslate}
              disabled={loading || !input.trim()}
              className="w-full py-4 rounded-3xl bg-hw-green text-white font-black shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'MENERJEMAHKAN...' : 'TERJEMAHKAN'}
            </button>
          )}

      <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100/50">
        <h4 className="text-sm font-bold text-orange-800 mb-2">Panduan Cepat</h4>
        <p className="text-xs text-orange-700/80 leading-relaxed">
          {type === 'morse' 
            ? 'Gunakan spasi untuk memisahkan karakter dan garis miring (/) untuk memisahkan kata. Titik (.) melambangkan bunyi pendek, Garis (-) melambangkan bunyi panjang.' 
            : type === 'semafor'
            ? 'Semafor menggunakan posisi kedua lengan dengan bendera untuk menyampaikan karakter. Gunakan navigasi di bawah untuk melihat visualisasi setiap karakter.'
            : 'Ketik teks dalam bahasa sumber, pilih bahasa tujuan, lalu tekan tombol terjemahkan untuk melihat hasilnya.'}
        </p>
      </div>
     </div>
    </div>
  );
}
