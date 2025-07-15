// src/types/index.ts
export interface Plan {
  name: string;
  price: string;
  memberLimit: string;
  scheduleLimit: string;
  sheetMusicLimit: string;
}

export interface CommercialTransactionInfo {
  companyName: string;
  representative: string;
  address: string;
  contactEmail: string;
  plans: Plan[];
}
