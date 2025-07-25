// src/types/church.ts
export interface ChurchFormData {
  churchName: string;
  country: string;
  city: string;
  region: string;
  address: string;
  churchPhone: string;
  superAdminEmail: string;
  password: string;
  contactName: string;
  contactPhone: string;
  contactGender: string;
  contactBirthDate: string;
  plan: string;
  logo?: File;
  contactImage?: File;
}
