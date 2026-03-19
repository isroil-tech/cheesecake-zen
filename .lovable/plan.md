

# 77Cheesecake — Premium Telegram Mini App

## Design System

- **Colors**: White background, light gray surfaces (`#F5F5F0`), warm beige accent (`#C8A97E`), dark text (`#1A1A1A`), muted text (`#8E8E93`)
- **Typography**: Inter font — 28px bold titles, 17px medium body, 13px captions
- **Corners**: 16px cards, 12px buttons, 24px modals
- **Shadows**: `0 2px 12px rgba(0,0,0,0.06)` — soft, minimal
- **Spacing**: 16/20/24px rhythm, generous white space throughout

## State & Architecture

- **Zustand** for cart, user profile, language, and order state
- **i18n system** with `uz` and `ru` JSON translation files, React context for language switching
- **Telegram WebApp SDK** integration via `@vkruglikov/react-telegram-web-app`
- Component-based: reusable `ProductCard`, `QuantitySelector`, `FormatPicker`, `BottomNav`, `OrderCard`

## Screens

### 1. Home (Product Catalog)
- Clean header: "77Cheesecake" in elegant typography
- Horizontal scrollable category pills (All, Classic, Fruit, Special)
- Product cards in a 2-column grid: large image, name, price, format badge (Whole/Slice), "+" add button
- Smooth scroll, skeleton loading placeholders

### 2. Product Detail
- Full-width hero image with subtle parallax
- Name, description, price below
- **Format selector**: toggle between "Whole" and "Slice" with clear visual state
- Slice mode: show available slice count (e.g., "5 of 8 slices left"), disable if 0
- Whole mode: show availability, disable if out of stock
- Quantity selector (−/+) with haptic-style animation
- Large "Add to Cart" CTA button in warm beige accent

### 3. Cart
- Item list with: image thumbnail, name, format tag, quantity controls, line price
- Swipe-to-delete or tap remove icon
- Soft dividers between items
- Sticky bottom: total price + "Checkout" button

### 4. Checkout (Apple Pay-style flow)
- Single scrollable page with sections:
  - **Delivery / Pickup** toggle (pill-style)
  - **Address** input (or saved address selector) — hidden if pickup
  - **Comment** optional text field
  - **Order summary** collapsed
  - **Confirm Order** button
- Success: minimal checkmark animation → redirect to Orders

### 5. Orders
- Chronological list of order cards
- Each card: date, item count, total, status pill (color-coded: blue=new, orange=preparing, green=ready, gray=delivered, red=cancelled)
- Tap to expand order details

### 6. Profile
- User name & phone (from Telegram data)
- Language switch: `Ўзб / Рус` toggle — instant UI re-render
- Saved addresses list
- Link to order history

## Bottom Navigation
- 4 icons: Home, Cart (with badge count), Orders, Profile
- Fixed, minimal, no labels — icon-only with subtle active indicator

## Product Logic (Whole/Slice)
- Each product has: `slicesPerWhole` (default 8), `wholeStock`, `sliceStock`
- Adding a whole decrements `wholeStock`
- Adding slices decrements `sliceStock`
- Cart validates stock before checkout
- Low stock: subtle amber "Only X left" label

## Multilingual System
- Two JSON files: `uz.json`, `ru.json` with nested keys
- `useTranslation()` hook returns `t('home.title')` style accessor
- Language persisted in Zustand store + localStorage
- All UI strings use translation keys, zero hardcoded text

## Animations & Micro-interactions
- CSS transitions on all interactive elements (150ms ease)
- Page transitions via framer-motion (slide/fade)
- Skeleton loading screens matching card layouts
- Cart badge bounce on add
- Checkout success: animated checkmark (Lottie or CSS)
- Button press: subtle scale-down (0.97) effect

## Mock Data
- 8-10 cheesecake products with placeholder images, names in uz/ru, prices in UZS
- Sample order history entries with various statuses

