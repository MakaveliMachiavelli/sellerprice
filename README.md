# SellerPrice — Shopee / Lazada / TikTok Shop Fee & Pricing Calculator (PH)

**Live:** https://makavelimachiavelli.github.io/sellerprice/

## What it is
The inverse-margin pricing calculator for PH online sellers: enter item cost + target margin (+ shipping absorbed, vouchers, fixed costs) → get the exact selling price for Shopee (6+2%), Lazada (4+2%), TikTok Shop (6+2%) or custom rates — with fee breakdown, net profit/sale, break-even price, and a same-item-all-platforms comparison. All fee rates editable (saved in browser) so it stays accurate when Seller Center rates change.

**Free:** single-item solver + platform comparison + printable price sheet.
**PRO (₱99 one-time, GCash):** batch price-list (all items × 3 platforms), CSV export.

## Buyer persona
- **Who:** PH online resellers/sellers on Shopee/Lazada/TikTok (NegosyoSheet's persona, pre-purchase stage), both newbies and veterans repricing after fee changes.
- **Pain:** pricing by vibes then discovering fees ate the margin; PH sellers commonly budget 13–15% all-in Shopee costs (per seller FB groups); existing calculators are single-platform, ad-heavy, or lead magnets.
- **Why pay ₱99:** one mispriced SKU order costs more; batch list reprices a whole store when fees change.
- **Where they hang out:** Online Sellers PH FB groups, r/Philippines reselling threads, "shopee fee calculator" Google searches.

## Demand evidence (per REVENUE GATES)
- Paid/adjacent: Marketplace Calculator Android app (Play Store), DataGlass (paid tiers), OneCart premium tools = 3+ paid; plus dense free-tool competition the inverse-margin + batch + offline angle differentiates from.
- Community: recurring "how much should I price / what's your margin" threads in PH seller FB groups.

## Monetization
GCash QR + unlock code (see `PAYMENTS.md`). Cross-sells NegosyoSheet (same persona, complementary funnel stage).

## Tech
Static HTML/CSS/vanilla JS; closed-form solver price = F/(1−f−m). Tested 16/16 jsdom assertions (solver math incl. extras, platform switching, impossible-margin guard, batch flow).

## Deploy
```bash
git init && git add -A && git commit -m "SellerPrice v1"
gh repo create sellerprice --public --source=. --push
gh api -X POST repos/MakaveliMachiavelli/sellerprice/pages -f "source[branch]=main" -f "source[path]=/"
```
