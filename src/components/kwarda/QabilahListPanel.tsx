import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  School, 
  Edit2, 
  Trash2, 
  Users, 
  Save, 
  X, 
  AlertCircle, 
  Layers, 
  TrendingUp 
} from 'lucide-react';
import { QabilahOrgItem, KwardaPtmaEntity } from '../../types';
import { kwardaPtmaService } from '../../services/kwardaPtmaService';

interface QabilahListPanelProps {
  org: KwardaPtmaEntity;
  canManage: boolean;
}

export const QabilahListPanel: React.FC<QabilahListPanelProps> = ({ org, canManage }) => {
  const [items, setItems] = useState<QabilahOrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QabilahOrgItem | null>(null);

  // Form fields
  const [namaQabilah, setNamaQabilah] = useState('');
  const [jumlahAnggota, setJumlahAnggota] = useState<string>('0');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<QabilahOrgItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await kwardaPtmaService.getQabilahByOrg(org.code);
      setItems(data);
    } catch (err) {
      console.error('Failed to load qabilah list:', err);
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

  const totalAnggotaCount = items.reduce((sum, item) => sum + (Number(item.jumlahAnggota) || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaQabilah('');
    setJumlahAnggota('0');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: QabilahOrgItem) => {
    setEditingItem(item);
    setNamaQabilah(item.namaQabilah);
    setJumlahAnggota(String(item.jumlahAnggota ?? 0));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNama = namaQabilah.trim();
    const parsedAnggota = parseInt(jumlahAnggota, 10);

    if (!finalNama) {
      setFormError('Nama Qabilah wajib diisi');
      return;
    }
    if (isNaN(parsedAnggota) || parsedAnggota < 0) {
      setFormError('Jumlah Anggota harus berupa angka valid (minimal 0)');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const itemToSave: QabilahOrgItem = {
        id: editingItem ? editingItem.id : `qab-${org.code}-${Date.now()}`,
        orgCode: org.code,
        namaQabilah: finalNama,
        jumlahAnggota: parsedAnggota
      };

      await kwardaPtmaService.saveQabilah(itemToSave);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data Qabilah');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await kwardaPtmaService.deleteQabilah(itemToDelete.id, org.code);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete qabilah:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Total Qabilah</span>
            <School size={20} className="text-emerald-200" />
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight">{items.length} <span className="text-xs font-normal text-emerald-100">Qabilah</span></p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Anggota Terdaftar</span>
            <Users size={20} className="text-blue-200" />
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight">{totalAnggotaCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-blue-100">Anggota</span></p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <School className="text-emerald-600" size={20} />
            Daftar Qabilah di {org.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pangkalan satuan qabilah (SD/MI, SMP/MTs, SMA/SMK/MA, Ponpes, Ranting) di bawah naungan Kwarda.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Qabilah</span>
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Memuat data qabilah...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <School size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">Belum Ada Data Qabilah</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Daftar qabilah untuk {org.name} belum tercatat.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Tambah Qabilah Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-emerald-200 hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {item.namaQabilah}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100/60">
                      <Users size={12} />
                      {Number(item.jumlahAnggota || 0).toLocaleString('id-ID')} Anggota
                    </span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    title="Edit Qabilah"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Qabilah"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <School className="text-emerald-600" size={20} />
                {editingItem ? 'Edit Data Qabilah' : 'Tambah Qabilah Baru'}
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
                  Nama Qabilah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaQabilah}
                  onChange={(e) => setNamaQabilah(e.target.value)}
                  placeholder="Contoh: Qabilah SMA Muhammadiyah 1 Klaten"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jumlah Anggota Pandu HW <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={jumlahAnggota}
                    onChange={(e) => setJumlahAnggota(e.target.value)}
                    placeholder="0"
                    className="w-full pl-3.5 pr-14 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-bold text-gray-800"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-medium text-gray-400">
                    Orang
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Masukkan estimasi total anggota aktif di qabilah ini.
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
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Qabilah'}</span>
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
              <h3 className="text-base font-bold text-gray-900">Hapus Qabilah?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{itemToDelete.namaQabilah}</strong>?
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
