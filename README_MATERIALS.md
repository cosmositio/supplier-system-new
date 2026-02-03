# Hammadde JSON Formatı

## 📦 materials.json Kullanımı

COA Arşiv sisteminde hammadde kodlarını yüklemek için JSON dosyası kullanabilirsiniz.

### JSON Formatı

```json
{
  "materials": [
    {
      "code": "STOK_KODU",
      "name": "STOK ADI"
    }
  ]
}
```

### Excel'den JSON Oluşturma

1. **Excel Sütunları:**
   - A sütunu: `Stok Kodu` (örn: MDE, SAH, K015120000STD000)
   - B sütunu: `Stok Adı` (örn: MANANGA DİSÜLFİT...)

2. **Excel'i JSON'a Çevirme:**
   - Ana sayfada Excel yükleyin
   - "Hammadde JSON İndir" butonuna tıklayın
   - İndirilen `materials.json` dosyasını COA Arşiv'de yükleyin

3. **Manuel JSON Oluşturma:**
```json
{
  "materials": [
    {"code": "MDE", "name": "MANANGA DİSÜLFİT ASETALDEHYDE DEPO"},
    {"code": "SAH", "name": "HAMMADDE ŞAHARANPUR DİSÜLFİT"},
    {"code": "K015120000STD000", "name": "STANDART HAMMADDE"}
  ]
}
```

### Alternatif Anahtarlar

Sistem şu anahtarları destekler:
- `code` veya `stockCode` veya `stokKodu`
- `name` veya `stockName` veya `stokAdı`

### Kullanım

1. COA Arşiv sayfasında "Hammadde Kodu" alanına tıklayın
2. Açılan listeden hammadde seçin veya arama yapın
3. Hammadde kodu otomatik doldurulur

### Mobil Kullanım

JSON dosyaları mobilde kolayca yüklenebilir:
1. JSON dosyasını cihazınıza indirin
2. COA Arşiv'de "Hammadde JSON" butonuna tıklayın
3. Dosyayı seçin
4. Listeler otomatik güncellenir ve localStorage'a kaydedilir
