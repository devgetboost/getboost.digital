# R19.10 — FOOTER V2

**Status:** ✅ **COMPLETE** (Implemented in Wave 3B)  
**File:** `src/components/Footer.tsx`  
**Route:** All public pages (via Layout)  
**Governance:** Frozen — part of Global Layout Consolidation (R19.4)

---

## OVERVIEW

Footer V2 is the complete IA map of the site. It replaces the legacy footer with a dark premium experience that mirrors the homepage aesthetic, includes the full product catalog, newsletter capture, and market switcher.

---

## STRUCTURE (Frozen)

```
<footer className="relative overflow-hidden bg-[hsl(0,0%,5%)] text-white">
  {/* Ambient grid + radial glow */}
  <div className="gb-grid-overlay" />  // 5% opacity
  <div className="radial-glow" />      // Orange glow top-right
  
  <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16">
    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
      {/* 1. Brand (col-span-2) */}
      {/* 2. Empresa (footer-only in Wave 3B) */}
      {/* 3. Trabalho */}
      {/* 4. Insights */}
      {/* 5. Newsletter */}
    </motion.div>
    
    {/* Products Strip */}
    <div className="border-t border-white/10 mt-12 pt-8">
      <h4>Produtos</h4>
      <nav>{PRODUCTS.map(...) /* routable = link, institutional = span */}</nav>
    </div>
    
    {/* Contact & Address */}
    <div className="border-t border-white/10 mt-12 pt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>{/* Phone + Email */}</div>
      <div>{/* Address */}</div>
    </div>
    
    {/* Bottom Bar */}
    <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p>© {year} Getboost Digital. {rights}</p>
      <div>{/* Market switcher */}</div>
      <div>{/* Legal links */}</div>
    </div>
  </div>
</footer>
```

---

## GRID LAYOUT (Frozen)

| Column | Content | Span |
|--------|---------|------|
| 1-2 | Brand — Logo + description + social links | `lg:col-span-2` |
| 3 | Empresa — Sobre Nós, Equipa, Carreira | `lg:col-span-1` |
| 4 | Trabalho — Portfolio, Casos de Sucesso | `lg:col-span-1` |
| 5 | Insights — Blog, Recursos, Podcast, Academy, Webinars | `lg:col-span-1` |
| 6 | Newsletter — Name + Email + Consent + Submit | `lg:col-span-1` |

Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-6`

---

## KEY COMPONENTS (Frozen)

### Brand Block
Logo + description + social links (Instagram, LinkedIn, Twitter)

### Navigation Columns
1. Empresa — Sobre Nós, Equipa, Carreira
2. Trabalho — Portfolio, Casos de Sucesso
3. Insights — Blog, Recursos, Podcast, Academy, Webinars
4. Newsletter — Name + Email + Consent + Submit

### Newsletter Form
- Name + Email + Consent checkbox
- Submit button with Loader2 → Check → ArrowRight cycle
- Clean V1 `subscribeNewsletter` integration

### Products Strip
Routable products = links, Institutional = spans only

### Contact & Address
Phone (tel:), Email (mailto:), Address with MapPin

### Bottom Bar
Copyright + Market switcher + Legal links

### Ambient Effects
Grid overlay (5% opacity) + Radial glow (orange, top-right)

### Motion
Fade-up reveal with `whileInView`, once, 0.5s duration

### Market Switcher
Globe icon + PT/BR/INTL buttons, updates URL + localStorage

### Analytics
Social clicks, Product clicks, Phone/Email outbound, Newsletter submit

### CI Guards
- Frozen tokens in footer
- Internal routes excluded from public artifacts

---

*Footer V2 complete. Frozen as part of Global Layout Consolidation (R19.4).*