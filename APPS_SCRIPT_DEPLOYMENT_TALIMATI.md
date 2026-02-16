# 🚀 APPS SCRIPT DEPLOYMENT TALİMATI

## ⚠️ ÖNEMLİ UYARI!

**localStorage tamamen kaldırıldı!** Artık tüm veriler **SADECE Google Sheets'ten** yükleniyor.

Eğer Google Sheets bağlantısı çalışmazsa **hiçbir veri görünmeyecek!**

---

## 📋 ADIM ADIM DEPLOYMENT

### 1️⃣ Google Sheets'i Aç
- Tedarikçi listenizin bulunduğu Google Sheets dosyasını açın

### 2️⃣ Apps Script Editor'e Git
```
Extensions → Apps Script
```

### 3️⃣ Yeni Kodu Yapıştır
1. Sol menüdeverilen dosyaları görüntüleyin
2. Ana kod dosyasını açın (genellikle `Code.gs`)
3. **TÜM ESKİ KODU SİLİN!**
4. `GOOGLE_APPS_SCRIPT_CODE.js` dosyasındaki **TÜM KODU** kopyalayıp yapıştırın

### 4️⃣ Kaydet
```
Ctrl + S veya File → Save
```

### 5️⃣ Deploy Et (EN ÖNEMLİ ADIM!)
```
1. Sağ üst köşede "Deploy" butonu
2. "Manage deployments" seçin
3. Mevcut deployment'ın yanındaki ✏️ (kalem) ikonuna tıklayın
4. "Version" dropdown'ından "New version" seçin
5. Açıklama (opsiyonel): "localStorage kaldırıldı, cache bypass eklendi"
6. "Deploy" butonuna tıklayın
7. ‼️ VERSION NUMARASININ ARTTĞINI KONTROL EDİN (örn: @15 → @16)
```

### 6️⃣ Deployment URL'yi Kopyala
- Deploy olduktan sonra gösterilen URL'yi kopyalayın
- Bu URL coa-arsiv.html'de zaten var olmalı:
  ```
  https://script.google.com/macros/s/AKfycbz3KZblRoWV0uU7_LU24Wih4npAl2x8_vFWDjmc-F0bDeRHgmrSEi0XB-YsaaD0_i4u/exec
  ```

### 7️⃣ Tarayıcı Cache'i Temizle
```
Chrome/Edge:
1. Ctrl + Shift + Delete
2. "Cached images and files" seç
3. "Clear data" tıkla

VEYA Console'da:
localStorage.clear(); sessionStorage.clear(); location.reload(true);
```

### 8️⃣ Test Et
1. coa-arsiv.html'i açın (Ctrl + F5 ile hard refresh)
2. Console'u açın (F12)
3. Şu mesajları görmelisiniz:
   ```
   ✅ Google Sheets bağlantısı başarılı
   📦 Toplam COA_Records kaydı: [sayı]
   ```

4. **Eğer hata görürseniz:**
   ```
   🚨 GOOGLE SHEETS BAĞLANTISI YOK - VERİ YÜKLENEMIYOR!
   ```
   Bu durumda deployment'ı tekrar kontrol edin!

---

## 🔍 DEĞİŞİKLİKLERİN LİSTESİ

### GOOGLE_APPS_SCRIPT_CODE.js
1. ✅ `saveCOARecord()` - Delete-then-insert pattern (satır 1974-2014)
2. ✅ `getCOARecords()` - SpreadsheetApp.flush() eklendi (satır 2088)
3. ✅ `createResponse()` - No-cache headers eklendi (satır 343-347)

### coa-arsiv.html
1. ✅ Tüm `loadFromLocalStorage()` çağrıları kaldırıldı
2. ✅ Tüm `saveToLocalStorage()` çağrıları kaldırıldı
3. ✅ Hata mesajları daha açık hale getirildi
4. ✅ Google Sheets bağlantısı zorunlu hale getirildi

### shared-config.js
1. ✅ `getCOARecords()` - Timestamp cache busting eklendi (satır 79)

---

## 🎯 BEKLENEN DAVTA

### ✅ DOĞRU ÇALIŞMA:
- Sayfa açılır açılmaz Google Sheets'ten veri yüklenir
- Sheets'te manuel değişiklik yaptığınızda sayfa yenilendiğinde değişikliker görünür
- localStorage hiç kullanılmaz
- Tüm veriler bulutta (Sheets'te) saklanır

### ❌ HATA DURUMU:
- "Script loading hatası" → Apps Script deployment yapılmamış
- "0 kayıt yüklendi" → getCOARecords() fonksiyonu çalışmıyor
- "Bağlantı başarısız" → Internet bağlantısı veya Apps Script URL'i yanlış

---

## 📞 SORUN GİDERME

### Problem: "Script loading hatası"
**Çözüm:** Apps Script'i yeniden deploy edin ve version numarasının arttığını kontrol edin

### Problem: "Bazı değerler kayboldu"
**Çözüm:** Bu artık OLMAMALI. Eğer oluyorsa Apps Script deployment yapılmamış demektir.

### Problem: "Sayfa boş"
**Çözüm:** Google Sheets bağlantısı çalışmıyor. Console'da hatayı kontrol edin.

---

## ✅ TEST PROSEDÜRÜ

1. **Google Sheets'te bir değer değiştirin:**
   - COA_Records sheet'ine gidin
   - Herhangi bir "COA Değeri" sütununu değiştirin (örn: "5.2" → "TEST_123")

2. **coa-arsiv.html'i yenileyin:**
   - Ctrl + Shift + R (hard refresh)

3. **Değişikliğin yansıdığını kontrol edin:**
   - İlgili COA'yı açın
   - "TEST_123" değerinin göründüğünü doğrulayın

4. **Console loglarını kontrol edin:**
   - "🗑️ Aynı irsaliye için ... eski satır siliniyor" mesajı görünüyor mu?
   - Bu mesaj varsa = YENİ KOD ÇALIŞIYOR ✅
   - Bu mesaj yoksa = ESKİ KOD ÇALIŞIYOR, DEPLOYMENT YAPILMAMIŞ ❌

---

## 🚨 ACİL DURUM: Geri Alma

Eğer bir şey ters giderse:

1. Apps Script Editor'de "Deployments" → "Manage deployments"
2. Son deployment'ı deactive edin
3. Bir önceki version'ı active yapın
4. Ama DİKKAT: Eski versiyonda localStorage kullanılıyordu, yeni sistemde localStorage yok!

---

**SON KONTROL LİSTESİ:**
- [ ] GOOGLE_APPS_SCRIPT_CODE.js kodu Apps Script'e yapıştırıldı
- [ ] Ctrl + S ile kaydedildi
- [ ] Deploy → Manage deployments → Edit → New version
- [ ] Deploy tıklandı
- [ ] Version numarası arttı (örn: @15 → @16)
- [ ] Tarayıcı cache temizlendi
- [ ] coa-arsiv.html açıldı (Ctrl + F5)
- [ ] Console'da "✅ Google Sheets bağlantısı başarılı" mesajı görüldü
- [ ] Test değişikliği Sheets'te yapıldı ve yansıdı

**DEPLOYMENT BAŞARILI! 🎉**
