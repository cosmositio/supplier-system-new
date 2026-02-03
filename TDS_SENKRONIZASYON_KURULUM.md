# TDS Senkronizasyon Kurulumu

## 🎯 Amaç
TDS ayarlarınızı (Density, Sertlik, Kopma Direnci vb.) **tüm cihazlarınızda** görebilmeniz için Google Sheets entegrasyonu eklendi.

## 📋 Kurulum Adımları

### 1. Google Apps Script'i Güncelle

1. Google Sheets sayfanıza gidin (COA arşiviniz)
2. **Uzantılar** → **Apps Script** menüsünü açın
3. `GOOGLE_APPS_SCRIPT_CODE.js` dosyasındaki **güncel kodu** kopyalayın
4. Apps Script editörüne **TÜMÜNÜ** yapıştırın (eski kodu silin)
5. **Kaydet** (Ctrl+S)
6. **Dağıt** → **Dağıtımları yönet** → **Düzenle** → **Sürüm: Yeni sürüm** → **Dağıt**

### 2. Test Edin

1. Apps Script'te `testAPI()` fonksiyonunu çalıştırın
2. İzinleri onaylayın
3. Başarılı mesajı görmeli

### 3. Yeni Sheet Otomatik Oluşacak

İlk TDS kaydedildiğinde, Google Sheets'te otomatik olarak **"TDS_Definitions"** adında yeni bir sayfa oluşacak.

## ✨ Nasıl Çalışır?

### Otomatik Senkronizasyon

1. **Sayfa açılışta:**
   - Google Sheets'ten tüm TDS verileri indirilir
   - localStorage ile birleştirilir
   - Konsola log yazılır: `☁️ Google Sheets'ten X TDS yüklendi`

2. **TDS kaydedildiğinde:**
   - Hem localStorage'a hem Google Sheets'e yazılır
   - Konsola log: `☁️ TDS Google Sheets'e kaydedildi: 900.4.15K-15.01`

### Console Logları

Tarayıcı console'da (F12) şu mesajları göreceksiniz:

```
☁️ Google Sheets'ten TDS verileri yükleniyor...
✅ Google Sheets'ten 5 TDS yüklendi
☁️ TDS Google Sheets'e kaydedildi: 900.4.15K-15.01
```

## 📱 Cihazlar Arası Kullanım

### PC'den mobil'e:
1. PC'de TDS tanımlarını yapın (Density, Sertlik vb.)
2. Kaydedin
3. Mobil cihazdan sayfayı açın
4. TDS otomatik yüklenecek ✅

### Mobil'den PC'ye:
1. Mobil cihazdan TDS ekleyin/düzenleyin
2. PC'den sayfayı yenileyin (F5)
3. Değişiklikler yüklenecek ✅

## ⚠️ Önemli Notlar

1. **Google Script URL'i gerekli:**
   - `shared-config.js` dosyasında `googleScriptUrl` tanımlı olmalı
   - Yoksa sadece localStorage kullanılır (cihaza özel kalır)

2. **Offline çalışma:**
   - İnternet yoksa localStorage kullanılır
   - İnternet gelince senkronize edilir

3. **Veri birleştirme:**
   - Google Sheets verisi önceliklidir
   - Boş tanımlar localStorage'dan korunur

## 🔍 Sorun Giderme

### "Google Script URL tanımlı değil" hatası:

**shared-config.js** dosyasını kontrol edin:
```javascript
const googleScriptUrl = 'https://script.google.com/macros/s/...';
```

### TDS yüklenmiyor:

1. Console'u açın (F12)
2. Hata mesajlarını kontrol edin
3. Apps Script dağıtımını kontrol edin
4. Test fonksiyonunu çalıştırın

### Senkronizasyon çalışmıyor:

1. Hard refresh yapın (Ctrl+Shift+R)
2. Console'da şu komutu çalıştırın:
```javascript
loadTDSFromGoogleSheets()
```
3. Hata mesajını kontrol edin

## 📊 Google Sheets'te TDS Formatı

**TDS_Definitions** sayfası şu sütunları içerir:

| Hammadde Kodu | TDS Verisi (JSON) | Güncelleme Tarihi |
|---------------|-------------------|-------------------|
| 900.4.15K-15.01 | {"properties":[...]} | 01.02.2026 14:30 |

## 🎉 Avantajlar

✅ **Tüm cihazlarda aynı TDS tanımları**
✅ **Otomatik senkronizasyon**
✅ **Offline çalışma desteği**
✅ **Google Sheets'te yedekleme**
✅ **Merkezi veri yönetimi**

---

**Not:** İlk kurulumdan sonra tüm cihazlarınızda TDS tanımları senkronize olacak!
