# R19.11 — MOTION SYSTEM

**Status:** ✅ **COMPLETE** (Implemented in Wave R18.7, frozen in Wave 3A)  
**Scope:** All motion/animation across the platform  
**Governance:** Frozen — no new animation categories allowed

---

## FROZEN MOTION PRIMITIVES

| Primitive | Implementation | Reduced Motion |
|-----------|----------------|----------------|
| Fade Up | `opacity 0→1`, `y 30→0`, `duration 0.6`, `ease [0.16,1,0.3,1]` | Instant |
| Reveal | `whileInView` once, staggered via `custom` index | Instant |
| Float | `y: [0,-8,0]`, `duration 5-6s`, `repeat: Infinity`, `easeInOut` | Disabled |
| Card Lift | `translateY(-6px) scale(1.02)` + `box-shadow` + pillar glow | Instant |
| Link Underline | `scaleX(0→1)`, `origin: left`, `180ms` | Instant |
| Flow Connector | Marching ants — vertical mobile, horizontal desktop | Static |
| Parallax | `useScroll`/`useTransform` subtle `y` | Disabled |
| CTA Drift | Ellipse `x: [-50%,-46%,-50%]`, `14s`, `repeat: Infinity` | Disabled |

---

## IMPLEMENTATION PATTERNS (Frozen)

### Fade Up (Entrance)
```tsx
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const Reveal = ({ children, i = 0, className }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className={className}>
    {children}
  </motion.div>
);
```

### Float Loop (Ambient)
```tsx
<motion.div
  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
  transition={reduceMotion ? undefined : { duration: 5 + i * 1.3, repeat: Infinity, ease: 'easeInOut' }}
>
  {children}
</motion.div>
```

### Card Lift (Hover)
```tsx
<div className="gb-card gb-card-lift"> {children} </div>

/* CSS */
.gb-card-lift { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
.gb-card-lift:hover { transform: translateY(-6px) scale(1.02); box-shadow: var(--gb-shadow-hover), 0 18px 44px -16px var(--gb-glow, rgb(255 64 0 / 0.35)); }
```

### Link Underline (Micro-interaction)
```tsx
.gb-link-more::after { content: ""; position: absolute; left: 0; bottom: -2px; height: 1px; width: 100%; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 0.18s ease; }
.gb-link-more:hover::after { transform: scaleX(1); }
```

### Flow Connector (Mini Diagrams)
```tsx
.gb-flow-connector { --gb-flow-color: var(--gb-ink-tertiary); opacity: 0.55; }
@media (max-width: 639.98px) { /* vertical */ }
@media (min-width: 640px) { /* horizontal */ }
```

### CTA Drift (Ambient)
```tsx
<motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(255,64,0,0.22) 0%, rgba(0,0,0,0) 65%)' }} animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }} transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
```

### Parallax (Subtle)
```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
const y = useTransform(scrollYProgress, [0, 1], [0, 32]);
<motion.div style={{ y: reduceMotion ? 0 : y }} />
```

---

## REDUCED MOTION (Mandatory)

```tsx
const reduceMotion = useReducedMotion() ?? false;
animate={reduceMotion ? undefined : { ... }}
transition={reduceMotion ? undefined : { ... }}
```

**Rule:** Every motion primitive MUST respect `useReducedMotion()`. Animations become instant or disabled.

---

## FORBIDDEN (Never Introduce)

| Category | Forbidden |
|---|---|
| New animation categories | Only frozen primitives allowed |
| Custom easing curves | Only `[0.16, 1, 0.3, 1]` and `easeInOut` |
| New loop types | Only `Float` and `CTA Drift` loops allowed |
| Custom durations | Only frozen durations (0.18s, 0.5s, 0.6s, 5-6s, 14s) |
| New stagger patterns | Only `i * 0.08` stagger |
| CSS `@keyframes` | Use Framer Motion only |
| `setInterval`/`requestAnimationFrame` for animation | Framer Motion only |

---

## CI GUARDS

```typescript
it("runs on the frozen systems (no new animation or style categories)", () => {
  expect(PAGE).toContain("import { SectionHeader }");
  expect(PAGE).toContain("import { Button }");
  expect(PAGE).toContain("import { MiniFlow }");
  expect(PAGE).toContain("gb-card-lift");
  expect(PAGE).toContain("reduceMotion ? undefined");
  expect(PAGE).not.toContain("setInterval");
  expect(PAGE).not.toContain("repeat: Infinity"); // only in Float/CTA Drift
});
```

---

*Motion System frozen at R18.7. All pages must compose exclusively from these frozen primitives.*