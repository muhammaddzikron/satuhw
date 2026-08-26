with open('src/pages/AdminDashboard.tsx', 'rb') as f:
    raw = f.read()

text = raw.decode('utf-8', errors='ignore')
lines = text.splitlines()

# Take up to line 9221
base_lines = []
for idx, line in enumerate(lines[:9221]):
    if idx == 8:
        base_lines.append("import { syncRolesAndPelatihan, PELATIHAN_OPTIONS, isPelatihanSelected, normalizeTrainingKey, consolidateTrainingApplications, isSameTrainingParticipant, normalizeParticipantName, generateSamplePreTestForParticipants, generateSamplePostTestForParticipants, generateSampleTestSubmissionsForParticipants, getAppPreTestScore, getAppPostTestScore, getAppTasksList, getAppAttendanceMap } from '../utils/trainingUtils';")
    elif idx == 9:
        base_lines.append(line)
        base_lines.append("import { TestSubmissionViewerModal } from '../components/training/TestSubmissionViewerModal';")
    else:
        base_lines.append(line)

rest_of_file = """                              <span className="font-mono font-bold text-gray-900">{app.noHp || '-'}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditActivityParticipantModal(app)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteActivityParticipant(app.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={11} /> Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            <th className="p-4 pl-6 w-12 text-center">No</th>
                            <th className="p-4">Peserta Kegiatan</th>
                            <th className="p-4">Unsur / Utusan</th>
                            <th className="p-4">Jabatan</th>
                            <th className="p-4">Kontak / No WA</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right pr-6">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                          {activityPaginatedApps.map((app: any, idx: number) => {
                            const isSelected = selectedActivityAppIds.includes(app.id);
                            return (
                              <tr key={app.id || idx} className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                                <td className="p-4 pl-6 text-center font-bold text-gray-400">
                                  {(activityCurrentPage - 1) * activityItemsPerPage + idx + 1}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 overflow-hidden flex items-center justify-center font-black shrink-0">
                                      {app.photo || app.foto ? (
                                        <img src={app.photo || app.foto} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        (app.nama || app.namaLengkap || 'P').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900 leading-snug">{app.nama || app.namaLengkap || 'Peserta Tanpa Nama'}</div>
                                      <div className="text-[10px] text-gray-400 font-mono">{app.nbm ? `NBM: ${app.nbm}` : (app.email || '-')}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-gray-800">{app.unsur || app.asalKwarda || '-'}</div>
                                  {(app.utusan || app.qabilahPtma) && (
                                    <div className="text-[10px] text-emerald-700 font-bold">{app.utusan || app.qabilahPtma}</div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-gray-800">{app.jabatan || '-'}</div>
                                  {app.kategoriUndangan && app.kategoriUndangan !== 'Tidak Ada / Umum' && (
                                    <span className="inline-block text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold border border-emerald-200 mt-0.5">
                                      {app.kategoriUndangan}
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="font-mono font-bold text-gray-900">{app.noHp || '-'}</div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {app.status || 'Terdaftar'}
                                  </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditActivityParticipantModal(app)}
                                      className="p-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                                      title="Edit Data Peserta"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteActivityParticipant(app.id)}
                                      className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                                      title="Hapus Peserta"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {activityTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs font-bold text-gray-500">
                          Menampilkan {Math.min((activityCurrentPage - 1) * activityItemsPerPage + 1, activityFilteredApps.length)} - {Math.min(activityCurrentPage * activityItemsPerPage, activityFilteredApps.length)} dari {activityFilteredApps.length} peserta
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActivityCurrentPage(p => Math.max(1, p - 1))}
                            disabled={activityCurrentPage === 1}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-gray-700">
                            {activityCurrentPage} / {activityTotalPages}
                          </span>
                          <button
                            onClick={() => setActivityCurrentPage(p => Math.min(activityTotalPages, p + 1))}
                            disabled={activityCurrentPage === activityTotalPages}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 8: PENGATURAN & LAINNYA */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <SettingsIcon size={18} className="text-emerald-700" />
                    Pengaturan Sistem Kwarwil Jateng
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Kelola konfigurasi umum, tautan sosmed, dan parameter pelatihan Kwartir Wilayah Hizbul Wathan Jawa Tengah.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Nama Organisasi</label>
                      <input
                        type="text"
                        value={settings?.orgName || 'Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah'}
                        onChange={(e) => setSettings((s: any) => ({ ...s, orgName: e.target.value }))}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp Admin / Panitia</label>
                      <input
                        type="text"
                        value={settings?.adminWa || '089688754000'}
                        onChange={(e) => setSettings((s: any) => ({ ...s, adminWa: e.target.value }))}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Save size={14} /> {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* ALL MODALS                                                                */}
      {/* ========================================================================= */}

      {/* 1. TEST SUBMISSION VIEWER MODAL */}
      <TestSubmissionViewerModal
        isOpen={!!viewingTestApp}
        onClose={() => setViewingTestApp(null)}
        application={viewingTestApp}
        questions={Array.isArray(settings?.trainingQuestions) && settings.trainingQuestions.length > 0 ? settings.trainingQuestions : DEFAULT_50_QUESTIONS}
      />

      {/* 2. GRADING MODAL */}
      {isGradingModalOpen && selectedTrainingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Form Penilaian & Kelulusan
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">{selectedTrainingApp.nama || selectedTrainingApp.namaLengkap}</h3>
              </div>
              <button onClick={() => setIsGradingModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nilai Akhir (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Contoh: 85"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Status Kelulusan</label>
                <select
                  value={graduationStatusInput}
                  onChange={(e) => setGraduationStatusInput(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                  <option value="Lulus">Lulus</option>
                  <option value="Lulus Bersyarat">Lulus Bersyarat</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Catatan / Evaluasi Pelatih</label>
                <textarea
                  rows={3}
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="Masukkan catatan penilaian..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsGradingModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveGrading}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} /> Simpan Penilaian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD PARTICIPANT MODAL */}
      {isAddParticipantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-700" />
                Tambah Peserta Pelatihan
              </h3>
              <button onClick={() => setIsAddParticipantModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setAddParticipantMode('select')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${addParticipantMode === 'select' ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Pilih dari Anggota
              </button>
              <button
                type="button"
                onClick={() => setAddParticipantMode('manual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${addParticipantMode === 'manual' ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Input Manual
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {addParticipantMode === 'select' ? (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Cari & Pilih Anggota</label>
                  <input
                    type="text"
                    placeholder="Ketik nama atau NBM anggota..."
                    value={addParticipantSearchQuery}
                    onChange={(e) => setAddParticipantSearchQuery(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {members
                      .filter((m: any) => {
                        const q = addParticipantSearchQuery.toLowerCase();
                        const name = (m.namaLengkap || m.nama || '').toLowerCase();
                        const nbm = (m.nomorKTA || m.ktaNumber || m.nbm || '').toLowerCase();
                        return name.includes(q) || nbm.includes(q);
                      })
                      .slice(0, 15)
                      .map((m: any) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setAddParticipantSelectedMemberId(m.id);
                            setAddParticipantForm(prev => ({
                              ...prev,
                              nama: m.namaLengkap || m.nama || '',
                              nbm: m.nomorKTA || m.ktaNumber || m.nbm || '',
                              email: m.email || '',
                              noWa: m.noHp || m.noWa || '',
                              tempatLahir: m.tempatLahir || '',
                              tanggalLahir: m.tanggalLahir || '',
                              jenisKelamin: m.jenisKelamin || 'L',
                              asalDaerah: m.asalKwarda || m.asalDaerah || '',
                              qabilah: m.qabilah || ''
                            }));
                          }}
                          className={`p-2.5 text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors ${addParticipantSelectedMemberId === m.id ? 'bg-emerald-100 font-black text-emerald-900' : 'text-gray-700'}`}
                        >
                          <div>
                            <div className="font-bold">{m.namaLengkap || m.nama}</div>
                            <div className="text-[10px] text-gray-400">{m.nomorKTA || m.nbm || m.email}</div>
                          </div>
                          {addParticipantSelectedMemberId === m.id && <Check size={14} className="text-emerald-700" />}
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={addParticipantForm.nama}
                    onChange={(e) => setAddParticipantForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="Nama Lengkap"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">NBM / Nomor KTA</label>
                  <input
                    type="text"
                    value={addParticipantForm.nbm}
                    onChange={(e) => setAddParticipantForm(f => ({ ...f, nbm: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="NBM"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={addParticipantForm.email}
                    onChange={(e) => setAddParticipantForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">No WhatsApp</label>
                  <input
                    type="text"
                    value={addParticipantForm.noWa}
                    onChange={(e) => setAddParticipantForm(f => ({ ...f, noWa: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="0812..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Jenjang Pelatihan</label>
                  <select
                    value={addParticipantForm.pelatihanAkanDiikuti}
                    onChange={(e) => setAddParticipantForm(f => ({ ...f, pelatihanAkanDiikuti: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Jati 1">Jaya Melati 1 (Jati 1)</option>
                    <option value="Jati 2">Jaya Melati 2 (Jati 2)</option>
                    <option value="Jari 1">Jaya Pandu Mandiri 1 (Jari 1)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Golongan Pelatih</label>
                  <select
                    value={addParticipantForm.pelatihGolongan}
                    onChange={(e) => setAddParticipantForm(f => ({ ...f, pelatihGolongan: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Tunas Athfal">Tunas Athfal</option>
                    <option value="Pengenal">Pengenal</option>
                    <option value="Penghela">Penghela</option>
                    <option value="Penuntun">Penuntun</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddParticipantModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddParticipantSubmit}
                disabled={isSubmittingAddParticipant}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save size={14} /> {isSubmittingAddParticipant ? 'Menyimpan...' : 'Simpan Peserta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT TRAINING APPLICATION MODAL */}
      {isEditTrainingModalOpen && editingTrainingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Pencil size={18} className="text-emerald-700" />
                Edit Data Peserta Pelatihan
              </h3>
              <button onClick={() => setIsEditTrainingModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nama Peserta</label>
                <input
                  type="text"
                  value={editingTrainingApp.nama || editingTrainingApp.namaLengkap || ''}
                  onChange={(e) => setEditingTrainingApp((prev: any) => ({ ...prev, nama: e.target.value, namaLengkap: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">NBM</label>
                  <input
                    type="text"
                    value={editingTrainingApp.nbm || ''}
                    onChange={(e) => setEditingTrainingApp((prev: any) => ({ ...prev, nbm: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">No WhatsApp</label>
                  <input
                    type="text"
                    value={editingTrainingApp.noWa || ''}
                    onChange={(e) => setEditingTrainingApp((prev: any) => ({ ...prev, noWa: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nilai Pre-Test</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTrainingApp.preTestScore ?? ''}
                    onChange={(e) => setEditingTrainingApp((prev: any) => ({ ...prev, preTestScore: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nilai Post-Test</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTrainingApp.postTestScore ?? ''}
                    onChange={(e) => setEditingTrainingApp((prev: any) => ({ ...prev, postTestScore: e.target.value }))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="0-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Status Kelulusan</label>
                <select
                  value={editingTrainingApp.statusKelulusan || 'Lulus'}
                  onChange={(e) => setEditingTrainingApp((prev: any) => ({ ...prev, statusKelulusan: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                  <option value="Lulus">Lulus</option>
                  <option value="Lulus Bersyarat">Lulus Bersyarat</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                  <option value="Proses">Proses</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditTrainingModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditTraining}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT ACTIVITY PARTICIPANT MODAL */}
      {isEditActivityParticipantModalOpen && editingActivityParticipant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Pencil size={18} className="text-emerald-700" />
                Edit Peserta Kegiatan
              </h3>
              <button onClick={() => setIsEditActivityParticipantModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nama Peserta</label>
                <input
                  type="text"
                  value={editingActivityParticipant.nama || editingActivityParticipant.namaLengkap || ''}
                  onChange={(e) => setEditingActivityParticipant((prev: any) => ({ ...prev, nama: e.target.value, namaLengkap: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">No WhatsApp</label>
                <input
                  type="text"
                  value={editingActivityParticipant.noHp || ''}
                  onChange={(e) => setEditingActivityParticipant((prev: any) => ({ ...prev, noHp: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Unsur / Utusan</label>
                <input
                  type="text"
                  value={editingActivityParticipant.unsur || editingActivityParticipant.asalKwarda || ''}
                  onChange={(e) => setEditingActivityParticipant((prev: any) => ({ ...prev, unsur: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Jabatan</label>
                <input
                  type="text"
                  value={editingActivityParticipant.jabatan || ''}
                  onChange={(e) => setEditingActivityParticipant((prev: any) => ({ ...prev, jabatan: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditActivityParticipantModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditActivityParticipant}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TRAINING REJECT MODAL */}
      {isTrainingRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
              <AlertCircle size={18} />
              Tolak Pendaftaran Pelatihan
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Alasan Penolakan</label>
              <textarea
                rows={3}
                value={trainingRejectReason}
                onChange={(e) => setTrainingRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan berkas..."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsTrainingRejectModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRejectTraining}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. KTA REJECT MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
              <AlertCircle size={18} />
              Tolak Pengajuan KTA
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Alasan Penolakan</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRejectKTA}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Tolak KTA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT KTA MODAL */}
      {isEditKtaModalOpen && editingKtaApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Edit Pengajuan KTA</h3>
              <button onClick={() => setIsEditKtaModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingKtaApp.nama || editingKtaApp.namaLengkap || ''}
                  onChange={(e) => setEditingKtaApp((p: any) => ({ ...p, nama: e.target.value, namaLengkap: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nomor KTA / NBM</label>
                <input
                  type="text"
                  value={editingKtaApp.ktaNumber || editingKtaApp.nomorKTA || ''}
                  onChange={(e) => setEditingKtaApp((p: any) => ({ ...p, ktaNumber: e.target.value, nomorKTA: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditKtaModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditKta}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. VIEW KTA MODAL */}
      {isViewKtaModalOpen && viewingKtaApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Kartu Tanda Anggota (KTA)</h3>
              <button onClick={() => setIsViewKtaModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center p-2">
              <KTACard
                member={{
                  ...viewingKtaApp,
                  namaLengkap: viewingKtaApp.nama || viewingKtaApp.namaLengkap,
                  nomorKTA: viewingKtaApp.ktaNumber || viewingKtaApp.nomorKTA || 'KTA-HW-0000',
                  tingkatan: viewingKtaApp.tingkatan || viewingKtaApp.golongan || 'Penghela',
                  asalKwarda: viewingKtaApp.asalDaerah || viewingKtaApp.asalKwarda || 'Jawa Tengah',
                  qabilah: viewingKtaApp.qabilah || 'Kwarwil HW Jawa Tengah',
                  photo: viewingKtaApp.photo || viewingKtaApp.foto || ''
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. MEMBER MODAL (Add/Edit Anggota) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData(f => ({ ...f, namaLengkap: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nomor KTA / NBM</label>
                <input
                  type="text"
                  value={formData.ktaNumber}
                  onChange={(e) => setFormData(f => ({ ...f, ktaNumber: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">No WhatsApp / HP</label>
                <input
                  type="text"
                  value={formData.noHp}
                  onChange={(e) => setFormData(f => ({ ...f, noHp: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Golongan</label>
                <select
                  value={formData.golongan}
                  onChange={(e) => setFormData(f => ({ ...f, golongan: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                  <option value="Athfal">Athfal</option>
                  <option value="Pengenal">Pengenal</option>
                  <option value="Penghela">Penghela</option>
                  <option value="Penuntun">Penuntun</option>
                  <option value="Pelatih">Pelatih</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Asal Kwarda</label>
                <input
                  type="text"
                  value={formData.asalKwarda}
                  onChange={(e) => setFormData(f => ({ ...f, asalKwarda: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMember}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MATERI MODAL */}
      {isMateriModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingMateri ? 'Edit Materi Pelatihan' : 'Tambah Materi Pelatihan'}
              </h3>
              <button onClick={() => setIsMateriModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Judul Materi</label>
                <input
                  type="text"
                  value={materiFormData.judul}
                  onChange={(e) => setMateriFormData(f => ({ ...f, judul: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kategori</label>
                <select
                  value={materiFormData.kategori}
                  onChange={(e) => setMateriFormData(f => ({ ...f, kategori: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                  <option value="umum">Umum</option>
                  <option value="Jati 1">Jaya Melati 1 (Jati 1)</option>
                  <option value="Jati 2">Jaya Melati 2 (Jati 2)</option>
                  <option value="Jari 1">Jaya Pandu Mandiri 1 (Jari 1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Link Drive / Berkas</label>
                <input
                  type="text"
                  value={materiFormData.driveUrl}
                  onChange={(e) => setMateriFormData(f => ({ ...f, driveUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsMateriModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMateri}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Simpan Materi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. KEGIATAN MODAL */}
      {isKegiatanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingKegiatan ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan'}
              </h3>
              <button onClick={() => setIsKegiatanModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Judul Agenda</label>
                <input
                  type="text"
                  value={kegiatanFormData.judul}
                  onChange={(e) => setKegiatanFormData(f => ({ ...f, judul: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Lokasi</label>
                <input
                  type="text"
                  value={kegiatanFormData.lokasi}
                  onChange={(e) => setKegiatanFormData(f => ({ ...f, lokasi: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={kegiatanFormData.tanggal}
                  onChange={(e) => setKegiatanFormData(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsKegiatanModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveKegiatan}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. CONTENT MODAL */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingContent ? 'Edit Konten' : 'Tambah Konten Baru'}
              </h3>
              <button onClick={() => setIsContentModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Judul / Teks 1</label>
                <input
                  type="text"
                  value={contentFormData.field1}
                  onChange={(e) => setContentFormData(f => ({ ...f, field1: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Keterangan / Teks 2</label>
                <input
                  type="text"
                  value={contentFormData.field2}
                  onChange={(e) => setContentFormData(f => ({ ...f, field2: e.target.value }))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsContentModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveContent}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. ASSIGN TASK MODAL */}
      {showAssignTaskModal && assigningMateri && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Tugaskan Materi ke Peserta</h3>
              <button onClick={() => setShowAssignTaskModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Materi: <span className="font-bold text-gray-900">{assigningMateri.judul}</span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowAssignTaskModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
"""

full_content = "\n".join(base_lines) + "\n" + rest_of_file

with open('src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(full_content)

print("Saved assembled file. Total lines:", len(full_content.splitlines()))
