// ==================== Ortak Konfigürasyon ====================
// Bu dosya index.html ve coa.html arasında paylaşılan ayarları içerir

const SharedConfig = {
    // Google Apps Script URL - tek yerden yönetim
    getGoogleScriptUrl: function() {
        return localStorage.getItem('google_script_url') || '';
    },
    
    setGoogleScriptUrl: function(url) {
        localStorage.setItem('google_script_url', url);
    },
    
    // JSONP helper function for CORS bypass
    jsonp: function(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const script = document.createElement('script');
            
            const timeout = setTimeout(() => {
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
                reject(new Error('JSONP timeout'));
            }, 30000);
            
            window[callbackName] = (data) => {
                clearTimeout(timeout);
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
                resolve(data);
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
                reject(new Error('JSONP request failed'));
            };
            
            script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
            document.body.appendChild(script);
        });
    },
    
    // Tedarikçi listesini Google Sheets'ten al
    getSuppliers: async function() {
        const url = this.getGoogleScriptUrl();
        if (!url) return [];
        
        try {
            const data = await this.jsonp(url + '?action=getSuppliers');
            return data.success ? (data.data || []) : [];
        } catch (error) {
            console.error('Tedarikçi listesi alınamadı:', error);
            return [];
        }
    },
    
    // COA verilerini al
    getCOAData: async function() {
        const url = this.getGoogleScriptUrl();
        if (!url) return [];
        
        try {
            const data = await this.jsonp(url + '?action=getAll');
            return data.success ? (data.data || []) : [];
        } catch (error) {
            console.error('COA verileri alınamadı:', error);
            return [];
        }
    },
    
    // Belirli tedarikçinin COA'larını al
    getCOABySupplier: async function(supplierName) {
        const url = this.getGoogleScriptUrl();
        if (!url) return [];
        
        try {
            const params = new URLSearchParams();
            params.append('action', 'getCOABySupplier');
            params.append('supplier', supplierName);
            
            const data = await this.jsonp(url + '?' + params.toString());
            return data.success ? (data.data || []) : [];
        } catch (error) {
            console.error('Tedarikçi COA verileri alınamadı:', error);
            return [];
        }
    },
    
    // Bağlantı durumunu kontrol et
    isConnected: function() {
        return !!this.getGoogleScriptUrl();
    },
    
    // Test bağlantısı
    testConnection: async function() {
        const url = this.getGoogleScriptUrl();
        if (!url) return { success: false, error: 'URL tanımlı değil' };
        
        try {
            const data = await this.jsonp(url + '?action=test');
            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Global erişim için
window.SharedConfig = SharedConfig;
