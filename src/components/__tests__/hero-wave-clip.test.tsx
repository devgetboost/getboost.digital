import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageHero from '@/components/PageHero';
import HeroCarousel, { type HeroSlide } from '@/components/HeroCarousel';

// framer-motion → passthrough
vi.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (tag: string) =>
    React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement(tag, { ref, ...props }, children),
    );
  return {
    motion: new Proxy({}, { get: (_t, key: string) => passthrough(key) }),
    AnimatePresence: ({ children }: any) => children,
  };
});

// Supabase mock — 1 slide so HeroCarousel renders the section
const slide: HeroSlide = {
  id: 'x', image_url: '/x.jpg', title: 'T', subtitle: null,
  badge_new: false, badge_label: null,
  cta_primary_label: null, cta_primary_href: null,
  cta_secondary_label: null, cta_secondary_href: null,
  order_index: 0, is_active: true,
};
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: [slide] }) }),
        }),
      }),
    }),
  },
}));

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

describe('hero wave clip — regressão visual (estrutural)', () => {
  it('CSS declara mask-image (desktop) na regra .hero-wave-clip', () => {
    const rule = css.match(/\.hero-wave-clip\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toMatch(/mask-image:\s*url\(/);
    expect(rule).toMatch(/-webkit-mask-image:\s*url\(/);
    expect(rule).toMatch(/mask-size:\s*100%\s+100%/);
  });

  it('CSS inclui fallback via @supports not (mask-image) usando clip-path', () => {
    expect(css).toMatch(/@supports not \(\(mask-image[^)]+\)[^{]*\{[\s\S]*?clip-path/);
  });

  it('PageHero renderiza <section> com a classe hero-wave-clip', () => {
    const { container } = render(
      <MemoryRouter>
        <PageHero title="Test" />
      </MemoryRouter>,
    );
    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    expect(section!.className).toMatch(/\bhero-wave-clip\b/);
  });

  it('HeroCarousel renderiza <section> com a classe hero-wave-clip', async () => {
    const { container, findByText } = render(
      <MemoryRouter>
        <HeroCarousel fallback={<div>fb</div>} />
      </MemoryRouter>,
    );
    await findByText('T');
    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    expect(section!.className).toMatch(/\bhero-wave-clip\b/);
  });
});
