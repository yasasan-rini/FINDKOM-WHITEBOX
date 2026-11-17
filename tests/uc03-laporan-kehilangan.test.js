// UC-03 Membuat Laporan Kehilangan  |  V(G) = 4  |  Kelompok 4 FINDKOM
// Unit yang diuji: handler kirim form (submit 'fl') dan fungsi pencocokan tm().
// Kasus yang SENGAJA GAGAL (menunjukkan cacat): TC-03-06 (Temuan 1) dan TC-03-07 (Temuan 2).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const A = require('./helpers/app');

const baru = () => { const w = A.bukaApp(); A.login(w, 'civ'); return w; };
const jumlahLaporan = (w) => A.ambil(w, 'db.rep.length');

describe('UC-03: kirim laporan kehilangan', () => {
  test('TC-03-01 | Form valid, tanpa temuan cocok | jalur 1-2-4-6-7-8-9-11-12-13', () => {
    const w = baru();
    A.buatLaporan(w, 'lost');
    const rep = A.ambil(w, 'db.rep');
    assert.equal(rep.length, 1);
    assert.equal(rep[0].code, 'L-0001');
    assert.equal(rep[0].st, 'LOST_REPORTED');
    assert.match(A.toast(w), /mencocokkan otomatis/);
  });

  test('TC-03-02 | Gedung atau ruang kosong | jalur 1-2-3-13', () => {
    const w = baru();
    A.kirim(A.isiForm(w, 'lost', { b: '' }));
    assert.equal(jumlahLaporan(w), 0);
  });

  test('TC-03-03 | Kategori atau deskripsi kosong | jalur 1-2-3-13', () => {
    for (const kosong of [{ cat: '' }, { desc: '' }]) {
      const w = baru();
      A.kirim(A.isiForm(w, 'lost', kosong));
      assert.equal(jumlahLaporan(w), 0, 'ditolak untuk ' + JSON.stringify(kosong));
    }
  });

  test('TC-03-04 | Form valid, ada temuan cocok | jalur ...-9-10-12-13', () => {
    const w = baru();
    A.buatLaporan(w, 'found');                       // temuan lebih dulu
    A.buatLaporan(w, 'lost');                        // gedung, kategori, tanggal sama
    const rep = A.ambil(w, 'db.rep');
    const mt = A.ambil(w, 'db.mt');
    assert.equal(mt.length, 1);
    assert.equal(mt[0].st, 'MATCH_CANDIDATE');
    assert.deepEqual(rep.map((r) => r.st), ['MATCH_CANDIDATE', 'MATCH_CANDIDATE']);
    assert.match(A.toast(w), /1 kandidat/);
  });

  test('TC-03-05 | Tab Temuan tanpa foto | jalur 1-2-4-5-13', () => {
    const w = baru();
    A.kirim(A.isiForm(w, 'found', { foto: false }));
    assert.equal(jumlahLaporan(w), 0);
    assert.match(A.toast(w), /Foto barang temuan wajib/);
  });

  test('TC-03-06 | Deskripsi hanya 5 spasi | jalur 1-2-4-6-... | SEHARUSNYA DITOLAK (Temuan 1)', () => {
    const w = baru();
    A.kirim(A.isiForm(w, 'lost', { desc: '     ' }));
    const rep = A.ambil(w, 'db.rep');
    assert.ok(rep.length === 0 || rep.every((r) => r.desc !== ''),
      'laporan tersimpan dengan deskripsi kosong: ' + JSON.stringify(rep.map((r) => r.desc)));
  });

  test('TC-03-07 | Penyimpanan gagal (Alt 2) | jalur 1-2-4-6-7-8-... | SEHARUSNYA PESAN GAGAL (Temuan 2)', () => {
    const w = baru();
    const f = A.isiForm(w, 'lost');
    w.Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); };
    A.kirim(f);
    assert.match(A.toast(w), /gagal/i, 'pesan yang tampil: "' + A.toast(w) + '"');
  });

  test('TC-03-08 | Laporan kedua mendapat nomor urut berikutnya', () => {
    const w = baru();
    A.buatLaporan(w, 'lost', { b: 'Gedung A', room: 'A 1.1' });
    A.buatLaporan(w, 'lost', { b: 'Gedung B', room: 'B 1.1' });
    assert.deepEqual(A.ambil(w, 'db.rep.map(r=>r.code)'), ['L-0001', 'L-0002']);
  });
});

// Pengujian kondisi majemuk pada tm(): jenis, status, gedung, kategori, selisih hari.
describe('UC-03: fungsi pencocokan tm() (condition coverage dan batas nilai)', () => {
  const lap = (o) => Object.assign({
    id: 'x' + Math.random(), type: 'found', st: 'FOUND_REPORTED',
    b: 'Gedung F', cat: 'Dompet', date: '2026-11-10',
  }, o);
  // Pasang satu laporan lama 'o' di db, lalu panggil tm() dengan laporan baru 'r'. Hasil = jumlah kandidat.
  const jalankan = (lama, baruR) => {
    const w = A.bukaApp();
    A.ev(w, `db.rep.push(${JSON.stringify(lama)})`);
    return A.ev(w, `tm(${JSON.stringify(baruR)})`);
  };
  const baruLost = (o) => lap(Object.assign({ type: 'lost', st: 'LOST_REPORTED' }, o));

  test('TC-03-TM-1 | Jenis sama (lost dengan lost) tidak dicocokkan', () =>
    assert.equal(jalankan(lap({ type: 'lost', st: 'LOST_REPORTED' }), baruLost()), 0));
  test('TC-03-TM-2 | Status laporan lama bukan OPEN tidak dicocokkan', () =>
    assert.equal(jalankan(lap({ st: 'CLOSED' }), baruLost()), 0));
  test('TC-03-TM-3 | Gedung berbeda tidak dicocokkan', () =>
    assert.equal(jalankan(lap({ b: 'Gedung A' }), baruLost()), 0));
  test('TC-03-TM-4 | Kategori berbeda tidak dicocokkan', () =>
    assert.equal(jalankan(lap({ cat: 'Kunci' }), baruLost()), 0));
  test('TC-03-TM-5 | Selisih 5 hari tidak dicocokkan', () =>
    assert.equal(jalankan(lap({ date: '2026-11-05' }), baruLost()), 0));
  test('TC-03-TM-6 | Batas tepat 4 hari dicocokkan', () =>
    assert.equal(jalankan(lap({ date: '2026-11-06' }), baruLost()), 1));
  test('TC-03-TM-7 | Semua kondisi lolos dicocokkan', () =>
    assert.equal(jalankan(lap(), baruLost()), 1));
});
