---
name: Artisanal Ember
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5a413a'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8e7069'
  outline-variant: '#e2bfb6'
  surface-tint: '#b12d01'
  primary: '#b02d00'
  on-primary: '#ffffff'
  primary-container: '#d3451b'
  on-primary-container: '#ffffff'
  inverse-primary: '#ffb5a0'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#845300'
  on-tertiary: '#ffffff'
  tertiary-container: '#a66900'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a0'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#882000'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system expresses a refined, appetite-inducing culinary experience for an artisanal burger house. The personality blends gourmet precision with rustic warmth: unpretentious, savory, and premium without being intimidating.

The target audience consists of mobile-first urban diners, food enthusiasts, and takeaway customers demanding quick, frictionless browsing and high visual clarity.

### Design Direction
- **Style:** Contemporary Warm Editorial Minimalism.
- **Atmosphere:** Clean, sunlit kitchen aesthetics with warm organic fire tones. White and off-white backgrounds let vivid food photography take center stage.
- **Emotional Intent:** High craveability, instant clarity on menu choices, swift ordering confidence, and a sense of fresh, flame-grilled craftsmanship.

## Colors

The palette balances clean culinary staging with energetic heat cues:

- **Primary (`#D3451B` - Flame Terracotta):** Represents the sear, ember, and hearth. Reserved strictly for primary call-to-actions, cart badges, active selection indicators, and promotional highlights.
- **Secondary (`#22C55E` - Fresh Basil Green):** Communicates fresh ingredients, operational readiness (e.g., "Aberto agora" / "Open now"), and positive status updates.
- **Tertiary (`#F59E0B` - Warm Cheddar Amber):** Secondary accents, rating stars, ingredient highlights, and warmth cues.
- **Neutral (`#1A1A1A` - Charred Slate):** High-contrast base for primary text, headlines, and essential UI structural icons.
- **Surfaces & Canvas:** Canvas operates on `#FAFAFA` (crisp off-white), elevated components and cards sit on `#FFFFFF` with delicate `#EAEAEA` borders.

## Typography

The design system relies on **Plus Jakarta Sans** across all text levels. Its geometric structure combined with subtle rounded terminals complements both the artisanal culinary theme and modern transactional efficiency.

- **Headlines:** Use heavy weights (`700` and `800`) with tighter tracking (`-0.02em` to `-0.03em`) to create compact, appetizing burger titles and category headers.
- **Body:** Kept at regular (`400`) weight with neutral charcoal tones (`#1A1A1A` for primary descriptions, `#666666` for secondary ingredient footnotes) ensuring effortless readability under varying lighting conditions.
- **Labels & Tags:** Uppercase or small title case paired with medium-to-bold weights (`600` and `700`) for pricing, dietary pills, and modifier counts.

## Layout & Spacing

A compact, mobile-optimized fluid grid model ensures immediate access to the menu, rapid product scanning, and frictionless single-hand checkout.

- **Mobile Viewports (<640px):** 4-column layout, 16px (`1rem`) outer margins, and 12px to 14px gutters. Interactive elements follow a strict minimum tap target of 48x48px.
- **Tablet & Desktop:** Max content container width of 960px for ordering interfaces to avoid over-stretching menu items and to keep ordering baskets within direct reach.
- **Vertical Rhythm:** Tight internal spacing within cards (`0.875rem`) keeps the visual unit bound tightly, allowing diners to scan multiple options on a single screen without fatigue.

## Elevation & Depth

This system avoids heavy shadows, emphasizing cleanliness, freshness, and crisp light reflection.

- **Base Cards & Surfaces:** Rely on a 1px solid border (`#EAEAEA`) on pure `#FFFFFF` over the `#FAFAFA` base canvas. No shadow in resting state.
- **Floating Controls (Sticky Cart Bar, Bottom Nav):** Use a low-opacity ambient drop: `0px 4px 20px rgba(26, 26, 26, 0.06)`, grounding the element without visual clutter.
- **Interactive Press / Active State:** Interactive cards press inward using subtle border darkening (`#D9D9D9`) rather than deep drop shadows.
- **Modals & Bottom Drawers:** Flat `#FFFFFF` backdrop with a warm dim backdrop overlay (`rgba(26, 26, 26, 0.45)`).

## Shapes

The shape system pairs structured container cards with rounded interactive pill accents:

- **Containers & Product Cards:** Use base roundedness (`rounded` / 8px to 12px) to preserve screen real estate and provide structured alignment for food photography.
- **Chips, Category Selectors, Badges, and Stepper Controls:** Use full pill geometry (`rounded-full`) to invite touch and reinforce the organic, friendly burger joint motif.
- **Form Inputs:** Soft borders with matching 8px to 10px corner radiuses.

## Components

### Buttons
- **Primary Action (Add to Order, Checkout):** Solid `#D3451B` background, pure white bold text, minimum 48px height, full width on mobile viewports. Active state scales subtly (`0.98`) with a slight darkening of background.
- **Secondary Action (Customise, View Details):** Off-white `#F5F5F5` background, `#1A1A1A` text, 1px border `#EAEAEA`.
- **Quantity Steppers (+ / -):** Pill-shaped pill container, neutral slate icons, instant tactile feedback.

### Chips & Badges
- **Status Badge ("Aberto agora"):** Soft green background (`rgba(34, 197, 94, 0.12)`), `#16A34A` text, leading green dot (`6px` solid `#22C55E`). Pill-shaped.
- **Category Filter Tabs:** Pill containers. Inactive: transparent background with `#1A1A1A` text and `#EAEAEA` border. Active: `#1A1A1A` background with `#FFFFFF` text.

### Product & Combo Cards
- **Orientation:** Horizontal compact cards for standard menu lists (thumbnail on the right, title, ingredients snippet, and price on the left); large vertical featured cards for special burger launches.
- **Visuals:** High-resolution food cutouts or warm-lit macro photographs.
- **Borders:** Thin 1px `#EAEAEA` separation.

### Form Inputs & Add-on Checkboxes
- **Customization Checkboxes/Radios:** Circular indicators for single selection; square with 4px corner radiuses for multiple ingredients. Active state filled with `#D3451B` and crisp white check.
- **Input Fields:** Crisp `#FFFFFF` surface, 1px `#EAEAEA` border, `#1A1A1A` input text, transitioning to `#D3451B` border upon focus.

### Sticky Order Bar
- Persistent bottom mobile container holding item count, total price, and primary call to action button. Styled with crisp white background, top hairline border (`#EAEAEA`), and subtle ambient elevation.