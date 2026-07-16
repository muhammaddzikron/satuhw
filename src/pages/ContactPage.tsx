import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, Mail, Globe, MapPin, Instagram, Youtube, MessageCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import LoadingPage from './LoadingPage';

const ContactItem = ({ icon: Icon, label, value, color, link }: { icon: any, label: string, value: string, color: string, link: string }) => (
  <a href={link} target="_blank" rel="noopener noreferrer" className="group">
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-${color.split('-')[1]}-500/20`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</p>
        <p className="text-sm font-bold text-gray-800">{value}</p>
      </div>
      <div className="text-gray-300 group-hover:text-hw-green transition-colors">
        <ChevronRight size={20} />
      </div>
    </div>
  </a>
);

export default function ContactPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kontak, setKontak] = useState<any>(null);

  useEffect(() => {
    const fetchKontak = async () => {
      try {
        const data = await sheetsService.getContents('kontak');
        if (data.length > 0) setKontak(data[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchKontak();
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3 pt-4">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center pr-10">
          <h2 className="text-3xl font-display font-black text-gray-800">Hubungi Kami</h2>
          <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Kami siap melayani pertanyaan seputar materi & sistem HW.</p>
        </div>
      </div>

      <div className="space-y-4">
        <ContactItem 
          icon={MessageCircle} 
          label="WhatsApp" 
          value={kontak?.field2 || "+62 ..."} 
          color="bg-green-500" 
          link={`https://wa.me/${String(kontak?.field2 || '').replace(/[^0-9]/g, '')}`} 
        />
        <ContactItem 
          icon={Phone} 
          label="Nama Kontak" 
          value={kontak?.field1 || "Admin HW"} 
          color="bg-blue-400" 
          link="#" 
        />
        <ContactItem 
          icon={Globe} 
          label="Website Resmi" 
          value={kontak?.field3 || "www..."} 
          color="bg-blue-500" 
          link={kontak?.field3 || "#"} 
        />
      </div>

      <div className="bg-hw-dark p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden shadow-2xl shadow-hw-dark/40">
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
            <MapPin size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-display font-bold">Kwarwil HW Jateng</h4>
            <p className="text-xs text-white/60 leading-relaxed px-4">
              Jl. Singosari No.33, Wonodri, Kec. Semarang Sel., Kota Semarang, Jawa Tengah 50242
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-hw-dark font-bold text-xs rounded-xl shadow-lg hover:scale-105 transition-transform">
            Buka di Google Maps
          </button>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-hw-green/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 bg-hw-blue/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
