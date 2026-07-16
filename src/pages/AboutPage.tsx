import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, MapPin, Calendar, Users, Shield, Flag, ArrowLeft } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { Content } from '../types';
import LoadingPage from './LoadingPage';

const DEFAULT_PROFIL = `Gerakan Kepanduan Hizbul Wathan (HW) merupakan organisasi otonom Muhammadiyah yang bergerak di bidang pendidikan kepanduan. Hizbul Wathan didirikan untuk membina anak, remaja, dan pemuda agar memiliki akidah yang kuat, berakhlak mulia, berjiwa kepemimpinan, mandiri, disiplin, serta siap menjadi kader persyarikatan, umat, dan bangsa.

Nama “Hizbul Wathan” berasal dari bahasa Arab yang berarti “Pembela Tanah Air” atau “Golongan Pecinta Tanah Air”. Organisasi ini berakar dari gerakan kepanduan yang dirintis oleh KH Ahmad Dahlan pada tahun 1918. Awalnya bernama Padvinder Muhammadiyah, kemudian pada 30 Januari 1920 resmi menggunakan nama Hizbul Wathan.

Sebagai gerakan kepanduan Islam, HW menjadikan Al-Qur’an dan As-Sunnah sebagai landasan utama dalam membentuk karakter generasi muda. Melalui berbagai kegiatan kepanduan, pelatihan kepemimpinan, pengabdian masyarakat, petualangan alam terbuka, dan pendidikan keterampilan hidup, HW berupaya melahirkan kader yang beriman, berilmu, berakhlak, serta memiliki semangat pengabdian kepada agama, bangsa, dan kemanusiaan.

Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah merupakan struktur kepemimpinan Hizbul Wathan tingkat Provinsi Jawa Tengah yang bertugas mengoordinasikan, membina, dan mengembangkan gerakan kepanduan Hizbul Wathan di seluruh kabupaten dan kota di Jawa Tengah.

Sebagai salah satu wilayah dengan basis Muhammadiyah yang kuat, HW Jawa Tengah memiliki peran strategis dalam kaderisasi generasi muda melalui pendidikan kepanduan yang berlandaskan nilai-nilai Islam berkemajuan. Kwarwil HW Jawa Tengah menjadi pusat koordinasi berbagai program pelatihan, pengembangan kader, kegiatan kepanduan, serta penguatan organisasi di tingkat daerah hingga qabilah.

Saat ini Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah dipimpin oleh:

Ketua: Taufiq
Sekretaris: Muhammad Dzikron

Di bawah kepemimpinan tersebut, Kwarwil HW Jawa Tengah terus mengembangkan program-program kaderisasi yang adaptif terhadap perkembangan zaman dengan tetap menjaga nilai-nilai dasar kepanduan Hizbul Wathan and ideologi Muhammadiyah.

Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah hadir sebagai wadah pembinaan generasi muda Muhammadiyah yang unggul, berkarakter, dan berdaya saing. Dengan semangat kepanduan Islami, Kwarwil HW Jawa Tengah terus bergerak dan menggerakkan kader-kader terbaik untuk menjadi pelopor, pelangsung, dan penyempurna perjuangan Muhammadiyah dalam mewujudkan masyarakat Islam yang sebenar-benarnya.`;

export default function AboutPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const data = await sheetsService.getContents('profil');
      if (data.length > 0) setContent(data[0]);
      setLoading(false);
    };
    fetchContent();
  }, []);

  if (loading) return <LoadingPage />;

  const isOldDefault = content?.field2 && (
    content.field2.includes('(disingkat HW)') || 
    !content.field2.includes('Muhammad Dzikron')
  );
  const profilText = (!content?.field2 || isOldDefault) ? DEFAULT_PROFIL : content.field2;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-display font-bold text-gray-800">Profil HW</h2>
      </div>
      
      {/* Hero */}
      <div className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-xl">
        <img 
          src={content?.field1 || "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800"} 
          className="w-full h-full object-cover" 
          alt="HW Hero" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-hw-dark/80 via-transparent to-transparent flex items-end p-8">
          <div className="text-white space-y-1">
            <h2 className="text-3xl font-display font-black leading-tight">Mengenal Hizbul Wathan</h2>
            <p className="text-xs text-white/60 font-medium tracking-[0.2em] uppercase">Sejarah & Filosofi</p>
          </div>
        </div>
      </div>
 
      {/* Main Content */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-2xl font-display font-bold text-gray-800">Profil Gerakan Kepanduan</h3>
        <div className="prose prose-sm text-gray-500 leading-relaxed space-y-4">
          {profilText.split('\n').map((p, i) => (
            <p key={`p-${i}`}>{p}</p>
          ))}
        </div>
      </div>

    </div>
  );
}
