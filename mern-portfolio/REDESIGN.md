# Portfolio visual refresh — 16 November 2026

Preserves the five existing React/Express applications, API contracts, demo accounts and MongoDB configuration. Uses three-colour visual systems with approximately 60% base, 30% supporting surfaces and 10% accents; text, semantic statuses and photographs are exempt from exact ratios.

| App | Base | Supporting | Accent |
| --- | --- | --- | --- |
| ShopFlow | #F7F5F0 ivory | #E7DFD2 sand | #215547 forest |
| BookEase | #F6F8F4 ivory | #DFE8DC sage | #234D40 forest |
| ClientDesk | #F6F8FA cloud | #172B42 navy | #245CAA blue |
| SupportPilot | #F4F8F7 mist | #163A35 ink green | #167366 teal |
| ServiceHub | #FCFAF5 warm white | #EEE7DA oat | #B65034 rust |

## Changes

- Local WebP photography replaces the ShopFlow catalogue and hero illustrations, BookEase salon illustration and ServiceHub hero avatar.
- Contextual images on CRM/helpdesk sign-in screens; data-first operational dashboards.
- Purple UI colours converted to blue/teal; decorative gradients removed from the CRM/helpdesk.
- Readable minimum 12px CSS text, clearer focus rings, reduced motion support, flatter surfaces and restrained corner radii.
- Original API workflows preserved. Demo cart was exercised in the browser. CRM and helpdesk demo entry was checked locally.
- Stock photos illustrate fictional demo products, not actual stock or client work. See IMAGE-CREDITS.md.

## Verification

All five Vite builds passed. Existing API/workflow suites: ShopFlow 12, BookEase 12, ClientDesk 10, SupportPilot 9, ServiceHub 6 (49 total, zero failures). Desktop browser review covered each application. Responsive CSS was reviewed and ServiceHub was checked in a 390px browser frame without horizontal overflow; no physical mobile-device testing was performed.

## Scope

These remain MERN projects. They must not be presented as Shopify or WordPress implementations. The proposed five Shopify and five WordPress sites are a separate next phase and are not included in this refresh.
