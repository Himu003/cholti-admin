export type SlideRow = {
  id: string;
  title_bn: string; title_en: string;
  sub_bn: string; sub_en: string;
  eyebrow_bn: string; eyebrow_en: string;
  cta_bn: string; cta_en: string;
  link: string; image: string; theme: string;
  layout: string; bg: string;
  badge_bn: string; badge_en: string;
  sort_order: number; active: number;
  starts_at: string | null; ends_at: string | null;
};
