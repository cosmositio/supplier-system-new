// OSS-DocumentScanner Düzeltme Script'i
// Kullanım: Bu kodu coa.html ve coa-arsiv.html'deki openDocumentScanner fonksiyonuyla değiştir

function openDocumentScanner() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
        const packageName = 'com.akylas.documentscanner';
        // Launcher intent - uygulamayı sistem launcher gibi başlat
        const launchIntent = `intent://launch#Intent;package=${packageName};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
        
        window.location.href = launchIntent;
        showToast('📸 OSS-DocumentScanner açılıyor...', 'info');
        
        // Fallback
        setTimeout(() => {
            if (document.hasFocus()) {
                showToast('📷 Normal kamera açılıyor...', 'warning');
                document.getElementById('cameraInput').click();
            }
        }, 1500);
        
    } else if (isIOS) {
        window.location.href = 'documentscanner://';
        showToast('📸 OSS-DocumentScanner açılıyor...', 'info');
        
        setTimeout(() => {
            if (document.hasFocus()) {
                document.getElementById('cameraInput').click();
            }
        }, 1500);
        
    } else {
        showToast('⚠️ Sadece mobil cihazlarda çalışır', 'warning');
        document.getElementById('cameraInput').click();
    }
}
