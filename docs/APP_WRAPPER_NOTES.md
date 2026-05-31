# APP Wrapper Notes

OpenAA Phase 1 is an APP core, not a temporary website.

## Required From the Start

- Mobile-first layout.
- `viewport-fit=cover` and safe-area spacing.
- Standalone PWA manifest and icons.
- Stable `/auth/callback`.
- Web Share API first.
- External links should later open in the system browser from wrappers.
- Bottom navigation and floating controls must avoid the iPhone Home Indicator.

## Future Wrapper Work

Android TWA, Capacitor, or iOS WebView packaging will require store assets, privacy policy review, terms review, screenshots, deep links, push notification setup, Apple login review, and app store compliance work.
