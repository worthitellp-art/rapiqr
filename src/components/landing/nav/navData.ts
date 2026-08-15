export interface NavItem {
  label: string;
  href: string;
  sectionId: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'How It Works', href: '#how-it-works', sectionId: 'how-it-works' },
  { label: 'Use Cases', href: '#categories', sectionId: 'categories' },
  { label: 'Features', href: '#demo', sectionId: 'demo' },
  { label: 'Pricing', href: '#pricing', sectionId: 'pricing' },
  { label: 'FAQ', href: '#faq', sectionId: 'faq' },
];
