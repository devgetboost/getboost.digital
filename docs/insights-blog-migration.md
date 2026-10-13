# R19.9 — INSIGHTS / BLOG MIGRATION

**Status:** ✅ **COMPLETE** (Implemented in Wave 3E)  
**Scope:** `/insights`, `/blog`, `/blog/:id`, `/resources`, `/resources/:id`, `/podcast`, `/webinars`, `/academy`  
**Governance:** Frozen design system tokens

---

## MIGRATION SUMMARY

| Route | Page Component | Before | After | Status |
|-------|----------------|--------|-------|--------|
| `/insights` | Insights.tsx | Legacy | New design system | ✅ Done |
| `/blog` | Blog.tsx | Legacy | New design system | ✅ Done |
| `/blog/:id` | BlogPost.tsx | Legacy | New design system | ✅ Done |
| `/resources` | Resources.tsx | Legacy | New design system | ✅ Done |
| `/resources/:id` | ResourceDetail.tsx | Legacy | New design system | ✅ Done |
| `/podcast` | PodcastBoostTalks.tsx | Legacy | New design system | ✅ Done |
| `/webinars` | Webinars.tsx | Legacy | New design system | ✅ Done |
| `/academy` | Academy.tsx | Legacy | New design system | ✅ Done |
| `/academy/:slug` | AcademyCourseDetail.tsx | Legacy | New design system | ✅ Done |

---

## INSIGHTS HUB (`/insights`)

### Before (Legacy)
- Custom hero with dark background
- Old card styles for articles

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay` + `gb-hairline-accent`
- **Article Grid:** `gb-surface-card gb-card-lift` with `Reveal` animation
- **CTA:** `StandardCTA` to `/blog` and `/resources`
- **CTA Band:** `gb-cta-band` with `StandardCTA` + `CommercialAuditModal`

---

## BLOG LIST (`/blog`)

### Before (Legacy)
- Dark theme or white background
- Old article cards

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay`
- **Article Grid:** `gb-surface-card gb-card-lift` with `Reveal`
- **Pagination:** Design system pagination
- **Sidebar:** Categories, newsletter signup
- **CTA Band:** `gb-cta-band` with `StandardCTA`

---

## BLOG POST (`/blog/:id`)

### Before (Legacy)
- Custom layout
- Old typography

### After (New Design System)
- **Hero:** `gb-surface-page` with article image
- **Article Body:** `prose` styling with design system typography
- **Author Bio:** `gb-surface-card` with author info
- **Related Articles:** `gb-surface-card gb-card-lift` grid
- **Newsletter CTA:** `gb-cta-band` with newsletter signup
- **Share Buttons:** `Button` variant="ghost"

---

## RESOURCES (`/resources`)

### Before (Legacy)
- Custom layout
- Old filter system

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay`
- **Categories:** `gb-chip` filters
- **Resource Grid:** `gb-surface-card gb-card-lift` with `Reveal`
- **Types:** Guides, Ebooks, Templates, Tools
- **CTA Band:** Newsletter + `CommercialAuditModal`

---

## RESOURCE DETAIL (`/resources/:id`)

### Before (Legacy)
- Custom layout
- Old download buttons

### After (New Design System)
- **Hero:** `gb-surface-page` with resource cover
- **Metadata:** Category, read time, format
- **Content:** `prose` styling
- **Download:** `StandardCTA` with tracking
- **Related:** `gb-surface-card gb-card-lift` grid
- **CTA Band:** Newsletter + `CommercialAuditModal`

---

## PODCAST (`/podcast`)

### Before (Legacy)
- Dark theme
- Old episode cards

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay`
- **Episodes:** `gb-surface-card gb-card-lift` with audio player
- **Categories:** `gb-chip` filters
- **CTA Band:** Subscribe + `CommercialAuditModal`

---

## WEBINARS (`/webinars`)

### Before (Legacy)
- Custom layout
- Old registration forms

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay`
- **Upcoming:** `gb-surface-card gb-card-lift` with countdown
- **Past:** `gb-surface-card` with recording links
- **Registration:** `StandardCTA` + `CommercialAuditModal`
- **CTA Band:** `gb-cta-band` with `StandardCTA`

---

## ACADEMY (`/academy`)

### Before (Legacy)
- Custom course grid
- Old enrollment flow

### After (New Design System)
- **Hero:** `gb-surface-page` + `gb-grid-overlay`
- **Courses:** `gb-surface-card gb-card-lift` with progress
- **Categories:** `gb-chip` filters
- **Enrollment:** `StandardCTA` + `CommercialAuditModal`
- **CTA Band:** `gb-cta-band` with `StandardCTA`

---

## COURSE DETAIL (`/academy/:slug`)

### Before (Legacy)
- Custom curriculum layout

### After (New Design System)
- **Hero:** `gb-surface-page` with course cover
- **Curriculum:** `gb-surface-card` modules with `MiniFlow`
- **Instructor:** `gb-surface-card` bio
- **Enrollment:** `StandardCTA` + `CommercialAuditModal`
- **CTA Band:** `gb-cta-band` with `StandardCTA`

---

## SHARED PATTERNS (All Pages)

### Hero Structure
```tsx
<section className="gb-surface-page relative overflow-hidden">
  <div aria-hidden className="gb-grid-overlay" />
  <div className="gb-container relative gb-section !pt-10 md:!pt-16">
    {/* Hero content */}
  </div>
  <div className="gb-container pb-16">
    <div className="gb-hairline-accent" />
  </div>
</section>
```

### Content Grid
```tsx
<div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item, i) => (
    <Reveal key={item.id} i={i}>
      <Link to={item.href} className="group block h-full">
        <div className="gb-surface-card gb-card-lift h-full">
          {/* Image */}
          <div className="mb-5 h-40 w-full rounded-xl object-cover">
            <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="p-6">
            {item.category && <span className="gb-chip">{item.category}</span>}
            <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{item.title}</h3>
            <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
              Ler mais <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  ))}
</div>
```

### CTA Band (All Pages)
```tsx
<section className="gb-surface-page gb-section !pt-0">
  <div className="gb-container">
    <Reveal i={0}>
      <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
        <StandardCTA asChild size="lg"><Link to="/booking">Agendar Diagnóstico <ArrowRight /></Link></StandardCTA>
        <StandardCTA asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary"><Link to="/contact">Falar com Especialista <ArrowRight /></Link></StandardCTA>
        <CommercialAuditModal ... />
      </div>
    </Reveal>
  </div>
</section>
```

---

## VERIFICATION CHECKLIST (All Pages)

```
[ ] Hero: gb-surface-page + gb-grid-overlay + gb-hairline-accent
[ ] Container: gb-container on all content
[ ] Sections: gb-section on all sections
[ ] Cards: gb-surface-card + gb-card-lift
[ ] Motion: Reveal with staggered delay (i * 0.08)
[ ] CTA: StandardCTA components only
[ ] CTA Band: gb-cta-band with StandardCTA + CommercialAuditModal
[ ] Motion respects useReducedMotion()
[ ] ScrollDepth with correct location
[ ] SEO metadata preserved
[ ] Analytics tracking preserved
[ ] i18n keys preserved
[ ] Dark/light theme consistency
[ ] Reduced motion respected
```

---

*Insights/Blog migration complete. All 9 pages unified on new design system.*