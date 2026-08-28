import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Save, 
  X, 
  AlertCircle, 
  Link as LinkIcon,
  CheckCircle2,
  Search,
  Copy,
  Check,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { MateriOrgItem, KwardaPtmaEntity } from '../../types';
import { kwardaPtmaService } from '../../services/kwardaPtmaService';
import { SUGGESTED_KATEGORI_MATERI, isValidProposalUrl } from '../../utils/kwardaPtmaUtils';
import { formatDate } from '../../lib/utils';

interface MateriKwardaListPanelProps {
  org: KwardaPtmaEntity;
  canManage: boolean;
}

export const MateriKwardaListPanel: React.FC<MateriKwardaListPanelProps> = ({ org, canManage }) => {
  const [items, setItems] = useState<MateriOrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MateriOrgItem | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState('Semua');

  // Form fields
  const [namaMateri, setNamaMateri] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [customKategori, setCustomKategori] = useState('');
  const [linkDrive, setLinkDrive] = useState('');
  const [pemateri, setPemateri] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<MateriOrgItem | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await kwardaPtmaService.getMateriByOrg(org.code);
      setItems(data);
    } catch (err) {
      console.error('Failed to load materi kwarda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('kwarda_ptma_updated', handleUpdate);
    return () => window.removeEventListener('kwarda_ptma_updated', handleUpdate);
  }, [org.code]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaMateri('');
    setSelectedKategori(SUGGESTED_KATEGORI_MATERI[0] || 'Kepanduan HW');
    setCustomKategori('');
    setLinkDrive('');
    setPemateri('');
    setKeterangan('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MateriOrgItem) => {
    setEditingItem(item);
    setNamaMateri(item.namaMateri);
    if (item.kategoriMateri && SUGGESTED_KATEGORI_MATERI.includes(item.kategoriMateri)) {
      setSelectedKategori(item.kategoriMateri);
      setCustomKategori('');
    } else if (item.kategoriMateri) {
      setSelectedKategori('__custom__');
      setCustomKategori(item.kategoriMateri);
    } else {
      setSelectedKategori(SUGGESTED_KATEGORI_MATERI[0] || 'Kepanduan HW');
      setCustomKategori('');
    }
    setLinkDrive(item.linkDrive || '');
    setPemateri(item.pemateri || '');
    setKeterangan(item.keterangan || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMateri.trim()) {
      setFormError('Nama Materi wajib diisi');
      return;
    }

    if (!linkDrive.trim()) {
      setFormError('Link Google Drive wajib diisi');
      return;
    }

    if (!isValidProposalUrl(linkDrive)) {
      setFormError('Link Google Drive harus diawali dengan http:// atau https:// yang valid');
      return;
    }

    const finalKategori = selectedKategori === '__custom__' 
      ? (customKategori.trim() || 'Lainnya') 
      : (selectedKategori.trim() || 'Kepanduan HW');

    setIsSaving(true);
    setFormError('');

    try {
      const payload: MateriOrgItem = {
        id: editingItem ? editingItem.id : '',
        orgCode: org.code,
        namaMateri: namaMateri.trim(),
        kategoriMateri: finalKategori,
        linkDrive: linkDrive.trim(),
        pemateri: pemateri.trim() || undefined,
        keterangan: keterangan.trim() || undefined,
        createdAt: editingItem?.createdAt
      };

      await kwardaPtmaService.addOrUpdateMateri(payload);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save materi:', err);
      setFormError('Gagal menyimpan materi. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await kwardaPtmaService.deleteMateri(itemToDelete.id, org.code);
      setItemToDelete(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete materi:', err);
    }
  };

  const handleCopyLink = (id: string, url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Kategori filter
      if (selectedKategoriFilter !== 'Semua') {
        if (item.kategoriMateri !== selectedKategoriFilter) return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.namaMateri.toLowerCase().includes(q);
        const matchKategori = (item.kategoriMateri || '').toLowerCase().includes(q);
        const matchPemateri = (item.pemateri || '').toLowerCase().includes(q);
        const matchKet = (item.keterangan || '').toLowerCase().includes(q);
        return matchName || matchKategori || matchPemateri || matchKet;
      }

      return true;
    });
  }, [items, selectedKategoriFilter, searchQuery]);

  // Unique categories for filter pills
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.kategoriMateri) set.add(i.kategoriMateri);
    });
    return Array.from(set);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen size={20} />
            </span>
            <h3 className="text-base font-bold text-gray-900">
              Materi {org.type === 'Kwarda' ? 'Kwarda' : 'Qabilah PTMA'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Bank materi resmi, modul diklat, pedoman keorganisasian, dan berkas arsip Google Drive untuk {org.name}.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Materi</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama materi, kategori, atau pemateri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-gray-500 whitespace-nowrap">
            Total: <span className="text-emerald-700 font-black">{filteredItems.length}</span> materi
          </div>
        </div>

        {availableCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedKategoriFilter('Semua')}
              className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                selectedKategoriFilter === 'Semua'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua Kategori
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedKategoriFilter(cat)}
                className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  selectedKategoriFilter === cat
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xs text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Memuat berkas materi...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FolderOpen size={28} />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-gray-900">
              {searchQuery || selectedKategoriFilter !== 'Semua' 
                ? 'Tidak Ada Materi Yang Cocok' 
                : 'Belum Ada Materi'}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery || selectedKategoriFilter !== 'Semua'
                ? 'Coba gunakan kata kunci pencarian lain atau ubah filter kategori.'
                : `Belum ada materi atau arsip Google Drive yang ditambahkan untuk ${org.name}.`}
            </p>
          </div>
          {canManage && !searchQuery && selectedKategoriFilter === 'Semua' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Materi Pertama</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Materi & Keterangan</th>
                  <th className="py-3.5 px-4 w-44">Kategori</th>
                  <th className="py-3.5 px-4 w-60">Link Google Drive</th>
                  <th className="py-3.5 px-4 w-32">Tanggal</th>
                  {canManage && <th className="py-3.5 px-4 w-28 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="py-4 px-4 text-center font-bold text-gray-400">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900 group-hover:text-emerald-950 flex items-start gap-2">
                        <FileText size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span>{item.namaMateri}</span>
                          {item.pemateri && (
                            <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                              Narasumber / Sumber: <span className="font-semibold text-gray-700">{item.pemateri}</span>
                            </p>
                          )}
                          {item.keterangan && (
                            <p className="text-[11px] text-gray-400 font-normal mt-0.5 line-clamp-2">
                              {item.keterangan}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-100">
                        {item.kategoriMateri || 'Kepanduan HW'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={item.linkDrive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-[11px] font-bold rounded-xl border border-blue-200 transition-colors shrink-0 shadow-2xs group/link"
                          title="Buka Berkas di Google Drive"
                        >
                          <FolderOpen size={13} className="text-blue-600 group-hover/link:scale-110 transition-transform" />
                          <span>Buka Drive</span>
                          <ExternalLink size={11} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.id, item.linkDrive)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Salin Link Google Drive"
                        >
                          {copiedId === item.id ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-medium whitespace-nowrap text-[11px]">
                      {item.createdAt ? formatDate(item.createdAt) : '-'}
                    </td>
                    {canManage && (
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Materi"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Materi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug">
                        {item.namaMateri}
                      </h4>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                        {item.kategoriMateri || 'Kepanduan HW'}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {item.pemateri && (
                  <p className="text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                    Narasumber: <span className="font-semibold text-gray-800">{item.pemateri}</span>
                  </p>
                )}

                {item.keterangan && (
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {item.keterangan}
                  </p>
                )}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-gray-400">
                    {item.createdAt ? formatDate(item.createdAt) : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.id, item.linkDrive)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs"
                      title="Salin Link"
                    >
                      {copiedId === item.id ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>

                    <a
                      href={item.linkDrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl shadow-xs"
                    >
                      <FolderOpen size={13} />
                      <span>Buka Drive</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Add / Edit Materi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingItem ? 'Edit Materi Kwarda / PTMA' : 'Tambah Materi Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    {org.name} ({org.ktaCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Materi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Materi / Judul Berkas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Modul Pelatihan Jaya Melati 1 - Sejarah HW"
                  value={namaMateri}
                  onChange={(e) => setNamaMateri(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Kolom Link Google Drive */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Link Google Drive <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <LinkIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/... atau https://drive.google.com/file/d/..."
                    value={linkDrive}
                    onChange={(e) => setLinkDrive(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Pastikan izin akses berbagi file/folder di Google Drive telah diset ke <strong>&quot;Siapa saja yang memiliki link (Anyone with the link)&quot;</strong>.
                </p>
              </div>

              {/* Kategori Materi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Kategori Materi
                </label>
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  {SUGGESTED_KATEGORI_MATERI.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Kategori Kustom Lainnya...</option>
                </select>

                {selectedKategori === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Ketik nama kategori kustom..."
                    value={customKategori}
                    onChange={(e) => setCustomKategori(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    autoFocus
                  />
                )}
              </div>

              {/* Pemateri / Sumber */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pemateri / Narasumber / Sumber (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ramanda Dr. Ihsan Maulana / Bidang Diklat"
                  value={pemateri}
                  onChange={(e) => setPemateri(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Keterangan / Deskripsi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Keterangan / Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat isi materi, peruntukan peserta, atau instruksi..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Materi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Hapus Materi Ini?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Materi <strong>&quot;{itemToDelete.namaMateri}&quot;</strong> akan dihapus dari daftar materi {org.name}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
