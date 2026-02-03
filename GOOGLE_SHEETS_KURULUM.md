# 🚀 Google Sheets COA Entegrasyonu Kurulum Rehberi

## Adım 1: Google Sheet Oluştur

1. [Google Sheets](https://sheets.google.com) adresine git
2. **"+ Boş"** tıklayarak yeni bir tablo oluştur
3. Tabloya isim ver: **"COA Sertifikaları"**

## Adım 2: Sütun Başlıklarını Ekle

İlk satıra (A1'den başlayarak) şu başlıkları yaz:

```
id | supplierName | productName | lotNumber | certNumber | analysisDate | expiryDate | productionDate | status | notes | extractedText | imageUrl | parameters | createdAt | updatedAt
```

Yani:
- A1: `id`
- B1: `supplierName`
- C1: `productName`
- D1: `lotNumber`
- E1: `certNumber`
- F1: `analysisDate`
- G1: `expiryDate`
- H1: `productionDate`
- I1: `status`
- J1: `notes`
- K1: `extractedText`
- L1: `imageUrl`
- M1: `parameters`
- N1: `createdAt`
- O1: `updatedAt`

## Adım 3: Google Apps Script Oluştur

1. Google Sheet'te menüden: **Uzantılar → Apps Script**
2. Açılan editörde tüm kodu sil
3. Aşağıdaki kodu yapıştır:

```javascript
// COA API - Google Sheets Backend
const SHEET_NAME = 'Sayfa1'; // Türkçe Sheet adı, değiştirin gerekirse

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    switch(action) {
      case 'getAll':
        result = getAllRecords();
        break;
      case 'get':
        result = getRecord(e.parameter.id);
        break;
      case 'create':
        result = createRecord(JSON.parse(e.postData.contents));
        break;
      case 'update':
        result = updateRecord(e.parameter.id, JSON.parse(e.postData.contents));
        break;
      case 'delete':
        result = deleteRecord(e.parameter.id);
        break;
      default:
        result = { error: 'Geçersiz action' };
    }
  } catch(error) {
    result = { error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getAllRecords() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // id varsa
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        let value = data[i][j];
        // parameters JSON olarak parse et
        if (headers[j] === 'parameters' && value) {
          try {
            value = JSON.parse(value);
          } catch(e) {
            value = [];
          }
        }
        record[headers[j]] = value;
      }
      records.push(record);
    }
  }
  
  return { success: true, data: records };
}

function getRecord(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        let value = data[i][j];
        if (headers[j] === 'parameters' && value) {
          try {
            value = JSON.parse(value);
          } catch(e) {
            value = [];
          }
        }
        record[headers[j]] = value;
      }
      return { success: true, data: record };
    }
  }
  
  return { success: false, error: 'Kayıt bulunamadı' };
}

function createRecord(data) {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Yeni ID oluştur
  const lastRow = sheet.getLastRow();
  let newId = 1;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const maxId = Math.max(...ids.map(row => parseInt(row[0]) || 0));
    newId = maxId + 1;
  }
  
  data.id = newId;
  data.createdAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();
  
  // Parameters'ı JSON string'e çevir
  if (data.parameters && typeof data.parameters === 'object') {
    data.parameters = JSON.stringify(data.parameters);
  }
  
  const row = headers.map(header => data[header] || '');
  sheet.appendRow(row);
  
  return { success: true, id: newId, message: 'Kayıt oluşturuldu' };
}

function updateRecord(id, data) {
  const sheet = getSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      data.id = id;
      data.updatedAt = new Date().toISOString();
      data.createdAt = values[i][headers.indexOf('createdAt')]; // Eski createdAt'i koru
      
      // Parameters'ı JSON string'e çevir
      if (data.parameters && typeof data.parameters === 'object') {
        data.parameters = JSON.stringify(data.parameters);
      }
      
      const row = headers.map(header => data[header] !== undefined ? data[header] : values[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      
      return { success: true, message: 'Kayıt güncellendi' };
    }
  }
  
  return { success: false, error: 'Kayıt bulunamadı' };
}

function deleteRecord(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Kayıt silindi' };
    }
  }
  
  return { success: false, error: 'Kayıt bulunamadı' };
}

function getStats() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let total = 0, approved = 0, pending = 0, rejected = 0;
  const statusCol = data[0].indexOf('status');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      total++;
      const status = data[i][statusCol];
      if (status === 'approved') approved++;
      else if (status === 'pending') pending++;
      else if (status === 'rejected') rejected++;
    }
  }
  
  return { success: true, data: { total, approved, pending, rejected } };
}
```

4. **Kaydet** (Ctrl+S)
5. Projeye isim ver: "COA API"

## Adım 4: Web App Olarak Yayınla

1. **Dağıt → Yeni dağıtım**
2. Ayarlar:
   - **Tür:** Web uygulaması
   - **Açıklama:** COA API
   - **Şu şekilde yürüt:** Ben (kendi email adresiniz)
   - **Erişimi olan kişiler:** **Herkes** (önemli!)
3. **Dağıt** tıkla
4. **Erişime izin ver** → Google hesabınızı seçin → İzin ver
5. **Web uygulaması URL'sini kopyalayın!**

URL şöyle görünecek:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

## Adım 5: COA Sayfasına URL'yi Gir

1. `coa.html` dosyasını tarayıcıda aç
2. **⚙️ Ayarlar** sekmesine git
3. **Google Apps Script URL** alanına URL'yi yapıştır
4. **Bağlan** butonuna tıkla

---

## 📷 Fotoğraf Yükleme (Google Drive)

Fotoğrafları şu şekilde saklayacağız:
1. Fotoğraf yüklendiğinde **Base64** olarak geçici saklanır
2. Kaydet'e basıldığında otomatik **Google Drive'a yüklenir**
3. Drive linki Sheet'e kaydedilir

### Drive Klasörü Ayarlama:

1. [Google Drive](https://drive.google.com) aç
2. **"COA_Fotograflar"** adında klasör oluştur
3. Klasöre sağ tıkla → **Paylaş → Bağlantıyı kopyala**
4. Klasör ID'sini kopyala (URL'deki `/folders/` sonrası kısım)

Örnek URL: `https://drive.google.com/drive/folders/1ABC123xyz`
Klasör ID: `1ABC123xyz`

---

## ✅ Tamamlandı!

Artık:
- ✅ Tüm PC'lerden erişim
- ✅ Veriler Google Sheets'te
- ✅ Fotoğraflar Google Drive'da
- ✅ 15GB ücretsiz alan
- ✅ İstediğiniz zaman büyütebilirsiniz

## 🔧 Sorun Giderme

**"İzin hatası" alıyorsanız:**
- Apps Script'te "Herkes" erişimi seçtiğinizden emin olun
- Yeni dağıtım yapın

**"CORS hatası" alıyorsanız:**
- URL'nin sonunda `/exec` olduğundan emin olun
- Yeni dağıtım yapın

**Veriler görünmüyorsa:**
- Sheet adının "Sayfa1" olduğundan emin olun (veya Apps Script'te değiştirin)
- Sütun başlıklarını kontrol edin
