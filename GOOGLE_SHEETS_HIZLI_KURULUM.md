# 📋 Google Sheets COA Entegrasyonu - Hızlı Kurulum

## 🚀 Adım 1: Google Sheets Oluştur

1. [Google Sheets](https://sheets.google.com) adresine git
2. **"+ Boş"** tıklayarak yeni bir tablo oluştur
3. Tabloya isim ver: **"COA Sertifikaları"**

---

## 📝 Adım 2: Apps Script Ekle

1. Google Sheet'te menüden: **Uzantılar → Apps Script**
2. Açılan editörde **tüm kodu sil**
3. `GOOGLE_APPS_SCRIPT_CODE.js` dosyasındaki kodu **tamamen kopyala-yapıştır**
4. **Ctrl+S** ile kaydet
5. Projeye isim ver: **"COA API"**

---

## 🌐 Adım 3: Web App Olarak Yayınla

1. Sağ üstteki **"Dağıt"** butonuna tıkla
2. **"Yeni dağıtım"** seç
3. Ayarlar:
   - ⚙️ **Tür seç:** Sol taraftaki ⚙️ ikona tıkla → **Web uygulaması**
   - 📝 **Açıklama:** `COA API v1`
   - 👤 **Şu şekilde yürüt:** `Ben (kendi email adresiniz)`
   - 🌍 **Erişimi olan kişiler:** **Herkes** ⚠️ (Bu çok önemli!)
4. **"Dağıt"** butonuna tıkla
5. **"Erişime izin ver"** → Google hesabınızı seçin
6. "Bu uygulama doğrulanmadı" uyarısı gelirse:
   - **"Gelişmiş"** tıkla
   - **"XXX'e git (güvenli değil)"** tıkla
7. **Web uygulaması URL'sini kopyalayın!**

URL şuna benzer:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

---

## 🔗 Adım 4: COA Sayfasına Bağlan

1. `coa-arsiv.html` dosyasını tarayıcıda aç
2. Sayfanın altındaki **"Google Sheets Bağlantısı"** bölümüne git
3. Kopyaladığınız URL'yi yapıştır
4. **"Bağlan"** butonuna tıkla
5. ✅ "Google Sheets Bağlı ✓" mesajını görmelisiniz

---

## ⚠️ Önemli Notlar

### Her Kod Değişikliğinde:
- **YENİ DAĞITIM** yapın! (Mevcut dağıtımı güncellemeyin)
- Her yeni dağıtımda yeni URL alacaksınız
- Yeni URL'yi coa-arsiv.html'e tekrar girin

### Sık Karşılaşılan Sorunlar:

**❌ "Bağlantı hatası" alıyorsanız:**
1. URL'nin sonunda `/exec` olduğundan emin olun
2. "Erişimi olan kişiler" = "Herkes" olmalı
3. Apps Script'i yeniden deploy edin

**❌ "İzin hatası" alıyorsanız:**
1. Deploy ederken "Herkes" seçtiğinizden emin olun
2. "Gelişmiş → XXX'e git" adımını atlamamış olabilirsiniz

**❌ Veriler görünmüyorsa:**
1. Google Sheets'te "COA_Arsiv" sayfası oluşturulmuş mu kontrol edin
2. Apps Script'te `testAPI()` fonksiyonunu çalıştırarak test edin

---

## 🧪 Test Etme

Apps Script editöründe:
1. Fonksiyon seçin: `testAPI`
2. ▶️ Çalıştır butonuna tıklayın
3. Loglara bakın (Görünüm → Günlükler)

---

## ✅ Kurulum Tamamlandı!

Artık:
- ✅ Tüm bilgisayarlardan erişim
- ✅ Sertifika verileri Google Sheets'te
- ✅ Otomatik yedekleme
- ✅ 15GB ücretsiz alan
