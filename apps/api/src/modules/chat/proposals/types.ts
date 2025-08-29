export interface ProposalPremium {
  installmentNumber: number;
  netPremium: number;
  grossPremium: number;
  commission: number;
  exchangeRate: number;
  currency: 'TURKISH_LIRA' | 'USD' | 'EUR';
  insuranceCompanyProposalNumber: string;
}

export interface CoverageValue {
  $type:
    | 'DECIMAL'
    | 'HIGHEST_LIMIT'
    | 'MARKET_VALUE'
    | 'INCLUDED'
    | 'NONE'
    | 'UNDEFINED'
    | 'DEFINED';
  value?: number;
  yillikKullanimSayisi?: number;
  tekSeferlikGunSayisi?: number;
  aracSegment?: string;
}

export interface ProposalCoverage {
  $type: 'kasko';
  immLimitiAyrimsiz?: CoverageValue;
  ferdiKazaVefat?: CoverageValue;
  ferdiKazaSakatlik?: CoverageValue;
  ferdiKazaTedaviMasraflari?: CoverageValue;
  anahtarKaybi?: CoverageValue;
  maneviTazminat?: CoverageValue;
  onarimServisTuru?: string;
  yedekParcaTuru?: string;
  camKirilmaMuafeyeti?: CoverageValue;
  kiralikArac?: CoverageValue;
  hukuksalKorumaAracaBagli?: CoverageValue;
  ozelEsya?: CoverageValue;
  sigaraMaddeZarari?: CoverageValue;
  patlayiciMaddeZarari?: CoverageValue;
  kemirgenZarari?: CoverageValue;
  yukKaymasiZarari?: CoverageValue;
  eskime?: CoverageValue;
  hasarsizlikIndirimKoruma?: CoverageValue;
  yurtdisiKasko?: CoverageValue;
  aracCalinmasi?: CoverageValue;
  anahtarCalinmasi?: CoverageValue;
  hukuksalKorumaSurucuyeBagli?: CoverageValue;
  miniOnarim?: CoverageValue;
  yolYardim?: CoverageValue;
  yanlisAkaryakitDolumu?: CoverageValue;
  yanma?: CoverageValue;
  carpma?: CoverageValue;
  carpisma?: CoverageValue;
  glkhhTeror?: CoverageValue;
  grevLokavt?: CoverageValue;
  dogalAfetler?: CoverageValue;
  hirsizlik?: CoverageValue;
  productBranch?: string;
  [key: string]: any;
}

export interface ProposalProduct {
  id: string;
  insuranceCompanyId: number;
  productId: number;
  premiums: ProposalPremium[];
  initialCoverage?: ProposalCoverage;
  insuranceServiceProviderCoverage?: ProposalCoverage | null;
  pdfCoverage?: ProposalCoverage | null;
  state: 'ACTIVE' | 'FAILED' | 'PENDING';
  needsInvestigationByCompany: boolean;
  hasVocationalDiscount: boolean;
  hasUndamagedDiscount: boolean;
  revised: boolean;
  errorMessage?: string | null;
  policyId?: string | null;
  insuranceCompanyName: string;
  insuranceCompanyLogo: string;
  productName: string;
  productType: string;
  coverageGroupId: unknown;
  coverageGroupName: unknown;
  supportedPaymentOptions: ('SYNC_CREDIT_CARD' | 'ASYNC_INSURANCE_COMPANY_REDIRECT')[];
}

export interface ProposalProductsResponse {
  success: boolean;
  products: ProposalProduct[];
  error?: string;
}

// Formatlanmış veri türleri
export interface FormattedPremiumInfo {
  [key: string]: string; // Her taksit seçeneği için dinamik field'lar (ör: "Peşin (1 Taksit)": "28.313,1 TL", "2 Taksit": "28.800,0 $")
}

export interface FormattedCoverage {
  [key: string]: string | number | object;
}

export interface FormattedProposalProduct {
  id: string;
  insuranceCompanyId: number;
  insuranceCompanyName?: string; // Şirket ismi
  productId: number;
  primBilgileri: FormattedPremiumInfo;
  teminatlar: FormattedCoverage | null;
  durum: string;
  meslekiIndirimi: string;
  hasarsizlikIndirimi: string;
  hata?: string;
  sirketAdi: string;
  sirketLogo: string;
  odemeSecenekleri: ('SYNC_CREDIT_CARD' | 'ASYNC_INSURANCE_COMPANY_REDIRECT')[];
}

export interface FormattedProposalProductsResponse {
  success: boolean;
  data: FormattedProposalProduct[];
  message?: string;
  error?: string;
}

