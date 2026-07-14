import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroCarousel, { type HeroSlide } from './HeroCarousel';

// framer-motion → passthrough divs so AnimatePresence doesn't defer rendering
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

// Supabase client mock — swappable per test
const selectResult: { data: HeroSlide[] | null } = { data: [] };
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve(selectResult),
          }),
        }),
      }),
    }),
  },
}));

const slide = (id: string, over: Partial<HeroSlide> = {}): HeroSlide => ({
  id,
  image_url: `/${id}.jpg`,
  title: `Title ${id}`,
  subtitle: `Sub ${id}`,
  badge_new: false,
  badge_label: null,
  cta_primary_label: null,
  cta_primary_href: null,
  cta_secondary_label: null,
  cta_secondary_href: null,
  order_index: 0,
  is_active: true,
  ...over,
});

const renderCarousel = (props: Partial<React.ComponentProps<typeof HeroCarousel>> = {}) =>
  render(
    <MemoryRouter>
      <HeroCarousel fallback={<div>FALLBACK_HERO</div>} {...props} />
    </MemoryRouter>,
  );

describe('HeroCarousel', () => {
  beforeEach(() => {
    selectResult.data = [];
  });

  it('renders fallback when there are no active slides', async () => {
    selectResult.data = [];
    renderCarousel();
    expect(await screen.findByText('FALLBACK_HERO')).toBeInTheDocument();
  });

  it('renders the first slide and hides arrows/dots for a single slide', async () => {
    selectResult.data = [slide('a')];
    renderCarousel();
    expect(await screen.findByText('Title a')).toBeInTheDocument();
    expect(screen.queryByLabelText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Próximo')).not.toBeInTheDocument();
  });

  it('navigates with next/prev arrows', async () => {
    selectResult.data = [slide('a'), slide('b'), slide('c')];
    renderCarousel({ autoPlayMs: 10_000_000 });

    expect(await screen.findByText('Title a')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Próximo'));
    await waitFor(() => expect(screen.getByText('Title b')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Anterior'));
    await waitFor(() => expect(screen.getByText('Title a')).toBeInTheDocument());

    // wrap-around backwards
    fireEvent.click(screen.getByLabelText('Anterior'));
    await waitFor(() => expect(screen.getByText('Title c')).toBeInTheDocument());
  });

  it('jumps to a specific slide via pagination dots', async () => {
    selectResult.data = [slide('a'), slide('b'), slide('c')];
    renderCarousel({ autoPlayMs: 10_000_000 });

    expect(await screen.findByText('Title a')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Ir para slide 3'));
    await waitFor(() => expect(screen.getByText('Title c')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Ir para slide 2'));
    await waitFor(() => expect(screen.getByText('Title b')).toBeInTheDocument());
  });

  it('auto-advances after the configured interval', async () => {
    selectResult.data = [slide('a'), slide('b')];
    renderCarousel({ autoPlayMs: 50 });

    expect(await screen.findByText('Title a')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Title b')).toBeInTheDocument(), {
      timeout: 2000,
    });
  });
});
