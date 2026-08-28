import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  GripVertical, 
  Edit2, 
  Trash2, 
  Shield, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  AlertCircle 
} from 'lucide-react';
import { DewanSugliOrgItem, KwardaPtmaEntity } from '../../types';
import { kwardaPtmaService } from '../../services/kwardaPtmaService';
import { SUGGESTED_JABATAN_SUGLI } from '../../utils/kwardaPtmaUtils';

interface DewanSugliListPanelProps {
  org: KwardaPtmaEntity;
  canManage: boolean;
}

export const DewanSugliListPanel: React.FC<DewanSugliListPanelProps> = ({ org, canManage }) => {
  const [items, setItems] = useState<DewanSugliOrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DewanSugliOrgItem | null>(null);
  
  // Form fields
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [customJabatan, setCustomJabatan] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<DewanSugliOrgItem | null>(null);

  const orgEntityName = org.type === 'Kwarda' ? 'Dewan Sugli Daerah' : 'Dewan Kafilah PTMA';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await kwardaPtmaService.getDewanSugliByOrg(org.code);
      setItems(data);
    } catch (err) {
      console.error('Failed to load dewan sugli:', err);
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
    setSelectedJabatan(SUGGESTED_JABATAN_SUGLI[0] || '');
    setCustomJabatan('');
    setNamaLengkap('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DewanSugliOrgItem) => {
    setEditingItem(item);
    if (SUGGESTED_JABATAN_SUGLI.includes(item.jabatan)) {
      setSelectedJabatan(item.jabatan);
      setCustomJabatan('');
    } else {
      setSelectedJabatan('__custom__');
      setCustomJabatan(item.jabatan);
    }
    setNamaLengkap(item.nama);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalJabatan = selectedJabatan === '__custom__' ? customJabatan.trim() : selectedJabatan.trim();
    const finalNama = namaLengkap.trim();

    if (!finalJabatan) {
      setFormError('Jabatan / Posisi wajib diisi');
      return;
    }
    if (!finalNama) {
      setFormError('Nama Lengkap wajib diisi');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const itemToSave: DewanSugliOrgItem = {
        id: editingItem ? editingItem.id : `sugli-${org.code}-${Date.now()}`,
        orgCode: org.code,
        jabatan: finalJabatan,
        nama: finalNama,
        sortOrder: editingItem ? editingItem.sortOrder : items.length + 1
      };

      await kwardaPtmaService.saveDewanSugli(itemToSave);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await kwardaPtmaService.deleteDewanSugli(itemToDelete.id, org.code);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete dewan sugli:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!canManage) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    setItems(newItems);
    await kwardaPtmaService.saveAllDewanSugliOrder(org.code, newItems);
  };

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canManage) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canManage || draggedIndex === null || draggedIndex === index) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!canManage || draggedIndex === null || draggedIndex === targetIndex) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setDraggedIndex(null);
    setItems(newItems);
    await kwardaPtmaService.saveAllDewanSugliOrder(org.code, newItems);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-cyan-600" size={20} />
            Susunan {orgEntityName}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {items.length} Pengurus Dewan Sugli / Kafilah terdaftar.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Dewan Sugli</span>
          </button>
        )}
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Memuat data dewan sugli...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">Belum Ada Data Dewan Sugli / Kafilah</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Struktur susunan pengurus {orgEntityName} belum ditambahkan.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Tambah Pengurus Dewan Sugli
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable={canManage}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border transition-all ${
                draggedIndex === index 
                  ? 'border-cyan-500 bg-cyan-50/50 shadow-md opacity-60' 
                  : 'border-gray-100 shadow-2xs hover:border-cyan-200 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {canManage && (
                  <div 
                    className="p-1.5 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-100 shrink-0" 
                    title="Tarik untuk mengubah urutan"
                  >
                    <GripVertical size={18} />
                  </div>
                )}
                <div className="w-7 h-7 rounded-xl bg-cyan-100/80 text-cyan-800 flex items-center justify-center text-xs font-black shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-cyan-50 text-cyan-800 text-[11px] font-bold rounded-md border border-cyan-100/80">
                      {item.jabatan}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mt-1 truncate">
                    {item.nama}
                  </h4>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <div className="hidden sm:flex flex-col gap-0.5 mr-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Geser ke atas"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Geser ke bawah"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-gray-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus"
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
                <Shield className="text-cyan-600" size={20} />
                {editingItem ? 'Edit Dewan Sugli' : 'Tambah Dewan Sugli Baru'}
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
                  Jabatan / Posisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedJabatan}
                  onChange={(e) => setSelectedJabatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-none transition-all"
                >
                  {SUGGESTED_JABATAN_SUGLI.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                  <option value="__custom__">+ Input Jabatan Kustom...</option>
                </select>

                {selectedJabatan === '__custom__' && (
                  <input
                    type="text"
                    value={customJabatan}
                    onChange={(e) => setCustomJabatan(e.target.value)}
                    placeholder="Ketik nama jabatan custom..."
                    className="w-full mt-2 px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:border-cyan-500 focus:outline-none"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Bagas Aditya Pratama"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-none transition-all"
                />
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
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
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
              <h3 className="text-base font-bold text-gray-900">Hapus Data Dewan Sugli?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{itemToDelete.nama}</strong> ({itemToDelete.jabatan})?
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
