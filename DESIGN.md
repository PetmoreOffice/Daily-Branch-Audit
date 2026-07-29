# Enterprise Design System Guidelines

This document outlines the design principles and UI standards for the **Daily Branch Audit** platform. All new components and pages MUST adhere to these guidelines to ensure a consistent, professional, and accessible user experience.

## 1. Typography & Readability (WCAG Compliance)
- **Minimum Font Size:** The absolute minimum font size allowed in the application is `12px` (Tailwind class: `text-xs`).
- **Forbidden Classes:** Do **NOT** use `text-[10px]`, `text-[11px]`, or any font size smaller than `text-xs`.
- **Contrast:** Ensure all text has sufficient contrast against its background. Avoid using dark gray text on colored backgrounds, or cyan/blue text on dark backgrounds.
- **Font Weight:** Use `font-bold` or `font-semibold` sparingly to highlight key metrics or titles. Do not make entire paragraphs bold.

## 2. Color Palette
We use a reserved, professional color palette centered around Navy Blue and Slate.
- **Primary Colors:** `bg-navy`, `text-navy`, `bg-audit-blue`.
- **Backgrounds:** Use `bg-slate-50` or `bg-slate-100` for application backgrounds. Use `bg-white` for cards.
- **Forbidden Colors:** Avoid neon colors (e.g., bright Cyan, Magenta, Lime). Do **NOT** use `bg-gradient-to-*` with flashy colors. Stick to solid colors for enterprise applications.

## 3. Shadows & Borders (Tremor-like Aesthetics)
Our UI is inspired by modern dashboard libraries like Tremor and Vercel.
- **Shadows:** Use natural, soft shadows like `shadow-sm` or `shadow-md`. 
- **Forbidden Shadows:** Do **NOT** use colored glow shadows (e.g., `shadow-blue-500/50`).
- **Borders:** Use subtle borders (`border-slate-200` or `border-audit-hairline`) to separate content cleanly. Do not use glowing or neon borders.

## 4. Animations
- **Micro-interactions:** Use subtle transitions (`transition-all duration-200`) for hover states on buttons and links.
- **Forbidden Animations:** Do **NOT** use `animate-pulse` or continuous glowing animations unless specifically required for a critical system alert.

## 5. Components
- **Buttons:** Keep buttons solid or outlined. No gradient backgrounds.
- **Charts:** Use Area Charts or Bar Charts with solid or low-opacity fills (e.g., `fill-opacity={0.1}`). Do not use heavy gradient fills or neon strokes.
- **Cards:** White background, subtle border, no heavy drop shadows.

By following these rules, we ensure the application looks like a top-tier enterprise product rather than an AI-generated prototype.
