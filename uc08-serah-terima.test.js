// UC-08 Mengelola dan Mendokumentasikan Serah Terima  |  V(G) = 3  |  Kelompok 4 FINDKOM
// Unit yang diuji: modal serah terima mod() (aturan tombol aktif) dan handler 'done' (Selesaikan & Tutup).
// Kasus yang SENGAJA GAGAL: TC-08-06 (Temuan 3).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const A = require('./helpers/app');

const siap = () => { const w = A.bukaApp(); const mt = A.siapkanSerahTerima(w); return { w, mt }; };
// Atur foto lalu render ulang modal, kembalikan apakah tombol Selesaikan nonaktif.
const tombolNonaktif = (w, korban, ktm) => {
  A.ev(w, `S.ho.a=${korban ? `'${A.FOTO}'` : 'null'};S.ho.b=${ktm ? `'${A.FOTO}'` : 'null'};mod()`);
  return w.document.querySelector('#md [data-a="done"]').disabled;
};

describe('UC-08: aturan tombol "Selesaikan & Tutup Laporan"', () => {
  test('TC-08-01 | Kedua foto kosong | jalur 1-2-4-9 | tombol nonaktif', () => {
    const { w } = siap();
    assert.equal(tombolNonaktif(w, false, false), true);
  });
  test('TC-08-02 | Hanya foto korban | jalur 1-2-3-4-9 | tombol nonaktif', () => {
    const { w } = siap();
    assert.equal(tombolNonaktif(w, true, false), true);
  });
  test('TC-08-03 | Hanya foto KTM | jalur 1-2-4-9 | tombol nonaktif', () => {
    const { w } = siap();
    assert.equal(tombolNonaktif(w, false, true), true);
  });
  test('TC-08-04 | Kedua foto lengkap | jalur 1-2-3-5-6-7-8-9 | tombol aktif', () => {
    const { w } = siap();
    assert.equal(tombolNonaktif(w, true, true), false);
  });
});

describe('UC-08: handler Selesaikan & Tutup Laporan', () => {
  test('TC-08-05 | Menekan Selesaikan | jalur ...-6-7-8-9 | kedua laporan CLOSED, petugas dan waktu tercatat', () => {
    const { w, mt } = siap();
    tombolNonaktif(w, true, true);
    A.klik(w, '#md [data-a="done"]');
    const m = A.ambil(w, `db.mt.find(x=>x.id==='${mt.id}')`);
    assert.equal(m.st, 'CLOSED');
    const [lost, found] = A.ambil(w, `[R('${mt.l}').st,R('${mt.f}').st]`);
    assert.equal(lost, 'CLOSED');
    assert.equal(found, 'CLOSED');
    assert.equal(m.ho.handled_by, 'Security');
    assert.ok(!Number.isNaN(Date.parse(m.ho.handed_over_at)), 'waktu serah terima tercatat');
  });

  test('TC-08-06 | Handler dipaksa tanpa foto | jalur 6-7-8-9 | SEHARUSNYA DITOLAK (Temuan 3)', () => {
    const { w, mt } = siap();
    tombolNonaktif(w, false, false);                  // foto kosong, tombol nonaktif di tampilan
    // Memanggil handler tanpa lewat tombol: tombol yang nonaktif tidak bisa diklik, jadi dipaksa lewat elemen lain.
    const paksa = w.document.createElement('button');
    paksa.setAttribute('data-a', 'done');
    w.document.body.appendChild(paksa);
    paksa.click();
    const st = A.ambil(w, `db.mt.find(x=>x.id==='${mt.id}').st`);
    assert.notEqual(st, 'CLOSED', 'laporan tertutup tanpa foto bukti (status: ' + st + ')');
  });
});
