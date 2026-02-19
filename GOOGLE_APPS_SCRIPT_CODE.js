// ==========================================
// COA ARŞİV - Google Apps Script Backend
// Bu kodu Google Apps Script'e yapıştırın
// Version: 2.1 - JSONP + CORS Tam Desteği
// Deploy Date: 05.02.2026
// ==========================================

// Sheet adı
const SHEET_NAME = 'COA_Arsiv';
const ALTERNATIVE_NAMES = ['COA Arşiv', 'COA_Arsiv', 'COA Arsiv', 'Sayfa1', 'Sheet1'];

// Ayarlar
const MAX_CHUNK_SIZE = 50000; // 50KB per chunk (Cache limiti: 100KB)
const CACHE_DURATION = 21600; // 6 saat

// ==================== Ana Fonksiyonlar ====================

// CORS Preflight Request Handler - Not needed for JSONP
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
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
      case 'deleteCOARecord':
        result = deleteCOARecord(e.parameter.materialCode, e.parameter.deliveryDate, e.parameter.deliveryNo);
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
      case 'saveCOARecordsBatch':
        // TOPLU: Birden fazla COA'nın kayıtlarını tek seferde kaydet
        let batchData = null;
        if (e.parameter.data) {
          try {
            batchData = JSON.parse(e.parameter.data);
          } catch(parseErr) {
            try {
              batchData = JSON.parse(decodeURIComponent(e.parameter.data));
            } catch(decodeErr) {
              result = { success: false, error: 'Batch data parse hatası' };
              break;
            }
          }
        }
        result = batchData ? saveCOARecordsBatch(batchData) : { success: false, error: 'Veri eksik' };
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
      case 'updateCOARecordByID':
        // Yeni: ID'ye göre tek satır güncelle
        let updateRecordData = null;
        if (e.parameter.data) {
          try {
            updateRecordData = JSON.parse(e.parameter.data);
          } catch(parseErr) {
            try {
              updateRecordData = JSON.parse(decodeURIComponent(e.parameter.data));
            } catch(decodeErr) {
              result = { success: false, error: 'Update data parse hatası' };
              break;
            }
          }
        }
        result = updateRecordData ? updateCOARecordByID(e.parameter.id, updateRecordData) : { success: false, error: 'Veri eksik' };
        break;
      case 'deleteCOARecordByID':
        // Yeni: ID'ye göre tek satır sil
        result = deleteCOARecordByID(e.parameter.id);
        break;
      case 'getCOATemplate':
        result = getCOATemplate(e.parameter.supplier);
        break;
      case 'getAllCOATemplates':
        result = getAllCOATemplates();
        break;
      case 'getTemplateImage':
        result = getTemplateImage(e.parameter.fileId);
        break;
      case 'deleteCOATemplate':
        result = deleteCOATemplate(e.parameter.supplier);
        break;
      case 'saveTemplate':
        let templateParam = null;
        if (e.parameter.template) {
          try {
            templateParam = JSON.parse(e.parameter.template);
          } catch(parseErr) {
            try {
              templateParam = JSON.parse(decodeURIComponent(e.parameter.template));
            } catch(decodeErr) {
              result = { success: false, error: 'Template parse hatası' };
              break;
            }
          }
        }
        result = templateParam ? saveCOATemplate(templateParam) : { success: false, error: 'Template verisi eksik' };
        break;
      case 'collectAllFiles':
        result = collectAllCOAFiles();
        break;
      case 'getCentralArchive':
        result = getCentralArchiveInfo();
        break;
      case 'syncExistingFiles':
        result = syncExistingFilesToArchive();
        break;
      case 'deleteDriveFile':
        result = deleteDriveFile(e.parameter.fileId);
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
    // JSONP response - Cache bypass timestamp frontend'de yapılıyor
    return ContentService.createTextOutput(callback + '(' + output + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Plain JSON response
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
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
      version: '2.1',
      deployDate: '05.02.2026',
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

// Merkezi arşiv klasörünü al veya oluştur
function getCentralArchiveFolder() {
  let folder;
  const folderName = 'COA_Merkezi_Arsiv';
  
  // Mevcut klasörü bul
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    // Klasör yoksa oluştur
    folder = DriveApp.createFolder(folderName);
    Logger.log('✅ Merkezi arşiv klasörü oluşturuldu: ' + folderName);
  }
  
  // Herkese açık yap (görüntüleme)
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(e) {
    // Paylaşım ayarı zaten yapılmış olabilir
  }
  
  return folder;
}

// Dosyayı merkezi arşive kopyala
function copyToCentralArchive(file) {
  try {
    const centralFolder = getCentralArchiveFolder();
    const fileName = file.getName();
    
    // Aynı isimde dosya varsa üzerine yazma
    const existingFiles = centralFolder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      Logger.log('ℹ️ Merkezi arşivde zaten var: ' + fileName);
      return { success: true, alreadyExists: true };
    }
    
    // Dosyayı kopyala
    const copiedFile = file.makeCopy(fileName, centralFolder);
    copiedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    Logger.log('✅ Merkezi arşive kopyalandı: ' + fileName);
    return { 
      success: true, 
      copiedFileId: copiedFile.getId(),
      copiedFileUrl: 'https://drive.google.com/file/d/' + copiedFile.getId() + '/view'
    };
  } catch(error) {
    Logger.log('⚠️ Merkezi arşive kopyalama hatası: ' + error.toString());
    return { success: false, error: error.toString() };
  }
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
    
    // Merkezi arşive de kopyala
    copyToCentralArchive(file);
    
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
          let value = data[i][j];
          
          // deliveryDate Date object'se YYYY-MM-DD string'e çevir
          if (headers[j] === 'deliveryDate' && value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            value = `${year}-${month}-${day}`;
          }
          
          // ocrProperties JSON string'se parse et
          if (headers[j] === 'ocrProperties' && value && typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch(e) {
              Logger.log('⚠️ ocrProperties parse hatası: ' + e.toString());
            }
          }
          
          // fileData dahil tüm alanları al
          record[headers[j]] = value;
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
          let value = data[i][j];
          
          // deliveryDate Date object'se YYYY-MM-DD string'e çevir
          if (headers[j] === 'deliveryDate' && value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            value = `${year}-${month}-${day}`;
          }
          
          // ocrProperties JSON string'se parse et
          if (headers[j] === 'ocrProperties' && value && typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch(e) {
              Logger.log('⚠️ ocrProperties parse hatası: ' + e.toString());
            }
          }
          
          // fileData dahil tüm alanları al
          record[headers[j]] = value;
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
            let value = data[i][j];
            
            // deliveryDate Date object'se YYYY-MM-DD string'e çevir
            if (headers[j] === 'deliveryDate' && value instanceof Date) {
              const year = value.getFullYear();
              const month = String(value.getMonth() + 1).padStart(2, '0');
              const day = String(value.getDate()).padStart(2, '0');
              value = `${year}-${month}-${day}`;
            }
            
            // ocrProperties JSON string'se parse et
            if (headers[j] === 'ocrProperties' && value && typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch(e) {
                Logger.log('⚠️ ocrProperties parse hatası: ' + e.toString());
              }
            }
            
            record[headers[j]] = value;
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
    let headers = getHeaders(sheet);
    
    // Eksik header'ları otomatik ekle (driveFileId gibi)
    const recordKeys = Object.keys(record);
    const missingHeaders = recordKeys.filter(key => !headers.includes(key));
    
    if (missingHeaders.length > 0) {
      Logger.log('🔧 Eksik kolonlar ekleniyor: ' + missingHeaders.join(', '));
      
      // Header satırını güncelle
      const lastCol = headers.length;
      missingHeaders.forEach((header, idx) => {
        sheet.getRange(1, lastCol + idx + 1).setValue(header);
        headers.push(header);
      });
      
      Logger.log('✅ ' + missingHeaders.length + ' yeni kolon eklendi');
    }
    
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
    
    // ocrProperties varsa JSON string'e çevir
    if (record.ocrProperties && typeof record.ocrProperties === 'object') {
      record.ocrProperties = JSON.stringify(record.ocrProperties);
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
        
        // ocrProperties varsa JSON string'e çevir
        if (newData.ocrProperties && typeof newData.ocrProperties === 'object') {
          newData.ocrProperties = JSON.stringify(newData.ocrProperties);
        }
        
        // Eksik header'ları otomatik ekle (addCOA ile aynı pattern)
        const newDataKeys = Object.keys(newData);
        const missingHeaders = newDataKeys.filter(key => !headers.includes(key));
        if (missingHeaders.length > 0) {
          Logger.log('🔧 updateCOA: Eksik kolonlar ekleniyor: ' + missingHeaders.join(', '));
          const lastCol = headers.length;
          missingHeaders.forEach((header, idx) => {
            sheet.getRange(1, lastCol + idx + 1).setValue(header);
            headers.push(header);
          });
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

function deleteCOARecord(materialCode, deliveryDate, deliveryNo) {
  if (!materialCode || !deliveryDate) {
    return { success: false, error: 'Material code ve delivery date gerekli' };
  }
  
  // deliveryNo opsiyonel - boş veya undefined olabilir
  deliveryNo = deliveryNo || '';
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('COA_Records');
    
    if (!sheet) {
      return { success: false, error: 'COA_Records sheet bulunamadı' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    Logger.log('🔍 SILME İSTEĞİ:');
    Logger.log('  Material Code: "' + materialCode + '" (length: ' + materialCode.length + ')');
    Logger.log('  Delivery Date: "' + deliveryDate + '"');
    Logger.log('  Delivery No: "' + deliveryNo + '" (length: ' + deliveryNo.length + ', boş mu: ' + (!deliveryNo) + ')');
    Logger.log('  Toplam satır: ' + data.length);
    Logger.log('📋 HEADER SATIRLARI:');
    Logger.log('  Column 0: "' + data[0][0] + '"');
    Logger.log('  Column 1: "' + data[0][1] + '"');
    Logger.log('  Column 2: "' + data[0][2] + '"');
    Logger.log('  Column 3: "' + data[0][3] + '"');
    
    // Tarih formatını normalize et (YYYY-MM-DD → DD.MM.YYYY)
    let searchDate = deliveryDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      // YYYY-MM-DD formatından DD.MM.YYYY formatına çevir
      const [year, month, day] = deliveryDate.split('-');
      searchDate = `${day}.${month}.${year}`;
      Logger.log('Tarih formatı dönüştürüldü: ' + deliveryDate + ' → ' + searchDate);
    }
    
    let deletedCount = 0;
    let matchLog = [];
    
    // deliveryNo'yu normalize et - bazen başında/sonunda boşluk veya | çevresinde boşluk olabiliyor
    const normalizedDeliveryNo = deliveryNo ? String(deliveryNo).replace(/\s+\|\s+/g, '|').trim() : '';
    Logger.log('🔍 Normalized Delivery No: "' + normalizedDeliveryNo + '"');
    
    // İlk satır header'dır, 2. satırdan itibaren kontrol et (TERSTEN - son satırdan başa doğru)
    for (let i = data.length - 1; i >= 1; i--) {
      let rowDeliveryDate = data[i][1];   // Column 1: Tarih (ID sütunundan sonra)
      let rawDeliveryNo = String(data[i][2] || '').trim();     // Column 2: İrsaliye No
      const rowMaterialCode = String(data[i][4] || '').trim();   // Column 4: Malzeme Kodu
      
      // Delivery No'yu normalize et (sheet'teki değer için)
      const rowDeliveryNo = rawDeliveryNo.replace(/\s+\|\s+/g, '|').trim();
      
      // Tarih Date object ise DD.MM.YYYY string'e çevir
      if (rowDeliveryDate instanceof Date) {
        const day = String(rowDeliveryDate.getDate()).padStart(2, '0');
        const month = String(rowDeliveryDate.getMonth() + 1).padStart(2, '0');
        const year = rowDeliveryDate.getFullYear();
        rowDeliveryDate = `${day}.${month}.${year}`;
      } else {
        rowDeliveryDate = String(rowDeliveryDate || '').trim();
      }
      
      // İlk 5 satırı logla (daha fazla örneklem)
      if (i <= 5) {
        Logger.log('📝 DATA Satır ' + (i+1) + ':');
        Logger.log('    Column 1 (Tarih): "' + rowDeliveryDate + '"');
        Logger.log('    Column 2 (İrsaliye): RAW="' + rawDeliveryNo + '" → NORM="' + rowDeliveryNo + '"');
        Logger.log('    Column 4 (Material): "' + rowMaterialCode + '"');
      }
      
      // Eşleşme kontrolü yap
      const materialMatch = (rowMaterialCode === materialCode);
      const dateMatch = (rowDeliveryDate === deliveryDate || rowDeliveryDate === searchDate);
      const deliveryNoMatch = normalizedDeliveryNo ? (rowDeliveryNo === normalizedDeliveryNo) : true; // deliveryNo boşsa her zaman true
      
      // Her satır için eşleşme durumunu logla (ilk 10 satır)
      if (i <= 10) {
        const matchStatus = {
          row: i + 1,
          materialMatch: materialMatch,
          dateMatch: dateMatch,
          deliveryNoMatch: deliveryNoMatch,
          allMatch: (materialMatch && dateMatch && deliveryNoMatch),
          values: {
            material: rowMaterialCode + ' vs ' + materialCode,
            date: rowDeliveryDate + ' vs ' + searchDate,
            deliveryNo: rowDeliveryNo + ' vs ' + normalizedDeliveryNo
          }
        };
        Logger.log('🔍 Eşleşme durumu satır ' + (i+1) + ': ' + JSON.stringify(matchStatus));
      }
      
      // Kısmi eşleşmeleri logla
      if (materialMatch || dateMatch || (normalizedDeliveryNo && deliveryNoMatch)) {
        matchLog.push({
          row: i + 1,
          M: materialMatch,
          D: dateMatch,
          N: deliveryNoMatch,
          allMatch: (materialMatch && dateMatch && deliveryNoMatch),
          data: {
            material: rowMaterialCode,
            date: rowDeliveryDate,
            deliveryNo: rowDeliveryNo
          }
        });
      }
      
      // Hem YYYY-MM-DD hem DD.MM.YYYY formatını kontrol et
      if (materialMatch && dateMatch && deliveryNoMatch) {
        sheet.deleteRow(i + 1);
        deletedCount++;
        Logger.log('✅ COA_Records satır silindi: ' + (i + 1) + ' | ' + materialCode + ' | ' + rowDeliveryDate + ' | ' + (normalizedDeliveryNo || '(boş)'));
      }
    }
    
    // Match log'u yazdır
    if (matchLog.length > 0) {
      Logger.log('🔍 Kısmi eşleşmeler bulundu (' + matchLog.length + ' adet):');
      matchLog.forEach(function(log) { 
        Logger.log('  Satır ' + log.row + ': M=' + log.M + ' D=' + log.D + ' N=' + log.N + ' ALL=' + log.allMatch);
        Logger.log('    → Material: "' + log.data.material + '"');
        Logger.log('    → Date: "' + log.data.date + '"');
        Logger.log('    → DeliveryNo: "' + log.data.deliveryNo + '"');
      });
    } else {
      Logger.log('⚠️ Hiçbir kısmi eşleşme bulunamadı');
    }
    
    if (deletedCount > 0) {
      return { success: true, message: deletedCount + ' satır silindi', deletedCount: deletedCount };
    } else {
      // DEBUG: Tüm bilgileri döndür
      const debugInfo = {
        searchParams: {
          materialCode: materialCode,
          deliveryDate: deliveryDate,
          searchDate: searchDate,
          deliveryNo: deliveryNo,
          normalizedDeliveryNo: normalizedDeliveryNo
        },
        sheetInfo: {
          totalRows: data.length,
          headers: {
            col0: String(data[0][0]),
            col1: String(data[0][1]),
            col2: String(data[0][2]),
            col3: String(data[0][3])
          }
        },
        sampleRows: [],
        matchDetails: matchLog.slice(0, 10) // İlk 10 kısmi eşleşmeyi ekle
      };
      
      // İlk 5 data satırını ekle (daha fazla örneklem)
      for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
        let dateValue = data[i][0];
        
        // Date object ise string'e çevir
        if (dateValue instanceof Date) {
          const day = String(dateValue.getDate()).padStart(2, '0');
          const month = String(dateValue.getMonth() + 1).padStart(2, '0');
          const year = dateValue.getFullYear();
          dateValue = `${day}.${month}.${year}`;
        } else {
          dateValue = String(dateValue || '');
        }
        
        const rawDelivNo = String(data[i][1] || '');
        debugInfo.sampleRows.push({
          row: i + 1,
          col0_deliveryDate: dateValue,
          col1_deliveryNo_RAW: rawDelivNo,
          col1_deliveryNo_NORMALIZED: rawDelivNo.replace(/\s+\|\s+/g, '|').trim(),
          col3_materialCode: String(data[i][3] || '')
        });
      }
      
      Logger.log('❌ Kayıt bulunamadı: ' + materialCode + ' | ' + searchDate + ' (' + deliveryDate + ') | ' + normalizedDeliveryNo);
      return { 
        success: false, 
        error: 'COA_Records\'da kayıt bulunamadı',
        debug: debugInfo
      };
    }
  } catch(error) {
    return { success: false, error: 'COA_Records silme hatası: ' + error.toString() };
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
      'ID',
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
      'Kayıt Zamanı',
      'Malzeme Adı'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Başlık formatla
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285f4')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    
    // Sütun genişlikleri
    sheet.setColumnWidth(1, 200);  // ID
    sheet.setColumnWidth(2, 100);  // Tarih
    sheet.setColumnWidth(3, 120);  // İrsaliye
    sheet.setColumnWidth(4, 100);  // Lot
    sheet.setColumnWidth(5, 100);  // Kod
    sheet.setColumnWidth(6, 150);  // Tedarikçi
    sheet.setColumnWidth(7, 150);  // Lokasyon
    sheet.setColumnWidth(8, 150);  // Özellik
    sheet.setColumnWidth(9, 80);   // Birim
    sheet.setColumnWidth(10, 100); // Test Standardı
    sheet.setColumnWidth(11, 70);  // Operatör
    sheet.setColumnWidth(12, 100); // Standart Değer
    sheet.setColumnWidth(13, 80);  // Alt Limit
    sheet.setColumnWidth(14, 80);  // Üst Limit
    sheet.setColumnWidth(15, 150); // Requirement
    sheet.setColumnWidth(16, 80);  // COA Değeri
    sheet.setColumnWidth(17, 80);  // Durum
    sheet.setColumnWidth(18, 150); // Kayıt
    sheet.setColumnWidth(19, 200); // Malzeme Adı
    
    // Freeze başlık
    sheet.setFrozenRows(1);
  } else {
    // Mevcut sheet varsa header'ı kontrol et ve ID sütunu ekle
    const currentHeader = sheet.getRange(1, 1).getValue();
    if (currentHeader !== 'ID') {
      // ID sütunu yok, ekle
      sheet.insertColumnBefore(1);
      const headers = [
        'ID',
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
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285f4')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      
      // Mevcut satırlara ID ekle
      const existingData = sheet.getDataRange().getValues();
      for (let i = 1; i < existingData.length; i++) {
        const id = 'REC_' + new Date().getTime() + '_' + i;
        sheet.getRange(i + 1, 1).setValue(id);
      }
      
      sheet.setColumnWidth(1, 200); // ID sütunu genişliği
      Logger.log('✅ COA_Records\'a ID sütunu eklendi');
    }
    
    // 'Malzeme Adı' kolonu kontrolü - yoksa son kolona ekle
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const hasMalzemeAdi = headerRow.some(h => h && h.toString() === 'Malzeme Adı');
    if (!hasMalzemeAdi) {
      const lastCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, lastCol).setValue('Malzeme Adı');
      sheet.getRange(1, lastCol).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
      sheet.setColumnWidth(lastCol, 200);
      Logger.log('✅ COA_Records\'a Malzeme Adı sütunu eklendi (kolon ' + lastCol + ')');
    }
  }
  
  return sheet;
}

// COA kayıtlarını satır bazlı kaydet
// ==================== BATCH COA_RECORDS KAYDETME ====================

function saveCOARecordsBatch(batchData) {
  // batchData: Array of { materialCode, properties, deliveryDate, deliveryNo, lotNumber, supplier, location }
  try {
    const sheet = getCOARecordsSheet();
    const now = new Date().toLocaleString('tr-TR');
    
    Logger.log('🚀 BATCH COA_Records kaydediliyor: ' + batchData.length + ' COA');
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    // Her COA için kayıt yap
    batchData.forEach((data, index) => {
      try {
        Logger.log(`   📦 [${index + 1}/${batchData.length}] ${data.materialCode} - ${data.properties.length} özellik`);
        
        // Tek COA'yı kaydet
        const result = saveCOARecord(data);
        
        if (result.success) {
          totalInserted += result.inserted || 0;
          totalUpdated += result.updated || 0;
        } else {
          totalErrors++;
          Logger.log(`   ❌ Hata: ${result.error}`);
        }
      } catch (error) {
        totalErrors++;
        Logger.log(`   ❌ Exception: ${error.toString()}`);
      }
    });
    
    Logger.log(`✅ BATCH TAMAMLANDI: ${totalInserted} eklendi, ${totalUpdated} güncellendi, ${totalErrors} hata`);
    
    return {
      success: true,
      totalCOAs: batchData.length,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      message: `${totalInserted + totalUpdated} satır kaydedildi`
    };
    
  } catch (error) {
    Logger.log('❌ BATCH HATASI: ' + error.toString());
    return {
      success: false,
      error: 'Batch kayıt hatası: ' + error.toString()
    };
  }
}

function saveCOARecord(data) {
  try {
    const sheet = getCOARecordsSheet();
    
    // data: { date OR deliveryDate, deliveryNo, lotNumber, materialCode, supplier, location, properties: [{name, coaValue, unit, standard, operator, standardValue, min, max, status}] }
    
    const now = new Date().toLocaleString('tr-TR');
    
    // Tarih formatını YYYY-MM-DD olarak normalize et (karşılaştırma için)
    let deliveryDateNormalized = data.date || data.deliveryDate || '';
    
    // DD.MM.YYYY → YYYY-MM-DD
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(deliveryDateNormalized)) {
      const [day, month, year] = deliveryDateNormalized.split('.');
      deliveryDateNormalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // DD/MM/YYYY → YYYY-MM-DD
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(deliveryDateNormalized)) {
      const [day, month, year] = deliveryDateNormalized.split('/');
      deliveryDateNormalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Date object → YYYY-MM-DD
    else if (deliveryDateNormalized instanceof Date) {
      const d = new Date(deliveryDateNormalized);
      deliveryDateNormalized = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    Logger.log(`📅 Normalized delivery date: ${deliveryDateNormalized}`);
    Logger.log(`📦 Material: ${data.materialCode}, Delivery No: ${data.deliveryNo}, Location: ${data.location}`);
    
    // 🔥 ÖNEMLİ: Aynı irsaliyeye ait ESKİ kayıtları SİL (tekrar kaydetmeden önce)
    // Bu sayede aynı irsaliye için tekrarlayan satırlar oluşmaz
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    // Türkçe karakter normalizasyonu için helper fonksiyon
    const normalizeTurkish = (str) => {
      return str.toString()
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/Ş/g, 's')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c')
        .toLowerCase();
    };
    
    // Sütun index'lerini bul (Türkçe karakter desteği ile)
    const dateIdx = headers.findIndex(h => h && normalizeTurkish(h).includes('tarih'));
    const deliveryNoIdx = headers.findIndex(h => h && normalizeTurkish(h).includes('irsaliye'));
    const materialIdx = headers.findIndex(h => h && normalizeTurkish(h).includes('malzeme'));
    const lotNoIdx = headers.findIndex(h => h && (
      normalizeTurkish(h).includes('lot') ||
      normalizeTurkish(h).includes('parti')
    ));
    const propertyNameIdx = headers.findIndex(h => h && (
      normalizeTurkish(h).includes('ozellik') || 
      normalizeTurkish(h).includes('property')
    ));
    
    Logger.log(`📋 Column indexes: date=${dateIdx}, delivery=${deliveryNoIdx}, material=${materialIdx}, lot=${lotNoIdx}, property=${propertyNameIdx}`);
    Logger.log(`📋 Headers array:`, JSON.stringify(headers));
    
    // Eğer gerekli kolonlar yoksa, hata döndür
    if (dateIdx < 0 || deliveryNoIdx < 0 || materialIdx < 0 || propertyNameIdx < 0) {
      Logger.log('❌ Gerekli kolonlar bulunamadı! Header kontrol edin.');
      const headerDebug = headers.map((h, i) => `${i}: "${h}"`).join(', ');
      Logger.log(`📋 Bulunan header'lar: ${headerDebug}`);
      return {
        success: false,
        error: `COA_Records kolonları eksik! date=${dateIdx}, delivery=${deliveryNoIdx}, material=${materialIdx}, lot=${lotNoIdx}, property=${propertyNameIdx}. Headers: ${headerDebug.substring(0, 200)}`
      };
    }
    
    let insertPosition = null; // İlk satırın pozisyonu
    const matchingRows = [];
    
    // Eşleşen satırları bul (property bilgisi ile birlikte)
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      let rowDate = row[dateIdx] || '';
      
      // Tarih formatını normalize et (YYYY-MM-DD)
      if (rowDate instanceof Date) {
        const d = new Date(rowDate);
        rowDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (typeof rowDate === 'string') {
        rowDate = String(rowDate).trim();
        // DD.MM.YYYY → YYYY-MM-DD
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(rowDate)) {
          const [day, month, year] = rowDate.split('.');
          rowDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // DD/MM/YYYY → YYYY-MM-DD
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rowDate)) {
          const [day, month, year] = rowDate.split('/');
          rowDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      const rowDeliveryNo = String(row[deliveryNoIdx] || '').trim();
      const rowMaterial = String(row[materialIdx] || '').trim();
      const rowLotNo = lotNoIdx >= 0 ? String(row[lotNoIdx] || '').trim() : '';
      const rowPropertyName = String(row[propertyNameIdx] || '').trim();
      
      // Eşleşme kontrolü - lotNumber da dahil (aynı irsaliyenin farklı partileri ayrı kayıt)
      const incomingLotNo = String(data.lotNumber || '').trim();
      const lotMatches = (lotNoIdx < 0) || (incomingLotNo === '') || (rowLotNo === incomingLotNo);
      if (rowDate === deliveryDateNormalized && 
          rowDeliveryNo === (data.deliveryNo || '') && 
          rowMaterial === (data.materialCode || '') &&
          lotMatches) {
        matchingRows.push({
          rowIndex: i,
          sheetRow: i + 1, // 1-indexed
          propertyName: rowPropertyName,
          rowData: row
        });
        if (insertPosition === null) {
          insertPosition = i + 1; // İlk eşleşen satırın pozisyonu
        }
        Logger.log(`   🎯 Eşleşme: Satır ${i + 1} - ${rowPropertyName}`);
      }
    }
    
    if (matchingRows.length > 0) {
      Logger.log(`📋 ${matchingRows.length} eski satır bulundu, güncelleme/ekleme yapılacak...`);
        
        // Her yeni property için işlem yap
        data.properties.forEach(newProp => {
          // Tarih formatı kontrolü (yanlışlıkla tarih girilmişse atla)
          const coaValueStr = String(newProp.coaValue || '').trim();
          if (coaValueStr) {
            // ISO tarih formatı kontrolü
            if (/^\d{4}-\d{2}-\d{2}T/.test(coaValueStr) || /^\d{4}-\d{2}-\d{2}$/.test(coaValueStr)) {
              Logger.log(`⚠️ ${newProp.name}: Tarih formatında değer atlanıyor: "${coaValueStr}"`);
              return;
            }
            // DD.MM.YYYY veya DD/MM/YYYY formatı
            if (/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/.test(coaValueStr)) {
              Logger.log(`⚠️ ${newProp.name}: Tarih formatında değer atlanıyor: "${coaValueStr}"`);
              return;
            }
            // Yıl kontrolü (1900-2099 arası)
            const testNum = parseFloat(coaValueStr.replace(/,/g, '.'));
            if (!isNaN(testNum) && testNum >= 1900 && testNum <= 2099) {
              Logger.log(`⚠️ ${newProp.name}: Yıl değeri atlanıyor: "${coaValueStr}"`);
              return;
            }
          }
          
          // Aynı property name'e sahip eski satırı bul
          const existingRow = matchingRows.find(m => m.propertyName === newProp.name);
          
          if (existingRow) {
            // Mevcut satırı GÜNCELLE
            Logger.log(`   ✏️ Güncelleniyor: ${newProp.name} (Satır ${existingRow.sheetRow})`);
            
            // COA değerini string olarak koru (0,035 gibi değerler için)
            let coaValueFormatted = newProp.coaValue || '';
            if (coaValueFormatted && /^0[,\.]/.test(coaValueFormatted)) {
              coaValueFormatted = "'" + coaValueFormatted;  // Apostrophe ekle
            }
            
            // Min/Max değerlerini de string olarak koru
            let minFormatted = newProp.min || '';
            if (minFormatted && /^0[,\.]/.test(minFormatted)) {
              minFormatted = "'" + minFormatted;
            }
            let maxFormatted = newProp.max || '';
            if (maxFormatted && /^0[,\.]/.test(maxFormatted)) {
              maxFormatted = "'" + maxFormatted;
            }
            
            // Standard değerini de koru
            let standardValueFormatted = newProp.standardValue || '';
            if (standardValueFormatted && /^0[,\.]/.test(standardValueFormatted)) {
              standardValueFormatted = "'" + standardValueFormatted;
            }
            
            // Yeni satır verisini hazırla
            const uniqueId = 'REC_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
            const updatedRow = [
              uniqueId,
              deliveryDateNormalized,
              data.deliveryNo || '',
              data.lotNumber || '',
              data.materialCode || '',
              data.supplier || '',
              data.location || '',
              newProp.name || '',
              newProp.unit || '',
              newProp.standard || '',
              newProp.operator || '',
              standardValueFormatted,
              minFormatted,
              maxFormatted,
              newProp.requirement || '',
              coaValueFormatted,
              newProp.status || '',
              now,
              data.materialName || ''
            ];
            
            // Satırı güncelle
            const range = sheet.getRange(existingRow.sheetRow, 1, 1, updatedRow.length);
            range.setValues([updatedRow]);
            
            // Numerik sütunları text formatına çevir (0,035 gibi değerleri korumak için)
            sheet.getRange(existingRow.sheetRow, 12).setNumberFormat('@'); // standardValue
            sheet.getRange(existingRow.sheetRow, 13).setNumberFormat('@'); // min
            sheet.getRange(existingRow.sheetRow, 14).setNumberFormat('@'); // max
            sheet.getRange(existingRow.sheetRow, 16).setNumberFormat('@'); // coaValue
            Logger.log(`   🔧 Text format uygulandı: ${newProp.name}`);
            
            // İşlenmiş olarak işaretle
            existingRow.processed = true;
          }
        });
        
        // İşlenmemiş (silinecek) eski satırları bul
        const rowsToDelete = matchingRows
          .filter(m => !m.processed)
          .map(m => m.sheetRow)
          .sort((a, b) => b - a); // Sondan başa doğru sıralı
        
        // Fazla eski satırları sil
        if (rowsToDelete.length > 0) {
          Logger.log(`🗑️ ${rowsToDelete.length} eski satır siliniyor...`);
          rowsToDelete.forEach(rowNum => {
            sheet.deleteRow(rowNum);
          });
        }
        
        // Yeni property'leri INSERT et (eski satırların hemen altına)
        const newProperties = data.properties.filter(newProp => {
          // Tarih kontrolünü tekrar yapalım (güvenli olsun)
          const coaValueStr = String(newProp.coaValue || '').trim();
          if (coaValueStr) {
            if (/^\d{4}-\d{2}-\d{2}T/.test(coaValueStr) || /^\d{4}-\d{2}-\d{2}$/.test(coaValueStr)) {
              return false; // Tarih formatı, atla
            }
            if (/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/.test(coaValueStr)) {
              return false; // Tarih formatı, atla
            }
            const testNum = parseFloat(coaValueStr.replace(/,/g, '.'));
            if (!isNaN(testNum) && testNum >= 1900 && testNum <= 2099) {
              return false; // Yıl değeri, atla
            }
          }
          
          // Eski property'lerde yoksa true döndür (yeni property)
          return !matchingRows.some(m => m.propertyName === newProp.name);
        });
        
        if (newProperties.length > 0) {
          Logger.log(`➕ ${newProperties.length} yeni özellik eski satırların altına ekleniyor...`);
          
          // InsertPosition'ı hesapla (silme işleminden sonra kaymış olabilir)
          const deletedBeforeInsert = rowsToDelete.filter(r => r < insertPosition).length;
          const finalInsertPosition = insertPosition + matchingRows.filter(m => m.processed).length - deletedBeforeInsert;
          
          newProperties.forEach((newProp, idx) => {
            // COA değerini string olarak koru (0,035 gibi değerler için)
            let coaValueFormatted = newProp.coaValue || '';
            if (coaValueFormatted && /^0[,\.]/.test(coaValueFormatted)) {
              coaValueFormatted = "'" + coaValueFormatted;  // Apostrophe ekle
            }
            
            // Min/Max değerlerini de string olarak koru
            let minFormatted = newProp.min || '';
            if (minFormatted && /^0[,\.]/.test(minFormatted)) {
              minFormatted = "'" + minFormatted;
            }
            let maxFormatted = newProp.max || '';
            if (maxFormatted && /^0[,\.]/.test(maxFormatted)) {
              maxFormatted = "'" + maxFormatted;
            }
            
            // Standard değerini de koru
            let standardValueFormatted = newProp.standardValue || '';
            if (standardValueFormatted && /^0[,\.]/.test(standardValueFormatted)) {
              standardValueFormatted = "'" + standardValueFormatted;
            }
            
            const uniqueId = 'REC_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
            const newRow = [
              uniqueId,
              deliveryDateNormalized,
              data.deliveryNo || '',
              data.lotNumber || '',
              data.materialCode || '',
              data.supplier || '',
              data.location || '',
              newProp.name || '',
              newProp.unit || '',
              newProp.standard || '',
              newProp.operator || '',
              standardValueFormatted,
              minFormatted,
              maxFormatted,
              newProp.requirement || '',
              coaValueFormatted,
              newProp.status || '',
              now,
              data.materialName || ''
            ];
            
            // Satırı belirli pozisyona ekle
            sheet.insertRowAfter(finalInsertPosition - 1 + idx);
            const range = sheet.getRange(finalInsertPosition + idx, 1, 1, newRow.length);
            range.setValues([newRow]);
            
            // Numerik sütunları text formatına çevir
            const rowNum = finalInsertPosition + idx;
            sheet.getRange(rowNum, 12).setNumberFormat('@'); // standardValue
            sheet.getRange(rowNum, 13).setNumberFormat('@'); // min
            sheet.getRange(rowNum, 14).setNumberFormat('@'); // max
            sheet.getRange(rowNum, 16).setNumberFormat('@'); // coaValue
            
            Logger.log(`     ✅ ${newProp.name} eklendi (Satır ${finalInsertPosition + idx}) - Text format uygulandı`);
          });
        }
        
        Logger.log('✅ Güncelleme/Ekleme tamamlandı!');
        
        return {
          success: true,
          recordCount: data.properties.length,
          message: `${matchingRows.filter(m => m.processed).length} güncellendi, ${newProperties.length} yeni eklendi`
        };
    } else {
      // İlk kez kaydediliyor (matching rows yok) - Yeni satırları EN SONA ekle
      Logger.log('📝 İlk kez kaydediliyor, yeni satırlar ekleniyor...');
    }
    
    // FALLBACK: İlk kayıt için eski mantık (sadece matching rows yoksa çalışır)
    const rows = [];
    
    // Her özellik için ayrı satır oluştur
    data.properties.forEach(prop => {
      // Benzersiz ID oluştur (timestamp + random)
      const uniqueId = 'REC_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
      
      // COA değeri varsa tarih formatlarını kontrol et (yanlışlıkla tarih girilmişse atla)
      const coaValueStr = String(prop.coaValue || '').trim();
      if (coaValueStr) {
        // ISO tarih formatı kontrolü (2026-05-04T21:00:00.000Z)
        if (/^\d{4}-\d{2}-\d{2}T/.test(coaValueStr) || /^\d{4}-\d{2}-\d{2}$/.test(coaValueStr)) {
          Logger.log(`⚠️ ${prop.name}: Tarih formatında değer atlanıyor: "${coaValueStr}"`);
          return; // Bu property'yi kaydetme
        }
        
        // DD.MM.YYYY veya DD/MM/YYYY formatı
        if (/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/.test(coaValueStr)) {
          Logger.log(`⚠️ ${prop.name}: Tarih formatında değer atlanıyor: "${coaValueStr}"`);
          return; // Bu property'yi kaydetme
        }
        
        // Yıl kontrolü (1900-2099 arası gerçek yıllar)
        const testNum = parseFloat(coaValueStr.replace(/,/g, '.'));
        if (!isNaN(testNum) && testNum >= 1900 && testNum <= 2099) {
          Logger.log(`⚠️ ${prop.name}: Yıl değeri atlanıyor: "${coaValueStr}"`);
          return; // Bu property'yi kaydetme
        }
      }
      
      // COA değerini string olarak koru (0,035 gibi değerler için)
      let coaValueFormatted = prop.coaValue || '';
      if (coaValueFormatted && /^0[,\.]/.test(coaValueFormatted)) {
        coaValueFormatted = "'" + coaValueFormatted;  // Apostrophe ekle
      }
      
      // Min/Max değerlerini de string olarak koru
      let minFormatted = prop.min || '';
      if (minFormatted && /^0[,\.]/.test(minFormatted)) {
        minFormatted = "'" + minFormatted;
      }
      let maxFormatted = prop.max || '';
      if (maxFormatted && /^0[,\.]/.test(maxFormatted)) {
        maxFormatted = "'" + maxFormatted;
      }
      
      // Standard değerini de koru
      let standardValueFormatted = prop.standardValue || '';
      if (standardValueFormatted && /^0[,\.]/.test(standardValueFormatted)) {
        standardValueFormatted = "'" + standardValueFormatted;
      }
      
      // Geçerli değer, satır oluştur
      rows.push([
        uniqueId,  // Yeni: Benzersiz ID
        deliveryDateNormalized,  // ✅ Normalize edilmiş tarih (YYYY-MM-DD)
        data.deliveryNo || '',
        data.lotNumber || '',
        data.materialCode || '',
        data.supplier || '',
        data.location || '',  // ✅ Location eklendi
        prop.name || '',
        prop.unit || '',
        prop.standard || '',
        prop.operator || '',
        standardValueFormatted,
        minFormatted,
        maxFormatted,
        prop.requirement || '',  // Yeni: Compliance mode için
        coaValueFormatted,  // ✅ Boş olabilir artık
        prop.status || '',
        now,
        data.materialName || ''
      ]);
    });
    
    // Tüm satırları ekle
    if (rows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, 19).setValues(rows);
      
      // Numerik sütunları text formatına çevir (tüm yeni satırlar için)
      sheet.getRange(startRow, 12, rows.length, 1).setNumberFormat('@'); // standardValue
      sheet.getRange(startRow, 13, rows.length, 1).setNumberFormat('@'); // min
      sheet.getRange(startRow, 14, rows.length, 1).setNumberFormat('@'); // max
      sheet.getRange(startRow, 16, rows.length, 1).setNumberFormat('@'); // coaValue
      Logger.log(`🔧 ${rows.length} satır için text format uygulandı`);
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
    // 🔥 Cache'i temizle (her zaman güncel veri çek)
    SpreadsheetApp.flush();
    
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
    
    const idIdx = getColIndex('ID');
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
    const requirementIdx = getColIndex('Requirement');
    const coaValueIdx = getColIndex('COA');
    const statusIdx = getColIndex('Durum');
    const timestampIdx = getColIndex('Kayıt');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      records.push({
        id: idIdx >= 0 ? (row[idIdx] || '') : '',  // Yeni: Unique ID
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
        requirement: requirementIdx >= 0 ? (row[requirementIdx] || '') : '',
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

// ID'ye göre COA kaydını güncelle (tek satır)
function updateCOARecordByID(recordId, updateData) {
  if (!recordId) {
    return { success: false, error: 'Record ID gerekli' };
  }
  
  try {
    const sheet = getCOARecordsSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // ID sütununun index'ini bul
    let idColIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase() === 'id') {
        idColIndex = i;
        break;
      }
    }
    
    if (idColIndex === -1) {
      return { success: false, error: 'ID sütunu bulunamadı' };
    }
    
    // Satırı bul
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === recordId) {
        const now = new Date().toLocaleString('tr-TR');
        
        // Sütun mapping'leri
        const colMap = {};
        headers.forEach((header, index) => {
          colMap[header] = index;
        });
        
        // Güncellenen değerleri ayarla
        const row = data[i].slice(); // Mevcut satırı kopyala
        
        if (updateData.date !== undefined && colMap['Tarih'] !== undefined) row[colMap['Tarih']] = updateData.date;
        if (updateData.deliveryNo !== undefined && colMap['İrsaliye No'] !== undefined) row[colMap['İrsaliye No']] = updateData.deliveryNo;
        if (updateData.lotNumber !== undefined && colMap['Lot No'] !== undefined) row[colMap['Lot No']] = updateData.lotNumber;
        if (updateData.materialCode !== undefined && colMap['Malzeme Kodu'] !== undefined) row[colMap['Malzeme Kodu']] = updateData.materialCode;
        if (updateData.supplier !== undefined && colMap['Tedarikçi'] !== undefined) row[colMap['Tedarikçi']] = updateData.supplier;
        if (updateData.location !== undefined && colMap['Lokasyon'] !== undefined) row[colMap['Lokasyon']] = updateData.location;
        if (updateData.propertyName !== undefined && colMap['Özellik Adı'] !== undefined) row[colMap['Özellik Adı']] = updateData.propertyName;
        if (updateData.unit !== undefined && colMap['Birim'] !== undefined) row[colMap['Birim']] = updateData.unit;
        if (updateData.standard !== undefined && colMap['Test Standardı'] !== undefined) row[colMap['Test Standardı']] = updateData.standard;
        if (updateData.operator !== undefined && colMap['Operatör'] !== undefined) row[colMap['Operatör']] = updateData.operator;
        if (updateData.standardValue !== undefined && colMap['Standart Değer'] !== undefined) row[colMap['Standart Değer']] = updateData.standardValue;
        if (updateData.minLimit !== undefined && colMap['Alt Limit'] !== undefined) row[colMap['Alt Limit']] = updateData.minLimit;
        if (updateData.maxLimit !== undefined && colMap['Üst Limit'] !== undefined) row[colMap['Üst Limit']] = updateData.maxLimit;
        if (updateData.requirement !== undefined && colMap['Requirement'] !== undefined) row[colMap['Requirement']] = updateData.requirement;
        if (updateData.coaValue !== undefined && colMap['COA Değeri'] !== undefined) row[colMap['COA Değeri']] = updateData.coaValue;
        if (updateData.status !== undefined && colMap['Durum'] !== undefined) row[colMap['Durum']] = updateData.status;
        if (colMap['Kayıt Zamanı'] !== undefined) row[colMap['Kayıt Zamanı']] = now;
        
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        
        Logger.log('✅ COA_Records satır güncellendi: ID=' + recordId);
        return { success: true, message: 'Kayıt güncellendi', id: recordId };
      }
    }
    
    return { success: false, error: 'Kayıt bulunamadı: ' + recordId };
    
  } catch(error) {
    Logger.log('❌ updateCOARecordByID hatası: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ID'ye göre COA kaydını sil (tek satır)
function deleteCOARecordByID(recordId) {
  if (!recordId) {
    return { success: false, error: 'Record ID gerekli' };
  }
  
  try {
    const sheet = getCOARecordsSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // ID sütununun index'ini bul
    let idColIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toLowerCase() === 'id') {
        idColIndex = i;
        break;
      }
    }
    
    if (idColIndex === -1) {
      return { success: false, error: 'ID sütunu bulunamadı' };
    }
    
    // Satırı bul ve sil
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === recordId) {
        sheet.deleteRow(i + 1);
        Logger.log('✅ COA_Records satır silindi: ID=' + recordId);
        return { success: true, message: 'Kayıt silindi', id: recordId };
      }
    }
    
    return { success: false, error: 'Kayıt bulunamadı: ' + recordId };
    
  } catch(error) {
    Logger.log('❌ deleteCOARecordByID hatası: ' + error.toString());
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
      sheet.appendRow(['Supplier', 'Version', 'Created At', 'Template JSON', 'Template Image URL']);
      sheet.getRange('A1:E1').setBackground('#2c5f2d').setFontColor('#ffffff').setFontWeight('bold');
    } else {
      // Eski sheet'lere Template Image URL sütunu ekle (eğer yoksa)
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (!headers.includes('Template Image URL') && !headers.includes('Template Image ID')) {
        const lastCol = sheet.getLastColumn();
        sheet.getRange(1, lastCol + 1).setValue('Template Image URL');
        sheet.getRange(1, lastCol + 1).setBackground('#2c5f2d').setFontColor('#ffffff').setFontWeight('bold');
      } else if (headers.includes('Template Image ID')) {
        // Eski header'ı güncelle
        const idIndex = headers.indexOf('Template Image ID');
        sheet.getRange(1, idIndex + 1).setValue('Template Image URL');
      }
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
    
    // imageData'yı templateData'dan çıkar Drive'a yükle
    let imageFileUrl = '';
    if (templateData.imageData) {
      const fileName = `${templateData.supplier}_template_v${templateData.version}.png`;
      const uploadResult = uploadFileToDrive(templateData.imageData, fileName, 'image/png');
      
      if (uploadResult.success) {
        imageFileUrl = uploadResult.viewUrl; // Tam Drive linki kaydet
        console.log('✅ Template görseli Drive\'a yüklendi:', imageFileUrl);
      } else {
        console.error('❌ Template görseli Drive\'a yüklenemedi:', uploadResult.error);
      }
      
      // imageData'yı template JSON'dan çıkar (Drive'da olduğu için gereksiz)
      delete templateData.imageData;
    }
    
    const templateJson = JSON.stringify(templateData);
    
    if (rowIndex > 0) {
      // Update existing template
      sheet.getRange(rowIndex, 1, 1, 5).setValues([[
        templateData.supplier,
        templateData.version,
        templateData.createdAt,
        templateJson,
        imageFileUrl
      ]]);
    } else {
      // Add new template
      sheet.appendRow([
        templateData.supplier,
        templateData.version,
        templateData.createdAt,
        templateJson,
        imageFileUrl
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
      const imageUrl = data[i][4] || ''; // 5. sütun: Template Image URL (Drive link)
      templates.push({
        supplier: data[i][0],
        version: data[i][1],
        createdAt: data[i][2],
        template: JSON.parse(data[i][3]),
        imageUrl: imageUrl // Tam Drive linki döndür
      });
    }
    
    return { success: true, data: templates };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get Template Image from Drive
 */
function getTemplateImage(fileId) {
  try {
    if (!fileId) {
      return { success: false, error: 'File ID boş' };
    }
    
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64Data = Utilities.base64Encode(blob.getBytes());
    const mimeType = blob.getContentType();
    
    return {
      success: true,
      imageData: `data:${mimeType};base64,${base64Data}`,
      fileName: file.getName(),
      mimeType: mimeType
    };
  } catch(error) {
    return { 
      success: false, 
      error: 'Drive görsel yükleme hatası: ' + error.toString() 
    };
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
    const headers = data[0];
    const imageUrlIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('image'));
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === supplierName.toLowerCase()) {
        // Template görselini Drive'dan sil (hem orijinal hem merkezi arşiv)
        if (imageUrlIdx >= 0 && data[i][imageUrlIdx]) {
          const imageUrl = data[i][imageUrlIdx].toString();
          const fileId = extractFileId(imageUrl);
          
          if (fileId) {
            // deleteDriveFile kullan - hem orijinal hem arşiv kopyasını siler
            const deleteResult = deleteDriveFile(fileId);
            if (deleteResult.success) {
              Logger.log('✅ Template görseli silindi: ' + deleteResult.message);
            } else {
              Logger.log('⚠️ Template görseli silinemedi: ' + deleteResult.error);
            }
          }
        }
        
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Template ve görseli silindi' };
      }
    }
    
    return { success: false, error: 'Template not found' };
    
  } catch(error) {
    return { success: false, error: error.toString() };
  }
}

// ==================== TÜM DOSYALARI TOPLAMA ====================

/**
 * Tüm COA arşiv ve template dosyalarını tek klasörde topla
 * PDF, Excel, Word ve resim dosyalarını filtreler ve kopyalar
 */
function collectAllCOAFiles() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Yeni klasör oluştur
    const targetFolderName = 'COA_Tüm_Dosyalar_' + new Date().toISOString().split('T')[0];
    let targetFolder;
    
    const existingFolders = DriveApp.getFoldersByName(targetFolderName);
    if (existingFolders.hasNext()) {
      targetFolder = existingFolders.next();
    } else {
      targetFolder = DriveApp.createFolder(targetFolderName);
      targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    let copiedFiles = [];
    let errorFiles = [];
    let totalFiles = 0;
    
    // Desteklenen dosya türleri
    const supportedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    const supportedExtensions = ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    // 1. COA_Arsiv sheet'inden dosyaları topla
    const coaSheet = getSheet();
    if (coaSheet) {
      const data = coaSheet.getDataRange().getValues();
      const headers = data[0];
      
      // Dosya ID veya URL sütunlarını bul
      const fileIdIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('fileid'));
      const fileUrlIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('fileurl'));
      const fileNameIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('filename'));
      const attachmentIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('attachment'));
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Farklı sütunlardan file ID çıkar
        let fileId = null;
        
        if (fileIdIdx >= 0 && row[fileIdIdx]) {
          fileId = extractFileId(row[fileIdIdx].toString());
        } else if (fileUrlIdx >= 0 && row[fileUrlIdx]) {
          fileId = extractFileId(row[fileUrlIdx].toString());
        } else if (attachmentIdx >= 0 && row[attachmentIdx]) {
          fileId = extractFileId(row[attachmentIdx].toString());
        }
        
        if (fileId) {
          totalFiles++;
          const result = copyFileSafely(fileId, targetFolder, supportedTypes, supportedExtensions);
          if (result.success) {
            copiedFiles.push({
              source: 'COA_Arsiv',
              row: i + 1,
              fileName: result.fileName,
              fileType: result.mimeType
            });
          } else {
            errorFiles.push({
              source: 'COA_Arsiv',
              row: i + 1,
              fileId: fileId,
              error: result.error
            });
          }
        }
      }
    }
    
    // 2. COA_Templates sheet'inden dosyaları topla
    const templateSheet = ss.getSheetByName('COA_Templates');
    if (templateSheet) {
      const data = templateSheet.getDataRange().getValues();
      const headers = data[0];
      
      // Template görsel URL sütununu bul
      const imageUrlIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('image'));
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        if (imageUrlIdx >= 0 && row[imageUrlIdx]) {
          totalFiles++;
          const fileId = extractFileId(row[imageUrlIdx].toString());
          
          if (fileId) {
            const result = copyFileSafely(fileId, targetFolder, supportedTypes, supportedExtensions);
            if (result.success) {
              copiedFiles.push({
                source: 'COA_Templates',
                supplier: row[0],
                fileName: result.fileName,
                fileType: result.mimeType
              });
            } else {
              errorFiles.push({
                source: 'COA_Templates',
                supplier: row[0],
                fileId: fileId,
                error: result.error
              });
            }
          }
        }
      }
    }
    
    return {
      success: true,
      folderUrl: targetFolder.getUrl(),
      folderId: targetFolder.getId(),
      folderName: targetFolderName,
      stats: {
        totalFound: totalFiles,
        copied: copiedFiles.length,
        errors: errorFiles.length
      },
      copiedFiles: copiedFiles,
      errorFiles: errorFiles
    };
    
  } catch(error) {
    return {
      success: false,
      error: 'Dosya toplama hatası: ' + error.toString()
    };
  }
}

/**
 * Merkezi arşiv klasörü bilgilerini getir
 */
function getCentralArchiveInfo() {
  try {
    const folder = getCentralArchiveFolder();
    const files = folder.getFiles();
    let fileCount = 0;
    
    while (files.hasNext()) {
      files.next();
      fileCount++;
    }
    
    return {
      success: true,
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      folderName: folder.getName(),
      fileCount: fileCount
    };
  } catch(error) {
    return {
      success: false,
      error: 'Merkezi arşiv klasörü bilgisi alınamadı: ' + error.toString()
    };
  }
}

/**
 * Mevcut tüm dosyaları merkezi arşive senkronize et
 */
function syncExistingFilesToArchive() {
  try {
    const centralFolder = getCentralArchiveFolder();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let syncedFiles = [];
    let skippedFiles = [];
    let errorFiles = [];
    let totalProcessed = 0;
    
    Logger.log('🔄 Mevcut dosyalar merkezi arşive senkronize ediliyor...');
    
    // 1. COA_Arsiv sheet'indeki dosyaları sync et
    const coaSheet = getSheet();
    if (coaSheet) {
      const data = coaSheet.getDataRange().getValues();
      const headers = data[0];
      
      // Drive File ID sütununu bul
      const fileIdIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('drivefile'));
      
      if (fileIdIdx >= 0) {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const fileId = row[fileIdIdx];
          
          if (fileId) {
            totalProcessed++;
            try {
              const file = DriveApp.getFileById(fileId);
              const fileName = file.getName();
              
              // Merkezi arşivde var mı kontrol et
              const existingFiles = centralFolder.getFilesByName(fileName);
              if (existingFiles.hasNext()) {
                skippedFiles.push({
                  source: 'COA_Arsiv',
                  fileName: fileName,
                  reason: 'Zaten var'
                });
                Logger.log('⏭️ Atlandı (zaten var): ' + fileName);
              } else {
                // Kopyala
                const copiedFile = file.makeCopy(fileName, centralFolder);
                copiedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                syncedFiles.push({
                  source: 'COA_Arsiv',
                  fileName: fileName,
                  fileId: copiedFile.getId()
                });
                Logger.log('✅ Kopyalandı: ' + fileName);
              }
            } catch(error) {
              errorFiles.push({
                source: 'COA_Arsiv',
                fileId: fileId,
                error: error.toString()
              });
              Logger.log('❌ Hata: ' + error.toString());
            }
          }
        }
      }
    }
    
    // 2. COA_Templates sheet'indeki görselleri sync et
    const templateSheet = ss.getSheetByName('COA_Templates');
    if (templateSheet) {
      const data = templateSheet.getDataRange().getValues();
      const headers = data[0];
      
      // Template Image URL sütununu bul
      const imageUrlIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('image'));
      
      if (imageUrlIdx >= 0) {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const imageUrl = row[imageUrlIdx];
          
          if (imageUrl) {
            totalProcessed++;
            const fileId = extractFileId(imageUrl.toString());
            
            if (fileId) {
              try {
                const file = DriveApp.getFileById(fileId);
                const fileName = file.getName();
                
                // Merkezi arşivde var mı kontrol et
                const existingFiles = centralFolder.getFilesByName(fileName);
                if (existingFiles.hasNext()) {
                  skippedFiles.push({
                    source: 'COA_Templates',
                    supplier: row[0],
                    fileName: fileName,
                    reason: 'Zaten var'
                  });
                  Logger.log('⏭️ Atlandı (zaten var): ' + fileName);
                } else {
                  // Kopyala
                  const copiedFile = file.makeCopy(fileName, centralFolder);
                  copiedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                  syncedFiles.push({
                    source: 'COA_Templates',
                    supplier: row[0],
                    fileName: fileName,
                    fileId: copiedFile.getId()
                  });
                  Logger.log('✅ Kopyalandı: ' + fileName);
                }
              } catch(error) {
                errorFiles.push({
                  source: 'COA_Templates',
                  supplier: row[0],
                  fileId: fileId,
                  error: error.toString()
                });
                Logger.log('❌ Hata: ' + error.toString());
              }
            }
          }
        }
      }
    }
    
    Logger.log('✅ Senkronizasyon tamamlandı!');
    Logger.log(`📊 İstatistik: ${totalProcessed} işlendi, ${syncedFiles.length} kopyalandı, ${skippedFiles.length} atlandı, ${errorFiles.length} hata`);
    
    return {
      success: true,
      folderUrl: centralFolder.getUrl(),
      folderId: centralFolder.getId(),
      stats: {
        totalProcessed: totalProcessed,
        synced: syncedFiles.length,
        skipped: skippedFiles.length,
        errors: errorFiles.length
      },
      syncedFiles: syncedFiles,
      skippedFiles: skippedFiles,
      errorFiles: errorFiles
    };
    
  } catch(error) {
    Logger.log('❌ Senkronizasyon hatası: ' + error.toString());
    return {
      success: false,
      error: 'Senkronizasyon hatası: ' + error.toString()
    };
  }
}

/**
 * Drive dosyasını sil (trash'e taşı)
 * Hem orijinal dosyayı hem merkezi arşivdeki kopyasını siler
 */
function deleteDriveFile(fileId) {
  try {
    if (!fileId) {
      return { success: false, error: 'File ID eksik' };
    }
    
    let deletedFiles = [];
    let errors = [];
    
    // 1. Orijinal dosyayı sil
    try {
      const file = DriveApp.getFileById(fileId);
      const fileName = file.getName();
      file.setTrashed(true);
      
      Logger.log('🗑️ Orijinal dosya silindi: ' + fileName);
      deletedFiles.push({
        location: 'Orijinal',
        fileName: fileName,
        fileId: fileId
      });
      
      // 2. Merkezi arşivde aynı isimdeki dosyayı bul ve sil
      try {
        const centralFolder = getCentralArchiveFolder();
        const filesInArchive = centralFolder.getFilesByName(fileName);
        
        let archiveDeleteCount = 0;
        while (filesInArchive.hasNext()) {
          const archiveFile = filesInArchive.next();
          archiveFile.setTrashed(true);
          archiveDeleteCount++;
          
          Logger.log('🗑️ Merkezi arşivden silindi: ' + fileName);
          deletedFiles.push({
            location: 'Merkezi Arşiv',
            fileName: fileName,
            fileId: archiveFile.getId()
          });
        }
        
        if (archiveDeleteCount === 0) {
          Logger.log('ℹ️ Merkezi arşivde dosya bulunamadı: ' + fileName);
        }
        
      } catch(archiveError) {
        Logger.log('⚠️ Merkezi arşiv silme hatası: ' + archiveError.toString());
        errors.push('Merkezi arşiv: ' + archiveError.toString());
      }
      
    } catch(originalError) {
      Logger.log('❌ Orijinal dosya silme hatası: ' + originalError.toString());
      errors.push('Orijinal dosya: ' + originalError.toString());
    }
    
    // Sonuç
    if (deletedFiles.length > 0) {
      return {
        success: true,
        message: deletedFiles.length + ' dosya silindi',
        deletedFiles: deletedFiles,
        errors: errors.length > 0 ? errors : undefined,
        fileName: deletedFiles[0].fileName
      };
    } else {
      return {
        success: false,
        error: 'Hiçbir dosya silinemedi: ' + errors.join(', ')
      };
    }
    
  } catch(error) {
    Logger.log('❌ Dosya silme hatası: ' + error.toString());
    return {
      success: false,
      error: 'Dosya silinemedi: ' + error.toString()
    };
  }
}

/**
 * Dosya ID'sini URL'den çıkar
 */
function extractFileId(urlOrId) {
  if (!urlOrId) return null;
  
  const str = urlOrId.toString().trim();
  
  // Eğer zaten file ID ise (hiç / ve : içermiyor), direkt döndür
  if (!str.includes('/') && !str.includes(':') && str.length > 20) {
    return str;
  }
  
  // https://drive.google.com/file/d/FILE_ID/view formatı
  let match = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // https://drive.google.com/open?id=FILE_ID formatı
  match = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // https://drive.google.com/uc?export=view&id=FILE_ID formatı
  match = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Dosyayı güvenli şekilde kopyala
 */
function copyFileSafely(fileId, targetFolder, supportedTypes, supportedExtensions) {
  try {
    const file = DriveApp.getFileById(fileId);
    const fileName = file.getName();
    const mimeType = file.getMimeType();
    
    // Dosya türü kontrolü
    const isSupported = supportedTypes.includes(mimeType) || 
                        supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    
    if (!isSupported) {
      return {
        success: false,
        error: 'Desteklenmeyen dosya türü: ' + mimeType
      };
    }
    
    // Dosya zaten varsa üzerine yazma
    const existingFiles = targetFolder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      return {
        success: true,
        fileName: fileName,
        mimeType: mimeType,
        alreadyExists: true
      };
    }
    
    // Dosyayı kopyala
    const copiedFile = file.makeCopy(fileName, targetFolder);
    copiedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      fileName: fileName,
      mimeType: mimeType,
      copiedFileId: copiedFile.getId()
    };
    
  } catch(error) {
    return {
      success: false,
      error: error.toString()
    };
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
