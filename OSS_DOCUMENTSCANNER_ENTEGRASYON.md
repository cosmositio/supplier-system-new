# 📱 OSS-DocumentScanner Entegrasyonu

## 🎯 Nedir?

OSS-DocumentScanner, profesyonel belge tarama için açık kaynaklı bir Android/iOS uygulamasıdır. Web sayfamızdan bu uygulamayı doğrudan açabilir ve tarama yapabilirsiniz.

## ✅ Yapılan Entegrasyon

### Android
- **Intent URL** kullanarak uygulamayı açma
- Uygulama yoksa **Play Store'a yönlendirme**
- Fallback: Normal kamera açılıyor

### iOS  
- **URL Scheme** ile uygulama açma (eğer destekliyorsa)
- Fallback: Normal kamera açılıyor

## 📋 Entegre Edilen Sayfalar

1. **[coa.html](coa.html)** - COA Yönetim (OCR'li)
   - "📷 Belge Tara (OSS Scanner)" butonu

2. **[coa-arsiv.html](coa-arsiv.html)** - COA Arşiv
   - "📷 Belge Tara" butonu

## 🚀 Nasıl Çalışır?

### Android'de:
```javascript
// Intent URL formatı
intent://scan/#Intent;
  scheme=documentscanner;
  package=com.akylas.documentscanner;
  S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.akylas.documentscanner;
end
```

1. Butona tıkla
2. OSS-DocumentScanner varsa → Uygulama açılır
3. OSS-DocumentScanner yoksa:
   - Play Store'a yönlendirilir
   - 2 saniye sonra normal kamera açılır (fallback)

### iOS'ta:
```javascript
documentscanner://scan
```

1. Butona tıkla
2. Uygulama varsa → Açılır
3. Yoksa → Normal kamera açılır (fallback)

## 📱 Kullanım Senaryosu

### Senaryo 1: Uygulama Yüklü
1. **"Belge Tara"** butonuna bas
2. **OSS-DocumentScanner** açılır
3. Belgeyi tara ve düzenle (kenar algılama, filtreler vb.)
4. **Kaydet** de
5. Uygulamadan **Share/Paylaş** ile web sayfana dön
6. Dosyayı seç ve yükle
7. OCR otomatik çalışır

### Senaryo 2: Uygulama Yüklü Değil
1. **"Belge Tara"** butonuna bas
2. Play Store'a yönlendirilir (isteğe bağlı yükle)
3. 2 saniye sonra **normal kamera** açılır
4. Fotoğrafı çek
5. OCR otomatik çalışır

## 🔄 İş Akışı

```
[Belge Tara Butonu]
        ↓
    Android? iOS?
        ↓
[Intent/URL Scheme]
        ↓
    Uygulama Var mı?
    ↙          ↘
  EVET         HAYIR
    ↓            ↓
[OSS Açılır] [Fallback: Normal Kamera]
    ↓
[Tara & Kaydet]
    ↓
[Share → Web]
    ↓
[OCR İşlemi]
```

## 💡 Avantajlar

### OSS-DocumentScanner Kullanımı:
- ✅ **Profesyonel kenar algılama**
- ✅ **Otomatik perspektif düzeltme**
- ✅ **Çoklu filtre seçenekleri** (B&W, Grayscale, etc.)
- ✅ **Çoklu sayfa desteği**
- ✅ **PDF oluşturma**
- ✅ **Yüksek kalite**

### Fallback (Normal Kamera):
- ✅ **Hızlı erişim**
- ✅ **Uygulama yükleme gerektirmez**
- ✅ **Basit kullanım**

## 🔧 Teknik Detaylar

### Android Intent Parametreleri:
- `scheme`: `documentscanner` - URL scheme
- `package`: `com.akylas.documentscanner` - Uygulama paketi
- `S.browser_fallback_url`: Play Store linki

### Fallback Mekanizması:
```javascript
setTimeout(() => {
    // 2 saniye bekle, uygulama açılmazsa fallback
    document.getElementById('cameraInput').click();
}, 2000);
```

## 📦 OSS-DocumentScanner Kurulumu

### Android:
- **[Play Store](https://play.google.com/store/apps/details?id=com.akylas.documentscanner)**
- **[F-Droid](https://f-droid.org/)** (Yakında)
- **[GitHub Releases](https://github.com/Akylas/OSS-DocumentScanner/releases)**

### iOS:
- **[App Store](https://apps.apple.com/)** (Arama: OSS Document Scanner)

## 🎨 Kullanıcı Deneyimi

### İlk Kullanım:
1. Kullanıcı butona basar
2. Play Store açılır
3. Toast mesajı: "📱 OSS-DocumentScanner bulunamadı, normal kamera açılıyor..."
4. 2 saniye sonra kamera açılır
5. Kullanıcı uygulamayı yüklemeyi tercih edebilir

### Sonraki Kullanımlar (Uygulama Yüklü):
1. Butona bas
2. OSS-DocumentScanner direkt açılır
3. Profesyonel tarama yap
4. Kaydet ve paylaş

## ⚙️ Özelleştirme

### Timeout Süresini Değiştirmek:
```javascript
setTimeout(() => {
    document.getElementById('cameraInput').click();
}, 2000); // 2000ms = 2 saniye
```

### Başka Bir Tarayıcı Uygulaması Eklemek:
```javascript
const intentUrl = 'intent://scan/#Intent;scheme=yourapp;package=com.your.app;end';
```

## 🐛 Sorun Giderme

### Uygulama Açılmıyor:
- ✅ Uygulamanın yüklü olduğundan emin ol
- ✅ Uygulama güncel mi kontrol et
- ✅ Browser izinlerini kontrol et

### Fallback Çalışmıyor:
- ✅ Kamera izni verilmiş mi kontrol et
- ✅ HTTPS bağlantısı kullanılıyor mu kontrol et
- ✅ Browser'ın güncel olduğundan emin ol

## 📊 Karşılaştırma

| Özellik | OSS-DocumentScanner | Normal Kamera |
|---------|---------------------|---------------|
| Kenar Algılama | ✅ Otomatik | ❌ Yok |
| Perspektif Düzeltme | ✅ Var | ❌ Yok |
| Filtreler | ✅ Çoklu | ❌ Yok |
| Çoklu Sayfa | ✅ Var | ❌ Yok |
| PDF Oluşturma | ✅ Var | ❌ Yok |
| OCR Kalitesi | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Kurulum | Gerekli | Gerekli Değil |
| Hız | Orta | Hızlı |

## 🔐 Güvenlik

- ✅ Açık kaynak uygulama (GitHub'da kod incelenebilir)
- ✅ Veriler cihazda kalır
- ✅ İnternet gerektirmez (offline çalışır)
- ✅ Reklam yok
- ✅ İzin israfı yok

## 🌟 Önerilen İş Akışı

**En İyi Kalite için:**
1. OSS-DocumentScanner yükle
2. "Belge Tara" butonu ile uygulama açılsın
3. Profesyonel tarama yap
4. Kaydet ve web sayfasına yükle
5. OCR otomatik çalışsın

**Hızlı İşlem için:**
1. Uygulama yükleme
2. Direkt normal kamera kullan
3. Hızlı OCR al

## 📞 Destek

### OSS-DocumentScanner:
- GitHub: https://github.com/Akylas/OSS-DocumentScanner
- Issues: https://github.com/Akylas/OSS-DocumentScanner/issues

### Web Entegrasyonu:
- Sorun yaşarsan browser konsolunu (F12) kontrol et
- Intent URL'lerinin çalıştığından emin ol

## 🎉 Sonuç

Artık web sayfandan **profesyonel belge tarayıcı uygulamasını** doğrudan açabilir ve yüksek kaliteli tarama yapabilirsin! Uygulama yoksa da endişelenme - normal kamera ile devam edebilirsin. 🚀
