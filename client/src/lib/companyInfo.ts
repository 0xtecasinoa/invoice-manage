/** 請求書PDF/Excel出力用の自社情報（設定画面と同期可能） */
export interface CompanyInfo {
  name: string;
  representative: string;
  registrationNumber: string;
  address: string;
  tel: string;
  fax: string;
  /** 振込先: 銀行名 支店名 */
  bankName?: string;
  /** 口座種別: 普通 / 当座 等 */
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export const defaultCompanyInfo: CompanyInfo = {
  name: "株式会社 KATATI",
  representative: "代表取締役 松木照利",
  registrationNumber: "T7040001125249",
  address: "〒283-0801 千葉県東金市八坂台5-2-4",
  tel: "050-5480-5378",
  fax: "050-3588-0057",
  bankName: "千葉銀行 東金支店",
  accountType: "普通",
  accountNumber: "4239752",
  accountHolder: "(株)KATATI代表取締役 松木照利",
};
