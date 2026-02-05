// ==========================================
// COA ARŞİV - Google Apps Script Backend
// Bu kodu Google Apps Script'e yapıştırın
// Version: 2.0 - Geliştirilmiş Dosya Yükleme
// ==========================================

// Sheet adı
const SHEET_NAME = 'COA_Arsiv';
const ALTERNATIVE_NAMES = ['COA Arşiv', 'COA_Arsiv', 'COA Arsiv', 'Sayfa1', 'Sheet1'];

// Ayarlar
const MAX_CHUNK_SIZE = 50000; // 50KB per chunk (Cache limiti: 100KB)
const CACHE_DURATION = 21600; // 6 saat

// ==================== Ana Fonksiyonlar ====================

// CORS Preflight Request Handler
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  let result;
  
  try {
    switch(action) {
      case 'test':
        result = testConnection();
        break;
      case 'getAllCOA':
        result = getAllCOA();
        break;
      case 'getCOA':
        result = getCOA(e.parameter.id);
        break;
      case 'searchCOA':
        result = searchCOA(e.parameter.query, e.parameter.field);
        break;
      case 'addCOA':
        // Data hem encoded hem düz gelebilir
        let addData = null;
        if (e.parameter.data) {
          try {
            // Önce düz JSON olarak dene
            addData = JSON.parse(e.parameter.data);
          } catch(parseErr) {
            try {
              // Encoded olarak dene
              addData = JSON.parse(decodeURIComponent(e.parameter.data));
            } catch(decodeErr) {
              result = { success: false, error: 'Data parse hatası: ' + parseErr.toString() };
              break;
            }
          }
        }
        result = addData ? addCOA(addData) : { success: false, error: 'Veri eksik' };
        break;
      case 'updateCOA':
        let updateData = null;
        if (e.parameter.data) {
          try {
            updateData = JSON.parse(e.parameter.data);
          } catch(parseErr) {
            try {
              updateData = JSON.parse(decodeURIComponent(e.parameter.data));
            } catch(decodeErr) {
              result = { success: false, error: 'Data parse hatası' };
              break;
            }
          }
        }
        result = updateData ? updateCOA(e.parameter.id, updateData) : { success: false, error: 'Veri eksik' };
        break;
      case 'deleteCOA':
        result = deleteCOA(e.parameter.id);
        break;
      case 'getStats':
        result = getStats();
        break;
      case 'uploadFile':
        result = uploadFileDirectly(e.parameter);
        break;
      case 'initUpload':
        result = initChunkUpload(e.parameter);
        break;
      case 'uploadChunk':
        result = uploadChunk(e.parameter);
        break;
      case 'finalizeUpload':
        result = finalizeUpload(e.parameter);
        break;
      case 'cancelUpload':
        result = cancelUpload(e.parameter.uploadId);
        break;
      case 'getUploadStatus':
        result = getUploadStatus(e.parameter.uploadId);
        break;
      case 'appendFileData':
        result = appendFileData(e.parameter.id, e.parameter.chunk, e.parameter.chunkIndex, e.parameter.totalChunks);
        break;
      case 'getTDS':
        result = getAllTDS();
        break;
      case 'getTemplates':
        result = getAllCOATemplates();
        break;
      case 'getTemplate':
        result = getCOATemplate(e.parameter.supplier);
        break;
      case 'saveTDS':
        let tdsData = null;
        if (e.parameter.data) {
          try {
            tdsData = JSON.parse(e.parameter.data);
          } catch(parseErr) {
            try {
              tdsData = JSON.parse(decodeURIComponent(e.parameter.data));
            } catch(decodeErr) {
              result = { success: false, error: 'TDS data parse hatası' };
              break;
            }
          }
        }
        result = tdsData ? saveTDS(e.parameter.materialCode, tdsData) : { success: false, error: 'Veri eksik' };
        break;
      case 'getCOARecords':
        result = getCOARecords();
        break;
      case 'saveCOARecord':
        // Yeni: COA kayıt satırlarını kaydet
        let coaRecordData = null;
        if (e.parameter.data) {
          try {
            coaRecordData = JSON.parse(e.parameter.data);
          } catch(parseErr) {
            try {
              coaRecordData = JSON.parse(decodeURIComponent(e.parameter.data));
            } catch(decodeErr) {
              result = { success: false, error: 'COA Record data parse hatası' };
              break;
            }
          }
        }
        result = coaRecordData ? saveCOARecord(coaRecordData) : { success: false, error: 'Veri eksik' };
        break;
      case 'getCOATemplate':
        result = getCOATemplate(e.parameter.supplier);
        break;
      case 'getAllCOATemplates':
        result = getAllCOATemplates();
        break;
      case 'deleteCOATemplate':
        result = deleteCOATemplate(e.parameter.supplier);
        break;
      default:
        result = { success: false, error: 'Geçersiz action: ' + action };
    }
  } catch(error) {
    result = { 
      success: false, 
      error: error.toString(),
      stack: error.stack,
      action: action
    };
    logError('doGet', error, e.parameter);
  }
  
  return createResponse(result, callback);
}

function doPost(e) {
  let result;
  let action = '';
  let callback = e.parameter.callback || '';
  
  try {
    action = e.parameter.action || '';
    let postData = {};
    
    if (e.postData) {
      const contentType = e.postData.type || '';
      
      if (contentType.includes('application/json')) {
        postData = JSON.parse(e.postData.contents);
      } else {
        // Form data parse
        postData = parseFormData(e.postData.contents);
      }
    }
    
    // Parameter'lardan da action alınabilir
    if (!action && postData.action) {
      action = postData.action;
    }
    
    // Callback postData'dan da gelebilir
    if (!callback && postData.callback) {
      callback = postData.callback;
    }
    
    // Data field'ı parse et
    if (postData.data && typeof postData.data === 'string') {
      try {
        postData.data = JSON.parse(postData.data);
      } catch(parseErr) {
        // Parse edilemezse olduğu gibi bırak
      }
    }
    
    switch(action) {
      case 'test':
        result = testConnection();
        break;
      case 'getAllCOA':
        result = getAllCOA();
        break;
      case 'addCOA':
        result = addCOA(postData.data || postData);
        break;
      case 'updateCOA':
        result = updateCOA(postData.id, postData.data || postData);
        break;
      case 'uploadFile':
        result = uploadFileDirectly(postData);
        break;
      case 'initUpload':
        result = initChunkUpload(postData);
        break;
      case 'uploadChunk':
        result = uploadChunk(postData);
        break;
      case 'finalizeUpload':
        result = finalizeUpload(postData);
        break;
      case 'addCOAWithFile':
        result = addCOAWithFile(postData);
        break;
      case 'saveTDS':
        let tdsPData = null;
        if (postData.data) {
          tdsPData = typeof postData.data === 'string' ? JSON.parse(postData.data) : postData.data;
        }
        result = tdsPData ? saveTDS(postData.materialCode, tdsPData) : { success: false, error: 'Veri eksik' };
        break;
      case 'saveCOARecord':
        let coaPData = null;
        if (postData.data) {
          coaPData = typeof postData.data === 'string' ? JSON.parse(postData.data) : postData.data;
        }
        result = coaPData ? saveCOARecord(coaPData) : { success: false, error: 'Veri eksik' };
        break;
      case 'saveTemplate':
        let templateData = null;
        if (postData.template) {
          templateData = typeof postData.template === 'string' ? JSON.parse(postData.template) : postData.template;
        } else if (e.parameter.template) {
          templateData = JSON.parse(e.parameter.template);
        }
        result = templateData ? saveCOATemplate(templateData) : { success: false, error: 'Template verisi eksik' };
        break;
      default:
        result = { success: false, error: 'Geçersiz POST action: ' + action };
    }
  } catch(error) {
    result = { 
      success: false, 
      error: error.toString(),
      stack: error.stack,
      action: action
    };
    logError('doPost', error, action);
  }
  
  return createResponse(result, callback);
}

// ==================== Yardımcı Fonksiyonlar ====================

function createResponse(result, callback) {
  const output = JSON.stringify(result);
  
  if (callback) {
    // JSONP response
    return ContentService.createTextOutput(callback + '(' + output + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  // JSON response with CORS headers
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseFormData(contents) {
  const postData = {};
  const params = contents.split('&');
  
  for (const param of params) {
    const idx = param.indexOf('=');
    if (idx > 0) {
      const key = decodeURIComponent(param.substring(0, idx));
      const value = decodeURIComponent(param.substring(idx + 1).replace(/\+/g, ' '));
      
      if (key === 'data' || key === 'recordData') {
        try {
          postData[key] = JSON.parse(value);
        } catch(e) {
          postData[key] = value;
        }
      } else {
        postData[key] = value;
      }
    }
  }
  
  return postData;
}

function testConnection() {
  try {
    const sheet = getSheet();
    const folder = getDriveFolder();
    
    return { 
      success: true, 
      message: 'Bağlantı başarılı!', 
      time: new Date().toISOString(),
      sheetName: sheet.getName(),
      folderName: folder.getName(),
      folderId: folder.getId()
    };
  } catch(error) {
    return { 
      success: false, 
      error: 'Bağlantı testi başarısız: ' + error.toString()
    };
  }
}

function logError(functionName, error, params) {
  try {
    console.error('[' + functionName + '] Error:', error.toString());
    console.error('Params:', JSON.stringify(params || {}));
    console.error('Stack:', error.stack);
  } catch(e) {
    // Loglama hatası önemsiz
  }
}

// ==================== Drive İşlemleri ====================

function getDriveFolder() {
  let folder;
  
  // Mevcut klasörü bul
  const folders = DriveApp.getFoldersByName('COA_Sertifikalar');
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    // Klasör yoksa oluştur
    folder = DriveApp.createFolder('COA_Sertifikalar');
  }
  
  // Herkese açık yap (görüntüleme)
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(e) {
    // Paylaşım ayarı zaten yapılmış olabilir
  }
  
  return folder;
}

function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    const folder = getDriveFolder();
    
    // Base64 prefix'i temizle
    let base64Content = base64Data;
    if (base64Data.includes(',')) {
      base64Content = base64Data.split(',')[1];
    }
    
    // Base64'ten blob oluştur
    const decoded = Utilities.base64Decode(base64Content);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    
    // Dosyayı Drive'a kaydet
    const file = folder.createFile(blob);
    
    // Herkese açık yap
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {
      // Paylaşım ayarı hatası
    }
    
    // URL'leri oluştur
    const fileId = file.getId();
    
    const fileSize = file.getSize(); // Gerçek dosya boyutu (bytes)
    
    return {
      success: true,
      fileId: fileId,
      viewUrl: 'https://drive.google.com/file/d/' + fileId + '/view',
      directUrl: 'https://drive.google.com/uc?export=view&id=' + fileId,
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
      fileName: fileName,
      fileSize: fileSize
    };
  } catch(error) {
    return { 
      success: false, 
      error: 'Drive yükleme hatası: ' + error.toString() 
    };
  }
}

function deleteFileFromDrive(fileId) {
  try {
    if (!fileId) return { success: true, message: 'Dosya ID boş' };
    
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    return { success: true, message: 'Dosya silindi' };
  } catch(error) {
    return { success: false, error: 'Dosya silinemedi: ' + error.toString() };
  }
}

// ==================== Direkt Dosya Yükleme (Küçük Dosyalar) ====================

function uploadFileDirectly(params) {
  const { fileData, fileName, mimeType, recordData } = params;
  
  if (!fileData || !fileName) {
    return { success: false, error: 'Dosya verisi veya adı eksik' };
  }
  
  // Boyut kontrolü (5MB limit for direct upload)
  const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
  const estimatedSize = base64Content.length * 0.75; // Base64 overhead
  
  if (estimatedSize > 5 * 1024 * 1024) {
    return { 
      success: false, 
      error: 'Dosya çok büyük. 5MB üzeri dosyalar için chunk upload kullanın.',
      useChunkUpload: true
    };
  }
  
  // Drive'a yükle
  const uploadResult = uploadFileToDrive(fileData, fileName, mimeType || 'application/octet-stream');
  
  if (!uploadResult.success) {
    return uploadResult;
  }
  
  // Kayıt verisi varsa Sheet'e ekle
  if (recordData) {
    const record = typeof recordData === 'string' ? JSON.parse(recordData) : recordData;
    record.fileUrl = uploadResult.viewUrl;
    record.driveFileId = uploadResult.fileId;
    record.fileName = fileName;
    record.fileType = mimeType;
    // fileData'yı Sheet'e KAYDETME - sadece Drive'da olsun
    delete record.fileData;
    
    const addResult = addCOA(record);
    if (!addResult.success) {
      return { 
        success: false, 
        error: 'Dosya yüklendi ama kayıt eklenemedi: ' + addResult.error,
        fileId: uploadResult.fileId
      };
    }
    
    return {
      success: true,
      message: 'COA kaydı ve dosya başarıyla eklendi',
      id: addResult.id,
      fileId: uploadResult.fileId,
      viewUrl: uploadResult.viewUrl
    };
  }
  
  return uploadResult;
}

// ==================== Chunk Upload İşlemleri (Büyük Dosyalar) ====================

function initChunkUpload(params) {
  const { fileName, mimeType, totalSize, totalChunks } = params;
  
  if (!fileName || !totalChunks) {
    return { success: false, error: 'Dosya adı ve chunk sayısı gerekli' };
  }
  
  // Benzersiz upload ID oluştur
  const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Upload metadata'sını cache'e kaydet
  const cache = CacheService.getScriptCache();
  const metadata = {
    fileName: fileName,
    mimeType: mimeType || 'application/octet-stream',
    totalSize: totalSize || 0,
    totalChunks: parseInt(totalChunks),
    receivedChunks: [],
    startTime: new Date().toISOString(),
    status: 'initialized'
  };
  
  cache.put('meta_' + uploadId, JSON.stringify(metadata), CACHE_DURATION);
  
  return {
    success: true,
    uploadId: uploadId,
    message: 'Upload başlatıldı',
    totalChunks: metadata.totalChunks,
    maxChunkSize: MAX_CHUNK_SIZE
  };
}

function uploadChunk(params) {
  const { uploadId, chunkIndex, totalChunks, chunk } = params;
  
  if (!uploadId || chunkIndex === undefined || !chunk) {
    return { success: false, error: 'Eksik parametreler: uploadId, chunkIndex ve chunk gerekli' };
  }
  
  const cache = CacheService.getScriptCache();
  const metaKey = 'meta_' + uploadId;
  const chunkKey = 'chunk_' + uploadId + '_' + chunkIndex;
  
  // Metadata kontrol
  const metaStr = cache.get(metaKey);
  if (!metaStr) {
    return { 
      success: false, 
      error: 'Upload oturumu bulunamadı veya süresi doldu. Lütfen yeniden başlatın.',
      expired: true
    };
  }
  
  let metadata;
  try {
    metadata = JSON.parse(metaStr);
  } catch(e) {
    return { success: false, error: 'Metadata parse hatası' };
  }
  
  // Chunk boyut kontrolü
  if (chunk.length > MAX_CHUNK_SIZE * 1.5) {
    return { 
      success: false, 
      error: 'Chunk çok büyük. Maksimum: ' + MAX_CHUNK_SIZE + ' karakter'
    };
  }
  
  // Chunk'ı kaydet
  try {
    cache.put(chunkKey, chunk, CACHE_DURATION);
  } catch(e) {
    return { 
      success: false, 
      error: 'Chunk kaydedilemedi: ' + e.toString(),
      chunkIndex: chunkIndex
    };
  }
  
  // Metadata güncelle
  const idx = parseInt(chunkIndex);
  if (!metadata.receivedChunks.includes(idx)) {
    metadata.receivedChunks.push(idx);
  }
  metadata.status = 'uploading';
  metadata.lastUpdate = new Date().toISOString();
  
  cache.put(metaKey, JSON.stringify(metadata), CACHE_DURATION);
  
  const total = totalChunks ? parseInt(totalChunks) : metadata.totalChunks;
  const progress = Math.round((metadata.receivedChunks.length / total) * 100);
  
  return {
    success: true,
    uploadId: uploadId,
    chunkIndex: idx,
    received: metadata.receivedChunks.length,
    total: total,
    progress: progress,
    isComplete: metadata.receivedChunks.length >= total
  };
}

function getUploadStatus(uploadId) {
  if (!uploadId) {
    return { success: false, error: 'Upload ID gerekli' };
  }
  
  const cache = CacheService.getScriptCache();
  const metaStr = cache.get('meta_' + uploadId);
  
  if (!metaStr) {
    return { success: false, error: 'Upload bulunamadı', expired: true };
  }
  
  const metadata = JSON.parse(metaStr);
  const progress = Math.round((metadata.receivedChunks.length / metadata.totalChunks) * 100);
  
  return {
    success: true,
    uploadId: uploadId,
    fileName: metadata.fileName,
    status: metadata.status,
    received: metadata.receivedChunks.length,
    total: metadata.totalChunks,
    progress: progress,
    missingChunks: getMissingChunks(metadata.receivedChunks, metadata.totalChunks)
  };
}

function getMissingChunks(receivedChunks, totalChunks) {
  const missing = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!receivedChunks.includes(i)) {
      missing.push(i);
    }
  }
  return missing;
}

function cancelUpload(uploadId) {
  if (!uploadId) {
    return { success: false, error: 'Upload ID gerekli' };
  }
  
  const cache = CacheService.getScriptCache();
  const metaStr = cache.get('meta_' + uploadId);
  
  if (metaStr) {
    const metadata = JSON.parse(metaStr);
    
    // Tüm chunk'ları sil
    const keysToDelete = ['meta_' + uploadId];
    for (let i = 0; i < metadata.totalChunks; i++) {
      keysToDelete.push('chunk_' + uploadId + '_' + i);
    }
    
    cache.removeAll(keysToDelete);
  }
  
  return { success: true, message: 'Upload iptal edildi' };
}

function finalizeUpload(params) {
  const { uploadId, fileName, mimeType, recordData } = params;
  
  if (!uploadId) {
    return { success: false, error: 'Upload ID gerekli' };
  }
  
  const cache = CacheService.getScriptCache();
  const metaKey = 'meta_' + uploadId;
  const metaStr = cache.get(metaKey);
  
  if (!metaStr) {
    return { 
      success: false, 
      error: 'Upload bulunamadı veya süre doldu. Lütfen yeniden yükleyin.',
      expired: true
    };
  }
  
  let metadata;
  try {
    metadata = JSON.parse(metaStr);
  } catch(e) {
    return { success: false, error: 'Metadata parse hatası' };
  }
  
  const totalChunks = metadata.totalChunks;
  
  // Eksik chunk kontrolü
  const missing = getMissingChunks(metadata.receivedChunks, totalChunks);
  if (missing.length > 0) {
    return { 
      success: false, 
      error: 'Eksik chunk\'lar var: ' + missing.join(', '),
      missingChunks: missing,
      received: metadata.receivedChunks.length,
      total: totalChunks
    };
  }
  
  // Tüm chunk'ları birleştir
  let fullBase64 = '';
  const chunkKeys = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = 'chunk_' + uploadId + '_' + i;
    chunkKeys.push(chunkKey);
  }
  
  // Chunk'ları toplu al (daha hızlı)
  const chunks = cache.getAll(chunkKeys);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = 'chunk_' + uploadId + '_' + i;
    const chunkData = chunks[chunkKey];
    
    if (!chunkData) {
      return { 
        success: false, 
        error: 'Chunk verisi alınamadı: ' + i,
        chunkIndex: i
      };
    }
    
    fullBase64 += chunkData;
  }
  
  // Drive'a yükle
  const finalFileName = fileName || metadata.fileName;
  const finalMimeType = mimeType || metadata.mimeType;
  
  const uploadResult = uploadFileToDrive(fullBase64, finalFileName, finalMimeType);
  
  if (!uploadResult.success) {
    return {
      success: false,
      error: 'Drive yükleme hatası: ' + uploadResult.error
    };
  }
  
  // Cache'i temizle
  try {
    cache.removeAll([metaKey, ...chunkKeys]);
  } catch(e) {
    // Temizleme hatası önemsiz
  }
  
  // Kayıt verisi varsa Sheet'e ekle
  if (recordData) {
    const record = typeof recordData === 'string' ? JSON.parse(recordData) : recordData;
    record.fileUrl = uploadResult.viewUrl;
    record.driveFileId = uploadResult.fileId;
    record.fileSize = uploadResult.fileSize; // Dosya boyutu (bytes)
    record.fileName = finalFileName;
    record.fileType = finalMimeType;
    // fileData'yı Sheet'e KAYDETME
    delete record.fileData;
    
    const addResult = addCOA(record);
    
    return {
      success: true,
      message: 'COA kaydı ve dosya başarıyla eklendi',
      id: addResult.id,
      fileId: uploadResult.fileId,
      viewUrl: uploadResult.viewUrl,
      directUrl: uploadResult.directUrl,
      thumbnailUrl: uploadResult.thumbnailUrl
    };
  }
  
  return {
    success: true,
    message: 'Dosya başarıyla yüklendi',
    fileId: uploadResult.fileId,
    viewUrl: uploadResult.viewUrl,
    directUrl: uploadResult.directUrl,
    thumbnailUrl: uploadResult.thumbnailUrl,
    fileName: finalFileName
  };
}

// Dosya ile birlikte COA kaydı ekle (tek seferde)
function addCOAWithFile(data) {
  const { fileData, fileName, mimeType, ...recordData } = data;
  
  if (fileData && fileName) {
    // Önce dosyayı yükle
    const uploadResult = uploadFileToDrive(fileData, fileName, mimeType || 'application/octet-stream');
    
    if (!uploadResult.success) {
      return { 
        success: false, 
        error: 'Dosya yüklenemedi: ' + uploadResult.error 
      };
    }
    
    // Kayıt verisine dosya bilgilerini ekle
    recordData.fileUrl = uploadResult.viewUrl;
    recordData.driveFileId = uploadResult.fileId;
    recordData.fileName = fileName;
    recordData.fileType = mimeType;
    recordData.fileSize = uploadResult.fileSize;
  }
  
  // Sheet'e kaydet (fileData olmadan)
  return addCOA(recordData);
}

// ==================== Sheet İşlemleri ====================

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Ana isim bulunamazsa alternatifleri dene
  if (!sheet) {
    for (const name of ALTERNATIVE_NAMES) {
      sheet = ss.getSheetByName(name);
      if (sheet) {
        // Eğer Sayfa1 veya Sheet1 bulunduysa, COA_Arsiv olarak yeniden adlandır
        if (name === 'Sayfa1' || name === 'Sheet1') {
          try {
            sheet.setName(SHEET_NAME);
            console.log('Sheet adı değiştirildi: ' + name + ' -> ' + SHEET_NAME);
          } catch(e) {
            console.log('Sheet adı değiştirilemedi:', e.toString());
          }
        }
        break;
      }
    }
  }
  
  // Hiçbir sheet bulunamazsa oluştur
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    console.log('Yeni sheet oluşturuldu: ' + SHEET_NAME);
  }
  
  // Header kontrolü - sheet boşsa veya header yoksa ekle
  const headers = ['id', 'supplier', 'materialCode', 'deliveryDate', 'deliveryNo', 'lotNumber', 'notes', 'location', 'fileName', 'fileType', 'fileUrl', 'driveFileId', 'fileData', 'fileSize', 'createdAt', 'updatedAt'];
  
  // İlk hücreyi kontrol et
  const firstCell = sheet.getRange(1, 1).getValue();
  
  if (sheet.getLastRow() === 0 || firstCell !== 'id') {
    // Header'ları ekle veya güncelle
    if (sheet.getLastRow() > 0 && firstCell && firstCell !== 'id') {
      // Mevcut veri var ama header yok - en üste satır ekle
      sheet.insertRowBefore(1);
    }
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    // Sütun genişliklerini ayarla
    sheet.setColumnWidth(1, 180); // id
    sheet.setColumnWidth(2, 150); // supplier
    sheet.setColumnWidth(3, 120); // materialCode
    sheet.setColumnWidth(4, 100); // deliveryDate
    sheet.setColumnWidth(5, 120); // deliveryNo
    sheet.setColumnWidth(6, 100); // lotNumber
    sheet.setColumnWidth(7, 200); // notes
    sheet.setColumnWidth(8, 150); // location
    sheet.setColumnWidth(12, 300); // fileUrl
    
    console.log('Header\'lar eklendi/güncellendi: ' + headers.join(', '));
  }
  
  return sheet;
}

function getHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function getAllCOA() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return { success: true, data: [], count: 0 };
    }
    
    const lastCol = sheet.getLastColumn();
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // id varsa
        const record = {};
        for (let j = 0; j < headers.length; j++) {
          // fileData dahil tüm alanları al
          record[headers[j]] = data[i][j];
        }
        records.push(record);
      }
    }
    
    // En yeniler başta
    records.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    return { success: true, data: records, count: records.length };
  } catch(error) {
    return { success: false, error: 'Veriler alınamadı: ' + error.toString() };
  }
}

function getCOA(id) {
  if (!id) {
    return { success: false, error: 'ID gerekli' };
  }
  
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        const record = {};
        for (let j = 0; j < headers.length; j++) {
          // fileData dahil tüm alanları al
          record[headers[j]] = data[i][j];
        }
        return { success: true, data: record };
      }
    }
    
    return { success: false, error: 'Kayıt bulunamadı: ' + id };
  } catch(error) {
    return { success: false, error: 'Kayıt alınamadı: ' + error.toString() };
  }
}

function searchCOA(query, field) {
  if (!query) {
    return getAllCOA();
  }
  
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return { success: true, data: [], count: 0 };
    }
    
    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const headers = data[0];
    const records = [];
    const searchQuery = query.toLowerCase();
    
    // Aranacak sütunları belirle
    const searchFields = field ? [field] : ['supplier', 'materialCode', 'lotNumber', 'notes'];
    const fieldIndices = searchFields.map(f => headers.indexOf(f)).filter(i => i >= 0);
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      let match = false;
      for (const idx of fieldIndices) {
        const value = (data[i][idx] || '').toString().toLowerCase();
        if (value.includes(searchQuery)) {
          match = true;
          break;
        }
      }
      
      if (match) {
        const record = {};
        for (let j = 0; j < headers.length; j++) {
          if (headers[j] !== 'fileData') {
            record[headers[j]] = data[i][j];
          }
        }
        records.push(record);
      }
    }
    
    records.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    return { success: true, data: records, count: records.length, query: query };
  } catch(error) {
    return { success: false, error: 'Arama hatası: ' + error.toString() };
  }
}

function addCOA(record) {
  if (!record) {
    return { success: false, error: 'Kayıt verisi gerekli' };
  }
  
  try {
    const sheet = getSheet();
    const headers = getHeaders(sheet);
    
    // ID oluştur
    if (!record.id) {
      record.id = 'coa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    // Tarihler
    const now = new Date().toISOString();
    if (!record.createdAt) {
      record.createdAt = now;
    }
    record.updatedAt = now;
    
    // fileSize'ı hesapla (eğer yoksa ve fileData varsa)
    if (!record.fileSize && record.fileData) {
      const base64Content = record.fileData.includes(',') ? record.fileData.split(',')[1] : record.fileData;
      record.fileSize = Math.ceil(base64Content.length * 0.75); // Base64'ten gerçek boyut
    }
    
    // fileData'yı Sheet'e kaydet (sıkıştırılmış halde geldi)
    // NOT: fileData silinmiyor, Sheets'e kaydediliyor
    
    // Satır verisini oluştur
    const row = headers.map(header => {
      const value = record[header];
      return value !== undefined ? value : '';
    });
    
    // Satırı ekle
    sheet.appendRow(row);
    
    return { 
      success: true, 
      id: record.id, 
      message: 'COA kaydı eklendi',
      timestamp: now
    };
  } catch(error) {
    return { success: false, error: 'Kayıt eklenemedi: ' + error.toString() };
  }
}

// Dosya verisini chunk olarak ekle/birleştir
function appendFileData(id, chunk, chunkIndex, totalChunks) {
  if (!id || chunk === undefined) {
    return { success: false, error: 'ID ve chunk gerekli' };
  }
  
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // fileData sütununu bul (büyük/küçük harf duyarsız)
    let fileDataCol = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase() === 'filedata') {
        fileDataCol = i;
        break;
      }
    }
    
    if (fileDataCol < 0) {
      return { success: false, error: 'fileData sütunu bulunamadı. Mevcut sütunlar: ' + headers.join(', ') };
    }
    
    // Kaydı bul
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        // Mevcut fileData'yı al
        let currentFileData = data[i][fileDataCol] || '';
        
        // Chunk'ı ekle
        const idx = parseInt(chunkIndex);
        const total = parseInt(totalChunks);
        
        // İlk chunk ise sıfırla
        if (idx === 0) {
          currentFileData = chunk;
        } else {
          currentFileData += chunk;
        }
        
        // fileData hücresini güncelle
        sheet.getRange(i + 1, fileDataCol + 1).setValue(currentFileData);
        
        const isComplete = (idx + 1) >= total;
        
        return { 
          success: true, 
          message: isComplete ? 'Dosya yükleme tamamlandı' : 'Chunk eklendi',
          chunkIndex: idx,
          totalChunks: total,
          currentSize: currentFileData.length,
          isComplete: isComplete
        };
      }
    }
    
    return { success: false, error: 'Kayıt bulunamadı: ' + id };
  } catch(error) {
    return { success: false, error: 'Chunk ekleme hatası: ' + error.toString() };
  }
}

function updateCOA(id, newData) {
  if (!id) {
    return { success: false, error: 'ID gerekli' };
  }
  
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const driveFileIdCol = headers.indexOf('driveFileId');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        // Eğer yeni dosya yükleniyorsa (yeni driveFileId varsa), eski dosyayı Drive'dan sil
        if (newData.driveFileId && driveFileIdCol >= 0) {
          const oldDriveFileId = data[i][driveFileIdCol];
          
          // Eski ve yeni dosya farklıysa, eski dosyayı sil
          if (oldDriveFileId && oldDriveFileId !== newData.driveFileId) {
            try {
              deleteFileFromDrive(oldDriveFileId);
              console.log('Eski dosya silindi: ' + oldDriveFileId);
            } catch(deleteErr) {
              console.log('Eski dosya silinemedi (önemsiz): ' + deleteErr.toString());
            }
          }
        }
        
        // fileData yoksa mevcut değeri koru, varsa güncelle
        // Diğer alanları güncelle
        newData.updatedAt = new Date().toISOString();
        
        // Eğer yeni dosya yükleniyorsa, fileSize'ı hesapla
        if (newData.hasOwnProperty('fileData') && newData.fileData && !newData.fileSize) {
          const base64Content = newData.fileData.includes(',') ? newData.fileData.split(',')[1] : newData.fileData;
          newData.fileSize = Math.ceil(base64Content.length * 0.75);
        }
        
        // Mevcut veriyi güncelle
        const row = headers.map((header, j) => {
          // fileData özel durumu: frontend'ten gelmemişse mevcut değeri koru
          if (header === 'fileData') {
            return newData.hasOwnProperty('fileData') && newData.fileData ? newData.fileData : data[i][j];
          }
          // fileSize özel durumu: yeni fileData varsa güncelle
          if (header === 'fileSize') {
            return newData.hasOwnProperty('fileSize') && newData.fileSize ? newData.fileSize : data[i][j];
          }
          // Normal alanlar: yeni veri varsa güncelle, yoksa mevcut değeri koru
          if (newData.hasOwnProperty(header) && header !== 'id' && header !== 'createdAt') {
            return newData[header] !== undefined ? newData[header] : data[i][j];
          }
          return data[i][j];
        });
        
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
        return { success: true, message: 'Kayıt güncellendi', id: id };
      }
    }
    
    return { success: false, error: 'Kayıt bulunamadı: ' + id };
  } catch(error) {
    return { success: false, error: 'Güncelleme hatası: ' + error.toString() };
  }
}

function deleteCOA(id) {
  if (!id) {
    return { success: false, error: 'ID gerekli' };
  }
  
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const driveFileIdCol = headers.indexOf('driveFileId');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        // Drive'daki dosyayı da sil
        if (driveFileIdCol >= 0 && data[i][driveFileIdCol]) {
          deleteFileFromDrive(data[i][driveFileIdCol]);
        }
        
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Kayıt ve dosya silindi', id: id };
      }
    }
    
    return { success: false, error: 'Kayıt bulunamadı: ' + id };
  } catch(error) {
    return { success: false, error: 'Silme hatası: ' + error.toString() };
  }
}

function getStats() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return { success: true, data: { total: 0, suppliers: 0, thisMonth: 0, thisWeek: 0 } };
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const headers = getHeaders(sheet);
    
    const supplierCol = headers.indexOf('supplier');
    const dateCol = headers.indexOf('deliveryDate');
    const createdCol = headers.indexOf('createdAt');
    const fileSizeCol = headers.indexOf('fileSize');
    
    const suppliers = new Set();
    let thisMonth = 0;
    let thisWeek = 0;
    let totalFileSize = 0;
    
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) {
        // Tedarikçiler
        if (supplierCol >= 0 && data[i][supplierCol]) {
          suppliers.add(data[i][supplierCol].toString().trim());
        }
        
        // Dosya boyutu (bytes)
        if (fileSizeCol >= 0 && data[i][fileSizeCol]) {
          const size = parseInt(data[i][fileSizeCol]);
          if (!isNaN(size)) {
            totalFileSize += size;
          }
        }
        
        // Bu ay eklenenler
        const createdDate = createdCol >= 0 ? data[i][createdCol] : null;
        if (createdDate) {
          const dateStr = createdDate.toString();
          if (dateStr.startsWith(currentMonth)) {
            thisMonth++;
          }
          
          // Bu hafta eklenenler
          try {
            const created = new Date(createdDate);
            if (created >= weekAgo) {
              thisWeek++;
            }
          } catch(e) {}
        }
      }
    }
    
    return { 
      success: true, 
      data: { 
        total: data.filter(r => r[0]).length, 
        suppliers: suppliers.size, 
        thisMonth: thisMonth,
        thisWeek: thisWeek,
        totalFileSize: totalFileSize,
        totalFileSizeMB: (totalFileSize / (1024 * 1024)).toFixed(2),
        supplierList: Array.from(suppliers).sort()
      } 
    };
  } catch(error) {
    return { success: false, error: 'İstatistik hatası: ' + error.toString() };
  }
}

// ==================== Test Fonksiyonları ====================

function testAPI() {
  console.log('=== COA API Test Başlıyor ===');
  console.log('Zaman: ' + new Date().toISOString());
  
  // 1. Bağlantı testi
  const connTest = testConnection();
  console.log('1. Bağlantı testi:', JSON.stringify(connTest));
  
  if (!connTest.success) {
    console.log('HATA: Bağlantı başarısız!');
    return;
  }
  
  // 2. Sheet kontrol
  const sheet = getSheet();
  console.log('2. Sheet adı:', sheet.getName());
  console.log('   Satır sayısı:', sheet.getLastRow());
  
  // 3. Test kaydı ekle
  const testRecord = {
    supplier: 'Test Tedarikçi ' + Date.now(),
    materialCode: 'TEST-001',
    deliveryDate: new Date().toISOString().split('T')[0],
    lotNumber: 'LOT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    notes: 'Otomatik test kaydı'
  };
  
  const addResult = addCOA(testRecord);
  console.log('3. Kayıt ekleme:', JSON.stringify(addResult));
  
  // 4. Tüm kayıtları al
  const allResult = getAllCOA();
  console.log('4. Toplam kayıt:', allResult.count);
  
  // 5. Arama testi
  const searchResult = searchCOA('Test', 'supplier');
  console.log('5. Arama sonucu:', searchResult.count, 'kayıt bulundu');
  
  // 6. İstatistikler
  const stats = getStats();
  console.log('6. İstatistikler:', JSON.stringify(stats.data));
  
  // 7. Drive klasör kontrolü
  const folder = getDriveFolder();
  console.log('7. Drive klasörü:', folder.getName(), '- ID:', folder.getId());
  
  console.log('=== Test Tamamlandı ===');
  
  return {
    connection: connTest.success,
    sheetName: sheet.getName(),
    totalRecords: allResult.count,
    stats: stats.data,
    folderId: folder.getId()
  };
}

function testUpload() {
  console.log('=== Upload Test Başlıyor ===');
  
  // Küçük bir test dosyası oluştur (1x1 pixel şeffaf PNG)
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const fileName = 'test_' + Date.now() + '.png';
  
  // Direkt upload test
  const result = uploadFileToDrive(testBase64, fileName, 'image/png');
  console.log('Upload sonucu:', JSON.stringify(result));
  
  if (result.success) {
    console.log('Dosya görüntüleme linki:', result.viewUrl);
    
    // Dosyayı sil (test için)
    const deleteResult = deleteFileFromDrive(result.fileId);
    console.log('Silme sonucu:', JSON.stringify(deleteResult));
  }
  
  console.log('=== Upload Test Tamamlandı ===');
  return result;
}

// ==================== Kurulum ve Yardım ====================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('COA Arşiv')
    .addItem('API Testi Çalıştır', 'testAPI')
    .addItem('Upload Testi', 'testUpload')
    .addSeparator()
    .addItem('Yardım', 'showHelp')
    .addToUi();
}

function showHelp() {
  const html = HtmlService.createHtmlOutput(`
    <h2>COA Arşiv API</h2>
    <h3>Kurulum:</h3>
    <ol>
      <li>Dağıt → Yeni dağıtım</li>
      <li>Tür: Web uygulaması</li>
      <li>Yürütme: Ben</li>
      <li>Erişim: Herkes</li>
      <li>URL'yi kopyala</li>
    </ol>
    <h3>API Endpoints:</h3>
    <ul>
      <li><b>test</b> - Bağlantı testi</li>
      <li><b>getAllCOA</b> - Tüm kayıtlar</li>
      <li><b>getCOA</b> - Tek kayıt (id gerekli)</li>
      <li><b>searchCOA</b> - Arama (query, field)</li>
      <li><b>addCOA</b> - Kayıt ekle</li>
      <li><b>updateCOA</b> - Kayıt güncelle</li>
      <li><b>deleteCOA</b> - Kayıt sil</li>
      <li><b>getStats</b> - İstatistikler</li>
      <li><b>uploadFile</b> - Dosya yükle (küçük)</li>
      <li><b>initUpload</b> - Chunk upload başlat</li>
      <li><b>uploadChunk</b> - Chunk gönder</li>
      <li><b>finalizeUpload</b> - Upload tamamla</li>
    </ul>
    <p><b>Not:</b> Her kod değişikliğinde YENİ dağıtım yapın!</p>
  `)
  .setWidth(400)
  .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'COA Arşiv Yardım');
}

// ==================== TDS Yönetimi ====================

const TDS_SHEET_NAME = 'TDS_Definitions';

// TDS sheet'ini al veya oluştur
function getTDSSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TDS_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(TDS_SHEET_NAME);
    // Başlık satırı
    sheet.getRange(1, 1, 1, 3).setValues([['Hammadde Kodu', 'TDS Verisi (JSON)', 'Güncelleme Tarihi']]);
    sheet.getRange(1, 1, 1, 3).setBackground('#4CAF50').setFontColor('white').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// Tüm TDS verilerini getir
function getAllTDS() {
  try {
    const sheet = getTDSSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return { success: true, data: {} };
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    const tdsData = {};
    
    data.forEach(row => {
      const materialCode = row[0];
      const jsonData = row[1];
      
      if (materialCode && jsonData) {
        try {
          tdsData[materialCode] = JSON.parse(jsonData);
        } catch(e) {
          Logger.log('Parse hatası: ' + materialCode);
        }
      }
    });
    
    return { success: true, data: tdsData };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// TDS verisini kaydet
function saveTDS(materialCode, tdsProperties) {
  try {
    const sheet = getTDSSheet();
    const lastRow = sheet.getLastRow();
    
    // Mevcut satırı bul
    let rowIndex = -1;
    if (lastRow >= 2) {
      const codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < codes.length; i++) {
        if (codes[i][0] === materialCode) {
          rowIndex = i + 2; // +2 çünkü başlık var ve 1-indexed
          break;
        }
      }
    }
    
    const now = new Date().toLocaleString('tr-TR');
    const jsonData = JSON.stringify({ properties: tdsProperties });
    
    if (rowIndex > 0) {
      // Güncelle
      sheet.getRange(rowIndex, 2).setValue(jsonData);
      sheet.getRange(rowIndex, 3).setValue(now);
    } else {
      // Yeni ekle
      sheet.appendRow([materialCode, jsonData, now]);
    }
    
    return { success: true, message: 'TDS kaydedildi: ' + materialCode };
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// COA Records Sheet'i al/oluştur
function getCOARecordsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('COA_Records');
  
  if (!sheet) {
    // Yeni sekme oluştur
    sheet = ss.insertSheet('COA_Records');
    
    // Başlıklar
    const headers = [
      'Tarih',
      'İrsaliye No',
      'Lot No',
      'Malzeme Kodu',
      'Tedarikçi',
      'Lokasyon',
      'Özellik Adı',
      'Birim',
      'Test Standardı',
      'Operatör',
      'Standart Değer',
      'Alt Limit',
      'Üst Limit',
      'Requirement',
      'COA Değeri',
      'Durum',
      'Kayıt Zamanı'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Başlık formatla
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285f4')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    
    // Sütun genişlikleri
    sheet.setColumnWidth(1, 100);  // Tarih
    sheet.setColumnWidth(2, 120);  // İrsaliye
    sheet.setColumnWidth(3, 100);  // Lot
    sheet.setColumnWidth(4, 100);  // Kod
    sheet.setColumnWidth(5, 150);  // Tedarikçi
    sheet.setColumnWidth(6, 150);  // Özellik
    sheet.setColumnWidth(7, 100);  // COA
    sheet.setColumnWidth(8, 80);   // Birim
    sheet.setColumnWidth(9, 100);  // Test Standardı
    sheet.setColumnWidth(10, 70);  // Operatör
    sheet.setColumnWidth(11, 100); // Standart Değer
    sheet.setColumnWidth(12, 80);  // Alt Limit
    sheet.setColumnWidth(13, 80);  // Üst Limit
    sheet.setColumnWidth(14, 150); // Requirement
    sheet.setColumnWidth(15, 80);  // COA Değeri
    sheet.setColumnWidth(16, 80);  // Durum
    sheet.setColumnWidth(17, 150); // Kayıt
    
    // Freeze başlık
    sheet.setFrozenRows(1);
    
    Logger.log('COA_Records sekmesi oluşturuldu');
  }
  
  return sheet;
}

// COA kayıtlarını satır bazlı kaydet
function saveCOARecord(data) {
  try {
    const sheet = getCOARecordsSheet();
    
    // data: { date, deliveryNo, lotNumber, materialCode, supplier, location, properties: [{name, coaValue, unit, standard, operator, standardValue, min, max, status}] }
    
    const now = new Date().toLocaleString('tr-TR');
    const rows = [];
    
    // Her özellik için ayrı satır oluştur
    data.properties.forEach(prop => {
      rows.push([
        data.date || '',
        data.deliveryNo || '',
        data.lotNumber || '',
        data.materialCode || '',
        data.supplier || '',
        data.location || '',
        prop.name || '',
        prop.unit || '',
        prop.standard || '',
        prop.operator || '',
        prop.standardValue || '',
        prop.min || '',
        prop.max || '',
        prop.requirement || '',  // Yeni: Compliance mode için
        prop.coaValue || '',
        prop.status || '',
        now
      ]);
    });
    
    // Tüm satırları ekle
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 17).setValues(rows);
    }
    
    return { 
      success: true, 
      message: `${rows.length} COA kaydı eklendi`,
      recordCount: rows.length
    };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// COA kayıtlarını getir (analiz için)
function getCOARecords() {
  try {
    const sheet = getCOARecordsSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const headers = data[0];
    const records = [];
    
    // Header'lardan index'leri bul (dinamik mapping)
    const getColIndex = (name) => {
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].toString().toLowerCase().includes(name.toLowerCase())) {
          return i;
        }
      }
      return -1;
    };
    
    const dateIdx = getColIndex('Tarih');
    const deliveryNoIdx = getColIndex('İrsaliye');
    const lotIdx = getColIndex('Lot');
    const materialIdx = getColIndex('Malzeme');
    const supplierIdx = getColIndex('Tedarikçi');
    const locationIdx = getColIndex('Lokasyon');
    const propertyIdx = getColIndex('Özellik');
    const unitIdx = getColIndex('Birim');
    const standardIdx = getColIndex('Standart');
    const operatorIdx = getColIndex('Operatör');
    const stdValueIdx = getColIndex('Standart Değer');
    const minIdx = getColIndex('Alt Limit');
    const maxIdx = getColIndex('Üst Limit');
    const coaValueIdx = getColIndex('COA');
    const statusIdx = getColIndex('Durum');
    const timestampIdx = getColIndex('Kayıt');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      records.push({
        date: dateIdx >= 0 ? (row[dateIdx] || '') : '',
        deliveryNo: deliveryNoIdx >= 0 ? (row[deliveryNoIdx] || '') : '',
        lotNumber: lotIdx >= 0 ? (row[lotIdx] || '') : '',
        materialCode: materialIdx >= 0 ? (row[materialIdx] || '') : '',
        supplier: supplierIdx >= 0 ? (row[supplierIdx] || '') : '',
        location: locationIdx >= 0 ? (row[locationIdx] || '') : '',
        propertyName: propertyIdx >= 0 ? (row[propertyIdx] || '') : '',
        unit: unitIdx >= 0 ? (row[unitIdx] || '') : '',
        standard: standardIdx >= 0 ? (row[standardIdx] || '') : '',
        operator: operatorIdx >= 0 ? (row[operatorIdx] || '') : '',
        standardValue: stdValueIdx >= 0 ? (row[stdValueIdx] || '') : '',
        minLimit: minIdx >= 0 ? (row[minIdx] || '') : '',
        maxLimit: maxIdx >= 0 ? (row[maxIdx] || '') : '',
        coaValue: coaValueIdx >= 0 ? (row[coaValueIdx] || '') : '',
        status: statusIdx >= 0 ? (row[statusIdx] || '') : '',
        timestamp: timestampIdx >= 0 ? (row[timestampIdx] || '') : ''
      });
    }
    
    return { success: true, data: records };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== COA Template Functions ====================

/**
 * Save COA Template
 */
function saveCOATemplate(templateData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('COA_Templates');
    
    // Create sheet if doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('COA_Templates');
      sheet.appendRow(['Supplier', 'Version', 'Created At', 'Template JSON']);
      sheet.getRange('A1:D1').setBackground('#2c5f2d').setFontColor('#ffffff').setFontWeight('bold');
    }
    
    // Check if template already exists for this supplier
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateData.supplier) {
        rowIndex = i + 1; // +1 because array is 0-indexed but sheet is 1-indexed
        break;
      }
    }
    
    const templateJson = JSON.stringify(templateData);
    
    if (rowIndex > 0) {
      // Update existing template
      sheet.getRange(rowIndex, 1, 1, 4).setValues([[
        templateData.supplier,
        templateData.version,
        templateData.createdAt,
        templateJson
      ]]);
    } else {
      // Add new template
      sheet.appendRow([
        templateData.supplier,
        templateData.version,
        templateData.createdAt,
        templateJson
      ]);
    }
    
    return { 
      success: true, 
      message: 'Template saved successfully',
      supplier: templateData.supplier
    };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get COA Template by supplier name
 */
function getCOATemplate(supplierName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('COA_Templates');
    
    if (!sheet) {
      return { success: false, error: 'Templates sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === supplierName.toLowerCase()) {
        const template = JSON.parse(data[i][3]);
        return { success: true, data: template };
      }
    }
    
    return { success: false, error: 'Template not found for supplier: ' + supplierName };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all COA Templates
 */
function getAllCOATemplates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('COA_Templates');
    
    if (!sheet) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const templates = [];
    
    for (let i = 1; i < data.length; i++) {
      templates.push({
        supplier: data[i][0],
        version: data[i][1],
        createdAt: data[i][2],
        template: JSON.parse(data[i][3])
      });
    }
    
    return { success: true, data: templates };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Delete COA Template
 */
function deleteCOATemplate(supplierName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('COA_Templates');
    
    if (!sheet) {
      return { success: false, error: 'Templates sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === supplierName.toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Template deleted successfully' };
      }
    }
    
    return { success: false, error: 'Template not found' };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== Kurulum Talimatları ====================
/*
╔════════════════════════════════════════════════════════════════╗
║                    COA ARŞİV API v2.0                          ║
║                  Kurulum Talimatları                           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Google Sheets aç: https://sheets.google.com                ║
║  2. Yeni bir Spreadsheet oluştur                               ║
║  3. Menüden: Uzantılar → Apps Script                           ║
║  4. Bu kodun TAMAMINI yapıştır                                 ║
║  5. Kaydet (Ctrl+S)                                            ║
║  6. testAPI() fonksiyonunu çalıştır (izinleri onaylamak için)  ║
║  7. Dağıt → Yeni dağıtım:                                      ║
║     - Tür: Web uygulaması                                      ║
║     - Yürütme: Ben (your email)                                ║
║     - Erişim: Herkes (anonim dahil)                            ║
║  8. "Dağıt" butonuna bas                                       ║
║  9. Web uygulaması URL'sini kopyala                            ║
║  10. coa-arsiv.html'de bu URL'yi ayarla                        ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  ÖNEMLİ NOTLAR:                                                ║
║  • Her kod değişikliğinde YENİ DAĞITIM yapın!                  ║
║  • Mevcut dağıtımı güncellemeyin, yeni oluşturun               ║
║  • Drive'da "COA_Sertifikalar" klasörü otomatik oluşur         ║
║  • fileData Sheet'e KAYDEDİLMEZ, sadece Drive'da tutulur       ║
║  • Chunk upload 50KB parçalar halinde çalışır                  ║
║  • Cache süresi 6 saattir                                      ║
╚════════════════════════════════════════════════════════════════╝
*/
