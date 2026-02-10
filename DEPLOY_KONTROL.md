# 🔄 Google Apps Script Deploy Kontrolü

## ❌ Sorun
```
Geçersiz action: syncExistingFiles
```

Bu hata, Google Apps Script'in **ESKİ versiyonu** hala çalışıyor demektir.

## ✅ Çözüm: Yeni Deployment

### Adım 1: Script Editor'ü Aç
1. Google Sheets dosyanızı açın
2. **Extensions → Apps Script** tıklayın

### Adım 2: Kodu Güncelle
1. Sol panelden `Code.gs` dosyasını seçin
2. **Tüm kodu seçip silin** (Ctrl+A → Delete)
3. `GOOGLE_APPS_SCRIPT_CODE.js` dosyasındaki tüm kodu kopyalayın
4. Script Editor'e yapıştırın
5. **File → Save** (veya Ctrl+S)

### Adım 3: Yeniden Deploy Et
1. Sağ üstte **Deploy** butonuna tıklayın
2. **Manage deployments** seçin
3. Mevcut deployment'ın yanındaki ✏️ **Edit** ikonuna tıklayın
4. **Version** dropdown'unda **New version** seçin
5. Description: "syncExistingFiles fonksiyonu eklendi"
6. **Deploy** butonuna tıklayın
7. **Done** ile kapatın

### Adım 4: Test Et
1. `coa-arsiv.html` sayfasını yenileyin (F5)
2. Settings panelinden **"🔄 Mevcut Dosyaları Senkronize Et"** butonuna tıklayın
3. Artık çalışmalı! 🎉

---

## 🔍 Deploy Kontrolü

Script Editor'de bu satırları arayın:

```javascript
case 'syncExistingFiles':
  result = syncExistingFilesToArchive();
  break;
```

Ve bu fonksiyonun varlığını kontrol edin:

```javascript
function syncExistingFilesToArchive() {
  try {
    const centralFolder = getCentralArchiveFolder();
    // ... (kod devam eder)
```

Bu kod blokları varsa ve hala hata alıyorsanız, **mutlaka yeni deployment yapın**.

---

## ⚡ Hızlı Test (Deployment olmadan)

Script Editor'de:
1. Üstteki fonksiyon dropdown'undan `syncExistingFilesToArchive` seçin
2. **Run** butonuna tıklayın
3. Execution log'da sonuçları görün

Bu çalışırsa, problem deployment'ta demektir.
