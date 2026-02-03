# Hesaplamalar Çalışmıyor - Çözüm Rehberi

## Sorun Nedir?
Dosya yüklendikten sonra hiçbir hesaplama gösterilmiyor ve tablo boş kalıyor.

## Olası Nedenler
1. **Dosya sütun adları uyuşmuyor** - Excel dosyasındaki sütun başlıkları uygulamanın aradığı isimlerle eşleşmiyor
2. **Eksik sütunlar** - Dosyada "Sevk", "İade" veya "Hata" sütunları yok

## Çözüm Adımları

### 1. Dosya Yapınızı Kontrol Edin
Tarayıcınızda `debug.html` dosyasını açın:
- Dosyayı sürükle-bırak yöntemiyle yükleyin
- Mevcut sütun adlarını göreceksiniz
- Hangi sütunların tanındığını kontrol edin

### 2. Gerekli Sütunlar
Dosyada bu sütunların **olması gerekir**:
- ✅ **Tedarikçi** sütunu (adı: "Tedarikçi", "Firma", "Supplier" v.b.)
- ✅ **Sevk** sütunları (adı: "Sevk", "Sevkiyat", "Shipment" v.b.)
- ✅ **İade** sütunları (adı: "İade", "Return" v.b.)
- ✅ **Hata** sütunları (adı: "Hata", "Error", "Defect" v.b.)

### 3. Ay Bilgisi
Sevk, İade ve Hata sütunlarında ay bilgisi olmalıdır:
- Sütun adında sayı: "1 Sevk", "Sevk 1", "Sevk (1)" vb.
- Sütun adında ay ismi: "Ocak Sevk", "Sevk Şubat" vb.
- **Veya** Sütun başlığının kendisi 1-12 arası sayı olmalıdır

### 4. Örnek Dosya Yapısı

```
Tedarikçi | Durum    | 1 Sevk | 1 İade | 1 Hata | 2 Sevk | 2 İade | 2 Hata | ...
-----------|----------|--------|--------|--------|--------|--------|--------|
A Firma   | ONAYLI   | 1000   | 5      | 2      | 1100   | 6      | 3      | ...
B Şirketi | ONAYLI   | 2000   | 10     | 1      | 2100   | 12     | 2      | ...
```

**Ya da:**

```
Tedarikçi | Durum    | Ocak Sevk | Ocak İade | Ocak Hata | Şubat Sevk | ...
-----------|----------|-----------|-----------|-----------|------------|
A Firma   | ONAYLI   | 1000      | 5         | 2         | 1100       | ...
B Şirketi | ONAYLI   | 2000      | 10        | 1         | 2100       | ...
```

## İsim Kuralları

Uygulama **şu yazımları anlar** (büyük-küçük harf farkı yok):
- Tedarikçi: "tedarikçi", "firma", "supplier", "company"
- Sevk: "sevk", "sevkiyat", "shipment"
- İade: "iade", "return"
- Hata: "hata", "error", "defect"
- Durum: "durum", "status"

## Dosya Hazırlama Kontrol Listesi

- [ ] Excel dosyasında "Tedarikçi" sütunu var mı?
- [ ] "Sevk" sütunları var mı? (en az bir tane)
- [ ] "İade" sütunları var mı? (en az bir tane)
- [ ] "Hata" sütunları var mı? (en az bir tane)
- [ ] Her sütunun başlığında ay numarası var mı? (1-12)
- [ ] Sütun adlarında yazım hatası var mı?
- [ ] Dosya Excel formatında (.xlsx) mi?

## Hızlı Tanılama

1. `index.html` dosyasını aç
2. Excel dosyasını yükle
3. Tarayıcıda **F12** tuşuna bas (Developer Tools)
4. **Console** sekmesini aç
5. Şu satırları arayın:
   ```
   Sevk sütunları: X
   İade sütunları: Y
   Hata sütunları: Z
   ```
   Eğer hepsi 0 ise, sütun adlarını kontrol et!

## Yardım

Hâlâ sorun yaşıyorsanız:
1. debug.html dosyasını açarak Excel yapısını detaylı kontrol edin
2. Konsol hatasını (+F12 > Console) raporlayın
3. Excel dosya örneğini kontrol edin
