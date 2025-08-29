import type { FormattedProposalProduct, ProposalProduct } from './types';

export class ProposalFormatter {
  /**
   * Coverage field'larını Türkçe isimlere çevirir
   */
  private static getCoverageFieldName(field: string): string {
    const fieldNames: Record<string, string> = {
      immLimitiAyrimsiz: 'İMM Limiti Ayrımsız',
      ferdiKazaVefat: 'Ferdi Kaza Vefat',
      ferdiKazaSakatlik: 'Ferdi Kaza Sakatlık',
      ferdiKazaTedaviMasraflari: 'Ferdi Kaza Tedavi Masrafları',
      anahtarKaybi: 'Anahtar Kaybı',
      maneviTazminat: 'Manevi Tazminat',
      onarimServisTuru: 'Onarım Servis Türü',
      yedekParcaTuru: 'Yedek Parça Türü',
      camKirilmaMuafeyeti: 'Cam Kırılma Muafiyeti',
      kiralikArac: 'Kiralık Araç',
      hukuksalKorumaAracaBagli: 'Hukuki Koruma Araca Bağlı',
      ozelEsya: 'Özel Eşya',
      sigaraMaddeZarari: 'Sigara Madde Zararı',
      patlayiciMaddeZarari: 'Patlayıcı Madde Zararı',
      kemirgenZarari: 'Kemirgen Zararı',
      yukKaymasiZarari: 'Yük Kayması Zararı',
      eskime: 'Eskime',
      hasarsizlikIndirimKoruma: 'Hasarsızlık İndirimi Koruma',
      yurtdisiKasko: 'Yurtdışı Kasko',
      aracCalinmasi: 'Araç Çalınması',
      anahtarCalinmasi: 'Anahtar Çalınması',
      hukuksalKorumaSurucuyeBagli: 'Hukuki Koruma Sürücüye Bağlı',
      miniOnarim: 'Mini Onarım',
      yolYardim: 'Yol Yardım',
      yanlisAkaryakitDolumu: 'Yanlış Akaryakıt Dolumu',
      yanma: 'Yanma',
      carpma: 'Çarpma',
      carpisma: 'Çarpışma',
      glkhhTeror: 'GLKH ve Terör',
      grevLokavt: 'Grev ve Lokavt',
      dogalAfetler: 'Doğal Afetler',
      hirsizlik: 'Hırsızlık',
      productBranch: 'Ürün Dalı',
    };

    return fieldNames[field] || field;
  }

  /**
   * String değerleri çevirir
   */
  private static translateStringValue(value: string): string {
    const translations: Record<string, string> = {
      SIGORTALI_BELIRLER: 'Sigortalı Belirler',
      ORIJINAL_PARCA: 'Orijinal Parça',
      BELIRSIZ: 'Belirsiz',
      UNDEFINED: 'Belirsiz',
      UNKNOWN: 'Belirsiz',
    };

    return translations[value] || value;
  }

  /**
   * Coverage objesini temizler ve çevirir
   */
  private static cleanCoverage(coverage: any): any {
    if (!coverage || typeof coverage !== 'object') return {};

    const cleaned: any = {};

    for (const [key, value] of Object.entries(coverage)) {
      if (value === null || value === undefined) continue;

      // $type kontrolü olmayan direk string/primitive değerler için
      if (key === '$type' || key === 'productBranch') continue;

      // String değerler için kontroller
      if (typeof value === 'string') {
        const fieldName = this.getCoverageFieldName(key);
        const translatedValue = this.translateStringValue(value);
        // Belirsiz değerleri skip et
        if (translatedValue === 'Belirsiz') continue;
        cleaned[fieldName] = translatedValue;
      }
      // Object değerler için kontroller
      else if (typeof value === 'object' && value !== null) {
        const objValue = value as any;

        // $type kontrolü
        if (objValue.$type) {
          const fieldName = this.getCoverageFieldName(key);

          if (objValue.$type === 'DECIMAL' && typeof objValue.value === 'number') {
            cleaned[fieldName] = `${objValue.value.toLocaleString('tr-TR')} TL`;
          } else if (objValue.$type === 'DEFINED' && objValue.yillikKullanimSayisi !== undefined) {
            // Kiralık araç detayları - eğer yıllık kullanım 0 ise "Yok" göster
            if (objValue.yillikKullanimSayisi === 0) {
              cleaned[fieldName] = 'Yok';
            } else {
              cleaned[fieldName] = {
                'Yıllık Kullanım Sayısı': objValue.yillikKullanimSayisi,
                'Tek Seferlik Gün Sayısı': objValue.tekSeferlikGunSayisi,
                'Araç Segmenti': objValue.aracSegment || 'Belirtilmemiş',
              };
            }
          } else if (objValue.$type === 'HIGHEST_LIMIT') {
            cleaned[fieldName] = 'En Yüksek Limit';
          } else if (objValue.$type === 'MARKET_VALUE') {
            cleaned[fieldName] = 'Rayiç';
          } else if (objValue.$type === 'INCLUDED') {
            cleaned[fieldName] = 'Dahil';
          } else if (objValue.$type === 'NONE') {
            cleaned[fieldName] = 'Yok';
          }
          // UNDEFINED değerleri hiç gösterme
        }
      }
      // Number, boolean vs diğer değerler
      else {
        const fieldName = this.getCoverageFieldName(key);
        cleaned[fieldName] = value;
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  /**
   * Coverage objelerini temizler ve Türkçe formatlar
   */
  public static formatCoverage(coverage: any): any {
    return this.cleanCoverage(coverage);
  }

  /**
   * Para birimi kodunu kısaltmaya çevirir
   */
  private static getCurrencySymbol(currency: string): string {
    const currencyMap: Record<string, string> = {
      TURKISH_LIRA: 'TL',
      USD: '$',
      EUR: '€',
    };
    return currencyMap[currency] || 'TL';
  }

  /**
   * Tek bir proposal product'ını formatlar (sadece ürün bilgileri)
   */
  private static formatSingleProduct(product: ProposalProduct): FormattedProposalProduct {
    // Taksit seçenekleri ve fiyatları (benzersiz installment number'ları sıralı olarak)
    const installmentOptions = [...new Set(product.premiums.map((p) => p.installmentNumber))].sort(
      (a, b) => a - b,
    );

    // Her taksit seçeneği için fiyat bilgisi
    const taksitFiyatlari: Record<string, string> = {};
    installmentOptions.forEach((installmentNum) => {
      const premium = product.premiums.find((p) => p.installmentNumber === installmentNum);
      if (premium) {
        const taksitKey = installmentNum === 1 ? 'Peşin (1 Taksit)' : `${installmentNum} Taksit`;
        const currencySymbol = this.getCurrencySymbol(premium.currency);
        taksitFiyatlari[taksitKey] =
          `${premium.grossPremium.toLocaleString('tr-TR')} ${currencySymbol}`;
      }
    });

    // Coverage bilgilerini temizle
    const cleanedPdfCoverage = this.cleanCoverage(product.pdfCoverage);

    return {
      id: product.id,
      insuranceCompanyId: product.insuranceCompanyId,
      productId: product.productId,

      // Prim bilgileri - her taksit ayrı ayrı (para birimi kısaltması fiyatın yanında)
      primBilgileri: taksitFiyatlari,

      // Sadece PDF coverage'ı - temizlenmiş hali
      teminatlar: cleanedPdfCoverage,

      // Durum bilgileri
      durum: product.state === 'ACTIVE' ? 'Aktif' : product.state,
      meslekiIndirimi: product.hasVocationalDiscount ? 'Var' : 'Yok',
      hasarsizlikIndirimi: product.hasUndamagedDiscount ? 'Var' : 'Yok',
      sirketAdi: product.insuranceCompanyName,
      sirketLogo: product.insuranceCompanyLogo,
      odemeSecenekleri: product.supportedPaymentOptions,

      // Hata mesajı varsa
      ...(product.errorMessage && { hata: product.errorMessage }),
    };
  }

  /**
   * Proposal products'ları formatlar ve aktif olanları filtreler (sadece ürün bilgileri)
   */
  static formatProposalProducts(products: ProposalProduct[]): FormattedProposalProduct[] {
    // Sadece aktif (state: "ACTIVE") teklifleri filtrele
    const activeProducts = products.filter((product) => product.state === 'ACTIVE');

    // Her ürünü formatla
    const formattedProducts = activeProducts.map((product) => this.formatSingleProduct(product));

    return formattedProducts;
  }
}
