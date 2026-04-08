---
name: Sold status feature
description: Listings can be marked as sold with visual indicators and disabled contact
type: feature
---
- `sold` boolean column on listings table (default false)
- MyListings page has Mark as Sold / Mark as Available toggle button
- Sold listings: grayed out (opacity-60 grayscale), SOLD badge overlay on image
- ListingDetail hides Message Seller button for sold items
- Sold listings remain visible in browse but show "This item has been sold" text
