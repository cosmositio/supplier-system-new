import streamlit as st
import pandas as pd
import io

st.set_page_config(page_title="Tedarikçi Analiz", page_icon="📊", layout="wide")

st.title("📊 Tedarikçi Performans Analizi")
st.markdown("---")

# Dosya yükleme
uploaded_file = st.file_uploader("Excel dosyanızı yükleyin", type=['xlsx', 'xls'])

if uploaded_file is not None:
    try:
        # Excel dosyasını oku
        df = pd.read_excel(uploaded_file)
        
        st.success("✅ Dosya başarıyla yüklendi!")
        
        # Veri önizlemesi
        with st.expander("📋 Veri Önizlemesi"):
            st.dataframe(df.head(20))
        
        # Sütun isimleri
        st.subheader("📌 Sütun İsimleri:")
        st.write(df.columns.tolist())
        
        # Tedarikçi sütununu bul
        tedarikciler = None
        for col in df.columns:
            if 'tedarik' in col.lower() or 'firma' in col.lower() or 'supplier' in col.lower():
                tedarikciler = df[col].unique()
                st.info(f"Tedarikçi sütunu bulundu: **{col}**")
                st.write(f"Toplam {len(tedarikciler)} tedarikçi bulundu")
                break
        
        if st.button("🔍 Analiz Yap", type="primary"):
            st.markdown("---")
            st.subheader("📊 Tedarikçi Bazlı Hesaplamalar")
            
            # Tedarikçi sütununu belirle
            tedarikciler_sutun = None
            for col in df.columns:
                if 'tedarik' in col.lower() or 'firma' in col.lower() or 'supplier' in col.lower():
                    tedarikciler_sutun = col
                    break
            
            if tedarikciler_sutun is None:
                st.error("❌ Tedarikçi sütunu bulunamadı!")
            else:
                # Her tedarikçi için hesaplama
                sonuclar = []
                
                for tedarikciler in df[tedarikciler_sutun].unique():
                    tedarikciler_df = df[df[tedarikciler_sutun] == tedarikciler]
                    
                    # Sevk, İade, PPM, Hata kolonlarını bul
                    toplam_sevk = 0
                    toplam_iade = 0
                    toplam_hata = 0
                    
                    for col in df.columns:
                        col_lower = col.lower()
                        
                        if 'sevk' in col_lower or 'sevkiyat' in col_lower:
                            toplam_sevk += tedarikciler_df[col].sum()
                        
                        if 'iade' in col_lower or 'iade' in col_lower:
                            toplam_iade += tedarikciler_df[col].sum()
                        
                        if 'hata' in col_lower or 'error' in col_lower:
                            toplam_hata += tedarikciler_df[col].sum()
                    
                    # PPM hesapla
                    if toplam_sevk > 0:
                        ppm = (toplam_iade / toplam_sevk) * 1000000
                    else:
                        ppm = 0
                    
                    sonuclar.append({
                        'Tedarikçi': tedarikciler,
                        'Toplam Sevkiyat': toplam_sevk,
                        'Toplam İade': toplam_iade,
                        'PPM': round(ppm, 2),
                        'Toplam Hata Sayısı': toplam_hata
                    })
                
                # Sonuçları DataFrame'e çevir
                sonuc_df = pd.DataFrame(sonuclar)
                
                # Sonuçları göster
                st.dataframe(sonuc_df, use_container_width=True)
                
                # Excel olarak indir
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    sonuc_df.to_excel(writer, index=False, sheet_name='Tedarikçi Analizi')
                    
                    # Sütun genişliklerini ayarla
                    worksheet = writer.sheets['Tedarikçi Analizi']
                    for idx, col in enumerate(sonuc_df.columns):
                        max_length = max(
                            sonuc_df[col].astype(str).apply(len).max(),
                            len(str(col))
                        ) + 2
                        worksheet.column_dimensions[chr(65 + idx)].width = max_length
                
                output.seek(0)
                st.download_button(
                    label="📥 Sonuçları Excel Olarak İndir",
                    data=output,
                    file_name="tedarikciler_analiz_sonuclari.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                
                # Grafik
                st.markdown("---")
                st.subheader("📈 Görselleştirme")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.bar_chart(sonuc_df.set_index('Tedarikçi')['Toplam Sevkiyat'])
                    st.caption("Toplam Sevkiyat")
                
                with col2:
                    st.bar_chart(sonuc_df.set_index('Tedarikçi')['PPM'])
                    st.caption("PPM Değerleri")
    
    except Exception as e:
        st.error(f"❌ Hata oluştu: {str(e)}")
        st.write("Lütfen Excel dosyanızın formatını kontrol edin.")

else:
    st.info("👆 Lütfen bir Excel dosyası yükleyin")
    
    # Örnek format göster
    st.markdown("---")
    st.subheader("📝 Beklenen Format Örneği:")
    st.markdown("""
    Excel dosyanızda şu sütunlar olmalı:
    - **Tedarikçi** (veya Firma) sütunu
    - **1, 2, 3, ... 12** ay sütunları
    - Her ay için: **İade, Sevk, PPM, Hata Sayısı** verileri
    """)
