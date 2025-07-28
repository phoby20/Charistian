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
  verificationCode?: string; // 인증번호 필드 추가
  isEmailVerified: boolean; // 이메일 인증 여부 추가
}
