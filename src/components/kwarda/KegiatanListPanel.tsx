import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Clock, 
  Save, 
  X, 
  AlertCircle, 
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';
import { KegiatanOrgItem, KwardaPtmaEntity } from '../../types';
import { kwardaPtmaService } from '../../services/kwardaPtmaService';
import { SUGGESTED_JENIS_KEGIATAN, isValidProposalUrl } from '../../utils/kwardaPtmaUtils';
import { formatDate } from '../../lib/utils';

interface KegiatanListPanelProps {
  org: KwardaPtmaEntity;
  canManage: boolean;
}

export const KegiatanListPanel: React.FC<KegiatanListPanelProps> = ({ org, canManage }) => {
  const [items, setItems] = useState<KegiatanOrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KegiatanOrgItem | null>(null);

  // Form fields
  const [selectedJenis, setSelectedJenis] = useState('');
  const [customJenis, setCustomJenis] = useState('');
  const [jadwal, setJadwal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [linkProposal, setLinkProposal] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<KegiatanOrgItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await kwardaPtmaService.getKegiatanByOrg(org.code);
      setItems(data);
    } catch (err) {
      console.error('Failed to load kegiatan:', err);
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
    setSelectedJenis(SUGGESTED_JENIS_KEGIATAN[0] || '');
    setCustomJenis('');
    setJadwal(new Date().toISOString().split('T')[0]);
    setKeterangan('');
    setLinkProposal('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KegiatanOrgItem) => {
    setEditingItem(item);
    if (SUGGESTED_JENIS_KEGIATAN.includes(item.jenisKegiatan)) {
      setSelectedJenis(item.jenisKegiatan);
      setCustomJenis('');
    } else {
      setSelectedJenis('__custom__');
      setCustomJenis(item.jenisKegiatan);
    }
    setJadwal(item.jadwal ? item.jadwal.split('T')[0] : '');
    setKeterangan(item.keterangan || '');
    setLinkProposal(item.linkProposal || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalJenis = selectedJenis === '__custom__' ? customJenis.trim() : selectedJenis.trim();

    if (!finalJenis) {
      setFormError('Jenis / Nama Kegiatan wajib diisi');
      return;
    }
    if (!jadwal) {
      setFormError('Jadwal Pelaksanaan wajib diisi');
      return;
    }
    if (linkProposal.trim() && !isValidProposalUrl(linkProposal.trim())) {
      setFormError('Link Proposal harus berupa tautan URL valid (contoh: https://drive.google.com/...)');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const itemToSave: KegiatanOrgItem = {
        id: editingItem ? editingItem.id : `keg-${org.code}-${Date.now()}`,
        orgCode: org.code,
        jenisKegiatan: finalJenis,
        jadwal,
        keterangan: keterangan.trim(),
        linkProposal: linkProposal.trim()
      };

      await kwardaPtmaService.saveKegiatan(itemToSave);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan kegiatan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await kwardaPtmaService.deleteKegiatan(itemToDelete.id, org.code);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete kegiatan:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-amber-600" size={20} />
            Agenda & Kegiatan {org.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {items.length} Agenda kegiatan terdata, dilengkapi tautan proposal resmi.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Kegiatan</span>
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Memuat data kegiatan...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">Belum Ada Agenda Kegiatan</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Belum ada kegiatan yang terdaftar untuk {org.name}.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Tambah Kegiatan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-amber-200 hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-100">
                      <Clock size={12} />
                      {item.jadwal ? formatDate(item.jadwal) : 'Tanggal belum ditentukan'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                    {item.jenisKegiatan}
                  </h4>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Kegiatan"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Kegiatan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {item.keterangan && (
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  {item.keterangan}
                </p>
              )}

              {item.linkProposal && (
                <div className="pt-1 flex items-center justify-between">
                  <a
                    href={item.linkProposal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors shadow-2xs group"
                  >
                    <FileText size={14} className="text-blue-600" />
                    <span>Lihat Proposal (Google Drive)</span>
                    <ExternalLink size={13} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-amber-600" size={20} />
                {editingItem ? 'Edit Agenda Kegiatan' : 'Tambah Kegiatan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jenis / Nama Kegiatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedJenis}
                  onChange={(e) => setSelectedJenis(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                >
                  {SUGGESTED_JENIS_KEGIATAN.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                  <option value="__custom__">+ Input Nama Kegiatan Lainnya...</option>
                </select>

                {selectedJenis === '__custom__' && (
                  <input
                    type="text"
                    value={customJenis}
                    onChange={(e) => setCustomJenis(e.target.value)}
                    placeholder="Ketik nama kegiatan custom..."
                    className="w-full mt-2 px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jadwal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={jadwal}
                  onChange={(e) => setJadwal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Keterangan / Deskripsi Kegiatan
                </label>
                <textarea
                  rows={3}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Deskripsi singkat, target peserta, tujuan, atau lokasi..."
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Link Proposal (Google Drive / Cloud Document)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-2.5 text-gray-400">
                    <LinkIcon size={16} />
                  </div>
                  <input
                    type="url"
                    value={linkProposal}
                    onChange={(e) => setLinkProposal(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Pastikan izin akses link Google Drive diset ke &quot;Siapa saja yang memiliki link&quot;.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Kegiatan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Hapus Kegiatan?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus agenda <strong>{itemToDelete.jenisKegiatan}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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
