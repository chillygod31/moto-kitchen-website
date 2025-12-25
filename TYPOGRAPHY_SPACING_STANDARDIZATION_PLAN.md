# Typography & Spacing Standardization Plan

## Overview

Standardize typography and spacing across the entire website to eliminate inconsistencies and create a cohesive design system. This plan defines a single type scale, spacing system, and applies them consistently across all pages while preserving special fonts for hero, menu, and signature dishes.

---

## Part 1: Define Typography System

### 1.1 Create Typography Scale in `globals.css`

**File:** `app/globals.css`

Add CSS custom properties for the typography scale:

```css
:root {
  /* Typography Scale */
  --font-size-h1: clamp(2rem, 4vw + 1rem, 4.5rem); /* 32px - 72px */
  --font-size-h2: clamp(1.75rem, 2.5vw + 0.75rem, 2.5rem); /* 28px - 40px */
  --font-size-h3: clamp(1.25rem, 1.5vw + 0.5rem, 1.5rem); /* 20px - 24px */
  --font-size-body: 1rem; /* 16px - base */
  --font-size-body-lg: 1.125rem; /* 18px */
  --font-size-small: 0.875rem; /* 14px */
  --font-size-xs: 0.75rem; /* 12px */
  
  /* Line Heights */
  --line-height-tight: 1.1; /* Headings */
  --line-height-normal: 1.5; /* Body text default */
  --line-height-relaxed: 1.75; /* Body text relaxed */
  --line-height-loose: 1.8; /* Body text loose */
  
  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Letter Spacing */
  --letter-spacing-tight: -0.02em; /* Large headings */
  --letter-spacing-normal: -0.01em; /* H2/H3 headings */
  --letter-spacing-wide: 0.5px; /* Labels, uppercase */
  --letter-spacing-widest: 0.125em; /* Uppercase labels */
}
```

### 1.2 Define Global Typography Classes

**File:** `app/globals.css`

Add reusable typography utility classes:

```css
/* Headings */
.typography-h1 {
  font-family: var(--font-dm-serif-display), serif;
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--text-primary);
}

.typography-h1-hero {
  /* Special variant for hero - larger, lighter weight */
  font-family: var(--font-dm-serif-display), serif;
  font-size: clamp(2.5rem, 5vw + 1rem, 4.5rem); /* 40px - 72px */
  font-weight: 500;
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.typography-h2 {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--text-primary);
}

.typography-h3 {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--text-primary);
}

/* Body Text */
.typography-body {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
}

.typography-body-lg {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-body-lg);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
}

/* Small Text */
.typography-small {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--text-secondary);
}

/* Labels (uppercase) */
.typography-label {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-widest);
  text-transform: uppercase;
  color: var(--cta);
}

/* Buttons */
.typography-button {
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-body-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
}

/* Special: Menu/Dish Names (preserve existing font) */
.typography-dish-name-swahili {
  font-family: var(--font-heading-display), serif;
  font-size: 1.25rem; /* text-xl */
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.typography-dish-name-english {
  font-family: var(--font-body), sans-serif;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  color: #4B4B4B;
}
```

### 1.3 Update Existing Global Styles

**File:** `app/globals.css`

Update the existing `h1`, `h2`, `h3` selectors to use the new typography classes:

```css
h1 {
  /* Remove inline styles, use .typography-h1 class instead */
  font-family: var(--font-dm-serif-display), serif;
  font-weight: var(--font-weight-bold);
}

h2 {
  font-family: var(--font-inter), sans-serif;
  font-weight: var(--font-weight-semibold);
}

h3, h4, h5, h6 {
  font-family: var(--font-inter), sans-serif;
  font-weight: var(--font-weight-semibold);
}
```

---

## Part 2: Define Spacing System

### 2.1 Add Spacing Variables

**File:** `app/globals.css`

Add spacing scale as CSS variables:

```css
:root {
  /* Spacing Scale (based on 4px base unit) */
  --spacing-xs: 0.25rem; /* 4px */
  --spacing-sm: 0.5rem; /* 8px */
  --spacing-md: 1rem; /* 16px */
  --spacing-lg: 1.5rem; /* 24px */
  --spacing-xl: 2rem; /* 32px */
  --spacing-2xl: 2.5rem; /* 40px */
  --spacing-3xl: 3rem; /* 48px */
  --spacing-4xl: 4rem; /* 64px */
  
  /* Section Spacing */
  --section-padding-y-mobile: 3rem; /* 48px */
  --section-padding-y-desktop: 4rem; /* 64px */
  --section-padding-x: 1rem; /* 16px mobile, 2rem desktop */
  
  /* Content Spacing */
  --content-spacing-heading-to-text: 1.5rem; /* 24px */
  --content-spacing-text-to-cta: 2rem; /* 32px */
  --content-spacing-paragraph: 1.25rem; /* 20px */
}
```

### 2.2 Update Section Padding Class

**File:** `app/globals.css`

Update `.section-padding` to use new spacing variables:

```css
.section-padding {
  padding: var(--section-padding-y-mobile) var(--section-padding-x);
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

@media (min-width: 768px) {
  .section-padding {
    padding: var(--section-padding-y-desktop) 2rem;
  }
}
```

### 2.3 Create Content Spacing Utilities

**File:** `app/globals.css`

Add utility classes for consistent content spacing:

```css
/* Paragraph spacing */
.content-spacing > p + p {
  margin-top: var(--content-spacing-paragraph);
}

/* Heading to text spacing */
.heading-to-text {
  margin-bottom: var(--content-spacing-heading-to-text);
}

/* Text to CTA spacing */
.text-to-cta {
  margin-top: var(--content-spacing-text-to-cta);
}

/* Section internal spacing */
.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
```

---

## Part 3: Create Typography Component (Optional)

### 3.1 Create Typography Component

**New File:** `components/ui/Typography.tsx`

Create a reusable Typography component for consistent usage:

```typescript
import { ReactNode } from 'react'
import { cn } from '@/lib/utils' // Assuming you have a cn utility

interface TypographyProps {
  variant: 'h1' | 'h1-hero' | 'h2' | 'h3' | 'body' | 'body-lg' | 'small' | 'label' | 'button' | 'dish-swahili' | 'dish-english'
  children: ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Typography({ variant, children, className, as }: TypographyProps) {
  const baseClasses = `typography-${variant}`
  const Component = as || (variant.startsWith('h') ? variant : 'p') as keyof JSX.IntrinsicElements
  
  return (
    <Component className={cn(baseClasses, className)}>
      {children}
    </Component>
  )
}
```

---

## Part 4: Audit and Fix Pages

### 4.1 Homepage (`app/page.tsx`)

**Issues to Fix:**
- "Our Story" section: body text uses `text-lg` with inline `fontSize: '1.125rem'` and `lineHeight: '1.75'` → should use `.typography-body-lg`
- Inconsistent heading sizes (some use arbitrary `text-[32px]` etc.) → use `.typography-h2`
- Service card descriptions have inline `lineHeight: '1.7'` → use `.typography-body`
- Inconsistent spacing between sections

**Changes:**
1. Replace hero H1 with `.typography-h1-hero` class (preserve font)
2. Replace all H2 with `.typography-h2` class
3. Replace "Our Story" paragraph styles with `.typography-body-lg`
4. Replace all body text with `.typography-body` or `.typography-body-lg`
5. Replace service card descriptions with `.typography-body` (remove italic if not needed)
6. Standardize section spacing using `.section-padding`
7. Add `.content-spacing` to sections with multiple paragraphs
8. Use `.heading-to-text` and `.text-to-cta` utilities

### 4.2 About Page (`app/about/page.tsx`)

**Issues to Fix:**
- Inline `lineHeight: '1.75'` on multiple paragraphs → use `.typography-body-lg`
- Inconsistent heading sizes
- Paragraph spacing inconsistencies

**Changes:**
1. Replace all H1 with `.typography-h1`
2. Replace all H2 with `.typography-h2`
3. Replace all body paragraphs with `.typography-body-lg`
4. Remove inline style objects
5. Add `.content-spacing` class to card content
6. Standardize spacing

### 4.3 Services Pages

**Files:**
- `app/services/page.tsx`
- `app/services/private-events/page.tsx`
- `app/services/pick-up-delivery/page.tsx`
- `app/services/corporate/page.tsx`
- `app/services/weddings/page.tsx`

**Issues to Fix:**
- Inline `lineHeight: '1.75'` → use `.typography-body-lg`
- Inconsistent H2/H3 sizes
- Service page template has custom heading styles

**Changes:**
1. Update `ServicePageTemplate.tsx` to use typography classes
2. Replace all headings with appropriate typography classes
3. Replace all body text with `.typography-body-lg`
4. Standardize spacing in template

### 4.4 Menu Page (`app/menu/page.tsx`)

**Special Notes:**
- Preserve dish name fonts (Swahili = serif, English = sans-serif)
- Keep existing `.dish-name-swahili` and `.dish-name-english` classes
- Fix spacing only, not fonts

**Changes:**
1. Use `.typography-body` for descriptions
2. Ensure consistent spacing between dish cards
3. Standardize section headings with `.typography-h2`

### 4.5 Gallery Page (`app/gallery/page.tsx`)

**Changes:**
1. Replace H1 with `.typography-h1`
2. Replace body text with `.typography-body-lg`
3. Standardize spacing

### 4.6 Contact Page (`app/contact/page.tsx`)

**Issues to Fix:**
- Inline font styles on form labels
- Inconsistent input text sizes
- Button text sizes

**Changes:**
1. Replace headings with typography classes
2. Use `.typography-small` for form labels
3. Use `.typography-body` for input text
4. Ensure buttons use `.typography-button` (already in `.btn-primary`)
5. Standardize spacing

### 4.7 FAQ Page (`app/faq/page.tsx`)

**Changes:**
1. Ensure questions use consistent typography (Inter, 600 weight, 18-20px)
2. Ensure answers use `.typography-body-lg`
3. Standardize spacing between FAQ items

### 4.8 Reviews Page (`app/reviews/page.tsx`)

**Changes:**
1. Replace headings with typography classes
2. Use `.typography-body-lg` for testimonial quotes
3. Use `.typography-small` for author info
4. Standardize spacing

### 4.9 Components

**Files to Update:**
- `components/ServiceCard.tsx` - Remove inline styles, use typography classes
- `components/ServicePageTemplate.tsx` - Use typography classes throughout
- `components/CTASection.tsx` - Standardize typography
- `components/HowItWorks.tsx` - Use typography classes
- `components/TestimonialCard.tsx` - Use typography classes
- `components/FAQAccordion.tsx` - Ensure consistent typography

---

## Part 5: Button Standardization

### 5.1 Update Button Classes

**File:** `app/globals.css`

Ensure `.btn-primary` and `.btn-secondary` use the typography system:

```css
.btn-primary {
  /* ... existing styles ... */
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-body-lg); /* 1.125rem */
  font-weight: var(--font-weight-semibold); /* 600 */
  line-height: var(--line-height-normal); /* 1.5 */
  /* ... rest of styles ... */
}

.btn-secondary {
  /* ... existing styles ... */
  font-family: var(--font-inter), sans-serif;
  font-size: var(--font-size-body-lg); /* 1.125rem */
  font-weight: var(--font-weight-semibold); /* 600 */
  line-height: var(--line-height-normal); /* 1.5 */
  /* ... rest of styles ... */
}
```

### 5.2 Audit Button Usage

**Changes:**
1. Remove any inline font-size/font-weight styles on buttons
2. Ensure all buttons use `.btn-primary` or `.btn-secondary`
3. Verify consistent padding across all buttons

---

## Part 6: Mobile Responsiveness

### 6.1 Ensure Typography Scales Properly

The CSS variables use `clamp()` for responsive sizing, but verify:
1. H1 scales appropriately on mobile (not too large)
2. Body text remains readable (minimum 16px)
3. Line heights adjust for smaller screens if needed

### 6.2 Mobile Spacing Adjustments

**File:** `app/globals.css`

Add mobile-specific spacing overrides if needed:

```css
@media (max-width: 768px) {
  .section-padding {
    padding-top: 2.5rem; /* Slightly tighter on mobile */
    padding-bottom: 2.5rem;
  }
  
  .content-spacing-heading-to-text {
    margin-bottom: 1rem; /* Tighter on mobile */
  }
}
```

---

## Part 7: Visual QA Checklist

### 7.1 Page-by-Page Review

For each page, verify:
- [ ] All H1 use `.typography-h1` or `.typography-h1-hero`
- [ ] All H2 use `.typography-h2`
- [ ] All H3 use `.typography-h3`
- [ ] All body text uses `.typography-body` or `.typography-body-lg`
- [ ] All labels use `.typography-label`
- [ ] All buttons use `.btn-primary` or `.btn-secondary` (with `.typography-button` internally)
- [ ] Section spacing is consistent (`.section-padding`)
- [ ] Paragraph spacing is consistent (`.content-spacing`)
- [ ] Heading-to-text spacing is consistent (`.heading-to-text`)
- [ ] Text-to-CTA spacing is consistent (`.text-to-cta`)

### 7.2 Desktop + Mobile Breakpoints

For each page:
- [ ] Check desktop (1920px, 1440px, 1280px)
- [ ] Check tablet (768px, 1024px)
- [ ] Check mobile (375px, 414px)

### 7.3 Special Font Preservation

Verify these sections maintain their special fonts:
- [ ] Hero title (DM Serif Display, 500 weight)
- [ ] Menu/Signature dish names (Swahili = serif, English = sans-serif)
- [ ] Header navigation (existing font)

---

## Part 8: Implementation Order

1. **Part 1 & 2**: Add typography and spacing variables to `globals.css`
2. **Part 5**: Update button classes to use typography system
3. **Part 4.1**: Fix Homepage (most visible)
4. **Part 4.2**: Fix About Page
5. **Part 4.3**: Fix Services Pages
6. **Part 4.4-4.8**: Fix remaining pages (Menu, Gallery, Contact, FAQ, Reviews)
7. **Part 4.9**: Fix components
8. **Part 6**: Verify mobile responsiveness
9. **Part 7**: Visual QA pass

---

## Part 9: Testing

### 9.1 Visual Regression Testing

1. Take screenshots of each page before changes
2. Take screenshots after changes
3. Compare to ensure:
   - Typography is more consistent
   - Spacing is more uniform
   - Special fonts are preserved
   - Nothing broke visually

### 9.2 Browser Testing

Test on:
- Chrome (desktop + mobile)
- Safari (desktop + mobile)
- Firefox (desktop)

### 9.3 Specific Fix Verification

- [ ] "Our Story" section body text matches other sections
- [ ] All body text is same size and line-height
- [ ] Headings are consistent across pages
- [ ] Buttons are consistent
- [ ] Spacing feels uniform

---

## Files to Create

- `components/ui/Typography.tsx` (optional component)

## Files to Update

- `app/globals.css` (typography scale, spacing system, button updates)
- `app/page.tsx` (homepage typography and spacing)
- `app/about/page.tsx`
- `app/services/page.tsx`
- `app/services/private-events/page.tsx`
- `app/services/pick-up-delivery/page.tsx`
- `app/services/corporate/page.tsx` (if exists)
- `app/services/weddings/page.tsx` (if exists)
- `app/menu/page.tsx`
- `app/gallery/page.tsx`
- `app/contact/page.tsx`
- `app/faq/page.tsx`
- `app/reviews/page.tsx`
- `components/ServiceCard.tsx`
- `components/ServicePageTemplate.tsx`
- `components/CTASection.tsx`
- `components/HowItWorks.tsx`
- `components/TestimonialCard.tsx`
- `components/FAQAccordion.tsx`
- Any other components with inline typography styles

---

## Success Criteria

- ✅ All body text uses consistent font-size (16px base, 18px for large)
- ✅ All body text uses consistent line-height (1.75)
- ✅ All headings use consistent sizes and weights
- ✅ All buttons use consistent typography
- ✅ Spacing is uniform across sections
- ✅ "Our Story" section matches other body text sections
- ✅ Special fonts (hero, menu, signature dishes) are preserved
- ✅ No inline font-size/line-height/font-weight styles remain
- ✅ Mobile typography scales appropriately
- ✅ Visual QA passes on all pages

