
export const API_URL =
  process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';

export type BusinessCard = {
  id: string;
  slug: string;
  fullName: string;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
};

export type PublicCard = Pick<
  BusinessCard,
  | 'slug'
  | 'fullName'
  | 'jobTitle'
  | 'company'
  | 'bio'
  | 'email'
  | 'phone'
  | 'website'
>;
