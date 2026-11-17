// Helper: memuat prototipe FINDKOM ke jsdom dan menyediakan aksi UI yang dipakai semua tes.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = process.env.FINDKOM_HTML ||
  path.join(__dirname, '..', '..', 'prototype', 'findkom.html');

const FOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

/** Buka prototipe baru (localStorage kosong). */
function bukaApp() {
  const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  win.scrollTo = () => {};
  return win;
}

/** Evaluasi ekspresi di dalam halaman (variabel db, S, tm, mod, dst. ada di sana). */
const ev = (win, kode) => win.eval(kode);
/** Ambil nilai dari halaman sebagai objek JS biasa. */
const ambil = (win, ekspresi) => JSON.parse(win.eval(`JSON.stringify(${ekspresi})`));
const toast = (win) => win.document.querySelector('#ts').textContent;
const klik = (win, selector) => {
  const el = win.document.querySelector(selector);
  if (!el) throw new Error('Elemen tidak ditemukan: ' + selector);
  el.click();
};

/** Login sebagai 'civ' (Civitas) atau 'sec' (Security). */
function login(win, peran, email) {
  klik(win, `[data-a="lr"][data-v="${peran}"]`);
  const f = win.document.querySelector('#lg');
  f.querySelector('[name="e"]').value =
    email || (peran === 'civ' ? 'viona@student.ub.ac.id' : 'security@ub.ac.id');
  f.requestSubmit();
}
const keluar = (win) => klik(win, '[data-a="out"]');

/**
 * Buka form laporan dan isi. jenis: 'lost' atau 'found'.
 * Mengembalikan form (belum dikirim).
 */
function isiForm(win, jenis, d = {}) {
  klik(win, '[data-a="nav"][data-v="lapor"]');
  klik(win, `.sg [data-a="tab"][data-v="${jenis}"]`);
  const doc = win.document;
  const f = doc.querySelector('#fl');
  const set = (name, v) => { if (v !== undefined) f.querySelector(`[name="${name}"]`).value = v; };

  const gedung = 'b' in d ? d.b : 'Gedung F';
  const bs = doc.querySelector('#bs');
  bs.value = gedung;
  bs.dispatchEvent(new win.Event('change', { bubbles: true }));
  if (gedung) f.querySelector('[name="room"]').value = 'room' in d ? d.room : 'F 1.1';

  set('cat', 'cat' in d ? d.cat : 'Dompet');
  set('desc', 'desc' in d ? d.desc : 'Dompet kulit hitam berisi KTM');
  set('date', d.date);
  set('time', d.time);
  if (d.foto) ev(win, `S.ph='${FOTO}'`); // go('lapor') mereset S.ph, jadi diisi setelah form terbuka
  return f;
}
/** Kirim form lewat jalur browser (validasi required/minlength ikut berjalan). */
const kirim = (f) => f.requestSubmit();

/** Buat satu laporan lewat UI. */
function buatLaporan(win, jenis, d = {}) {
  const f = isiForm(win, jenis, { foto: jenis === 'found', ...d });
  kirim(f);
}

/** Siapkan satu match berstatus NOTIFIED (sudah diverifikasi) dan buka modal serah terima. */
function siapkanSerahTerima(win) {
  login(win, 'civ');
  buatLaporan(win, 'found');
  buatLaporan(win, 'lost');
  keluar(win);
  login(win, 'sec');
  klik(win, '[data-a="nav"][data-v="kand"]');
  klik(win, '[data-a="ver"]');
  klik(win, '[data-a="nav"][data-v="serah"]');
  klik(win, '[data-a="ho"]');
  return ambil(win, 'db.mt[0]');
}

module.exports = { bukaApp, ev, ambil, toast, klik, login, keluar, isiForm, kirim, buatLaporan, siapkanSerahTerima, FOTO };
