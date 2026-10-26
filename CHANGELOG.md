# Sundown Safaris website changelog

A plain record of what changed on sundownsafari.com, why it changed, and how to check it. Newest work first.

# 26 October 2026

This round started from a review of Microsoft Clarity data for 1 September to 26 October. That data showed 61 real visits, 150 bot visits filtered out, and 4 enquiries. The site was converting well but losing some buyers to bugs, and most pages were not being measured at all. Everything below came out of that review.

## Confirmed by Baraka on 26 October

The testimonials from David K. and from Tom and Linda B. are real guests. The desktop hero video is Sundown's own footage. generate_lead is imported into Google Ads as the lead conversion.

## Already live

These went live through GitHub uploads during the day and were confirmed on Vercel production.

### 1. The enquiry form can no longer fail after a successful send

**What was wrong.** After Formspree saved an enquiry, the code tried to send the guest a confirmation through EmailJS. If EmailJS had not loaded, which happens on slow mobile data and with some browser blockers, the code crashed at that point. The visitor saw "Something went wrong, please try again" even though their enquiry had gone through, no lead was recorded, and retrying sent duplicates. One recorded Clarity session shows a visitor doing exactly this before leaving.

**What changed.** The success message now shows first, the moment Formspree confirms. The lead tracking and the guest email each run separately, so neither can undo a successful enquiry. The button can no longer send the same enquiry twice. The form is ready the instant the page loads instead of waiting for the browser to be idle.

**Tracking.** generate_lead in GA4, Lead in Meta and generate_lead in Clarity fire once per enquiry, only after Formspree confirms. The double counting fix from 16 October is kept.

### 2. Navigation dead clicks fixed

**What was wrong.** Our Safaris in the desktop menu was plain text that only opened when hovered, so clicking it did nothing and the trip menu could not be opened on touchscreen laptops and tablets. The 3, 5 and 7 Day Safaris labels looked clickable but were not. Clarity recorded dead clicks in four sessions.

**What changed.** Our Safaris now links to the trip grid and the menu also opens on tap and keyboard focus. The duration labels in both the desktop and mobile menus jump to their row of trips on the homepage.

### 3. Header phone number

Now reads +254 724 491 210 and opens WhatsApp. It was a phone call link, which does nothing on a laptop, and roughly three quarters of visits come from laptops.

### 4. Clarity now records every page

Clarity was only installed on the homepage, so blog posts, trip pages and the weekend getaway landing page were never recorded. It is now on all 71 of those pages, using the same consent rule as the homepage, where visitors in the UK, the EU and Switzerland are asked first.

### 5. Date picker rebuilt for phones

**What was wrong.** The calendar showed two months side by side, about 620 pixels wide on a phone screen of about 390, so it pushed the page sideways. It needed two taps to open, gave no hint that a second date was needed, and its month arrows were white on white.

**What changed.**

1. Phones show one month, fixed in the centre of the screen with the page dimmed behind it and no sliding animation.
2. The first tap opens it, because it loads quietly while the visitor scrolls towards the form.
3. A gold bar guides the visitor. It says Step 1 of 2, tap your arrival date, then names their arrival and asks for the departure.
4. Once both dates are picked, a line under the field confirms the nights and dates in plain words.
5. If only an arrival date is chosen, it is kept with a reminder to add the departure.
6. If the calendar ever fails to load, the field becomes a normal text box so the enquiry can still go through.
7. The brand green month bar and visible month arrows are restored on every device.

### 6. Sticky enquiry bar

The floating WhatsApp bubble is replaced with a bar fixed to the bottom of the screen. It holds two buttons side by side, WhatsApp us and Plan my trip, under the line "Private safaris across Kenya. We reply within 2 hours." It runs full width on phones and is a compact box on desktop. It hides while the enquiry form is on screen, so it never covers a field or the submit button.

**Tracking.** Plan my trip clicks fire sticky_form_click in GA4 and Clarity. WhatsApp clicks were already tracked as whatsapp_click.

### 7. Homepage banner refreshed

The Mashujaa Weekend item, for 17 to 19 October, and the October Safaris item were replaced with November and December Safaris, Christmas and New Year, and The Mara after the migration. Review again in early January.

### 8. GA4 settings

Confirmed done in GA4: form_submit is no longer a key event, so each enquiry counts once, and whatsapp_click is now a key event.

## In this upload

### 9. Structured data on 70 pages

Structured data tells Google, in its own format, what each page is about.

1. **Homepage.** Sundown Safaris as a tour operator in Westlands, Nairobi, with phone, email, booking contact, a catalogue of all nine trips with prices, and all ten FAQs.
2. **Nine trip pages.** Trip name, from price in US dollars, the full day by day itinerary, and breadcrumbs.
3. **57 blog posts.** Marked as articles published by Sundown Safaris, with date and image.
4. **Three featured posts.** Their existing structured data pointed at the bare domain and has been corrected to the live www addresses.

No star ratings are marked up on purpose. Google does not allow a business to mark up reviews about itself, and doing so can lead to a penalty.

### 10. Link previews on trip pages

Trip pages had no preview tags at all, so a trip shared on WhatsApp showed no image or summary. Each now previews with its photo, name, price and description.

### 11. Broken blog links

Five links inside blog posts pointed at addresses from an older version of the site. The most important sent readers of the Kenya versus Tanzania post to a dead link instead of the Ultimate Kenya trip. All five now point to the right pages. A full scan of the site found no other broken internal links.

### 12. Own photos replace stock photos

**Where.** The homepage hero shows the sunset Land Cruiser. The Explorer shows the open Land Rover, the Sundowner shows the sundowner setup at golden hour, and the Dreamcatcher shows the lion walking past the vehicle. Each appears on its homepage card and its trip page.

**Cleaned.** Other camp and operator names, a permit sticker and a number plate were removed. Each photo carries a small Sundown Safaris mark in the bottom corner.

**Files.** All photos live in a new images folder, compressed to about 2 megabytes in total.

**Hero video.** The desktop hero video is unchanged and still plays on desktop only. The still image shown before it loads is now the sunset Land Cruiser. Phones see the photo instead of the video, so the page loads fast on mobile data.

### 13. Link preview images

The homepage, the three trips above and the three featured posts now preview with real images. This also fixes the Kenya safari cost guide, whose preview pointed at an image that never existed.

### 14. Trip page image descriptions

The image descriptions on all nine trip pages had doubled quote marks, so Google and screen readers read them badly. All nine are fixed.

### 15. Every blog post now leads to a trip

48 older posts had no link to any trip, so a reader arriving from Google had nowhere to go. Each now has a related trips block before the closing call to action, in the same design as the eight posts linked on 7 October. Each block names the two trips that best fit the post's topic. For example, walking safari posts point to the Explorer and the Trailblazer, honeymoon posts to the Sundowner and the Constellation, and packing guides to Ultimate Kenya and the Dreamcatcher. Every block also links to the 2026 cost guide. Every blog post now links to at least one trip.

### 16. Trip page header phone

All nine trip pages now show +254 724 491 210 in the header, opening WhatsApp, matching the homepage.

### 17. Stock faces removed from testimonials

The three featured posts showed guest quotes with random stock faces from randomuser.me. Each face is replaced with an initials badge in the brand colours, DK and TB. The unused connection to randomuser.me was removed from the homepage.

### 18. Duplicate blog index

blog/blog-index-tracked.html is an older copy of the blog index, missing the three featured posts. It now tells Google that the real blog index is the original and asks not to be indexed. It still loads, in case it is used in a campaign link. The structured data wrongly added to it earlier today was removed.

## Sharpness and polish, second upload of the day

### 19. Sharp images on phones

**What was wrong.** On phones the homepage hero is a tall box, about 390 by 1218 points, because the headline and text stack up. The landscape sunset photo had to be cropped to a thin vertical strip and enlarged about two and a half times to fill it, so it looked soft and showed only part of the vehicle. The trip cards also loaded images too small for high resolution phone screens.

**What changed.** On phones the hero photo now sits as a sharp 6 by 5 band across the top, showing the whole vehicle against the sun, then fades into the brand green with the headline below. The Sundowner trip page uses the same treatment. Every image is now sized for the frame it fills, and measured sharpness is 100 percent on an iPhone 13 and a Pixel 7 for the hero, the Sundowner page and all three cards. The desktop hero is now up to 2576 pixels wide, the full size of the original photo. Desktop is otherwise unchanged and the video still plays.

**Source limits.** The Explorer and Dreamcatcher photos arrived compressed, 720 and 1280 pixels wide, likely by WhatsApp. They have been enlarged carefully for phone screens, but original files would be sharper still. Their trip page banners stay on the stock images for now, because a full width banner needs far more pixels than those files have.

### 20. Sundown mark always fully visible

Each image is now cropped to the exact shape of its frame, so the corner mark is never cut off. The mark sits further in from the edge, the SAFARIS line is in warm white, and a soft dark backing keeps it readable on bright grass and dark sunsets alike. Link preview images keep the mark well inside, so square thumbnails show it too.

### 21. Logo icon restored

The logo circle used an elephant icon that only exists in the paid version of Font Awesome, while the site loads the free version, so the logo showed an empty green circle on all 14 pages that use it. It is now an elephant silhouette by Delapouite from game-icons.net, licensed CC BY 3.0, built into the page. The licence requires credit, which sits in the homepage footer.

### 22. Trip page header on phones

The Book With Us button on trip pages squashed into a large green blob on phones. It now reads Book on phones, on one line, and Book With Us on larger screens.

### 23. Sticky bar on desktop

On desktop the sticky bar slightly overlapped the hero's See the Nine Journeys button. It now appears once the visitor scrolls past the hero, and still hides at the form. Phones are unchanged.

## More of Sundown's own photos, third upload of the day

### 24. Guest photo with zebras

A guest feeding zebras, used with her consent, now appears in two places. On the homepage it sits at the top of the Our Story figures. On the weekend getaway page, the paid ads landing page, it replaces the stock photo labelled Guests on a private safari vehicle. The weekend page strip also swaps a stock golden hour photo for Sundown's sunset Land Cruiser. The strip's photos are now taller, so they are no longer thin 150 pixel bands on phones.

### 25. The Explorer shows the partner Land Rover

The Explorer card, its link preview and its phone banner now use a sharper, 1200 pixel photo of the same partner Land Rover, shown under Sundown's agreement with the partner. The vehicle's name was removed from the grille and the number plate is cropped out or removed. On desktop the Explorer banner keeps its stock image, because the photo is not wide enough for a sharp full width banner.

All new images measure 100 percent sharp on an iPhone 13 sized screen and on a high resolution desktop.

### 26. Licensed photos for Ultimate Kenya and the rhino story

Baraka confirmed Sundown has the rights to these photos. The lion with Kilimanjaro now leads the Ultimate Kenya card, its phone banner and its link preview, which matches the trip's Amboseli and Masai Mara itinerary. The two white rhinos are now the featured image and link preview of the blog post I Pointed My Rifle, a story set at Ol Pejeta. These photos carry no Sundown mark, because a brand mark on licensed photos would suggest Sundown took them. On desktop the Ultimate Kenya banner keeps its stock image, since the photo is 720 pixels and too small for a full width banner.

Two further photos were held back. The tusker elephant was enlarged from a thumbnail before it arrived and looks smeared even at card size. The lions feeding with elephants behind them has the hallmarks of an AI generated image.

### 27. Blog posts on phones

56 blog posts had a typo in their phone styles, with every bracket doubled, so the phone layout never applied. Their navigation and page padding stayed at desktop sizes, and the featured image stayed 400 pixels tall, which zoomed and blurred it. All 56 are fixed.

### 28. From the field gallery

A new homepage section, From the field, sits just above the enquiry form. It shows seven real photos with short captions: a white rhino crossing the track, a rhino grazing in Nairobi National Park with the skyline behind, Point Lenana on Mount Kenya, a guide with guests at their vehicle, an open Land Cruiser at a lunch stop, the partner Land Rover's leather seats, and the Land Rover ready for a Nairobi pickup. It ends with a Plan my trip button that jumps to the form, tracked as field_gallery_click in GA4 and Clarity.

It is placed right before the form on purpose. A visitor who has just seen real vehicles and real sightings meets the form at the moment of highest trust. The layout is two columns on phones and three on desktop, every image loads only when scrolled to, and all seven measure 100 percent sharp on phone and desktop. The Land Rover front photo is cropped above its number plate.

## Compact layout, 26 October afternoon

### 29. Homepage made compact

The phone homepage is about 40 percent shorter, from roughly 18,000 to 11,000 pixels of scrolling, and desktop about 13 percent shorter. Section spacing is now 40 to 56 pixels on phones and 56 to 64 on desktop, instead of up to 96. On phones each row of trips (3, 5 and 7 days) is a swipeable row showing one card with the next peeking in, with a small Swipe hint, instead of nine full height cards stacked. The four guest reviews swipe the same way. Card descriptions are trimmed to three lines on phones, and the full text stays on the trip pages.

### 30. Hero with one centred call to action

The hero is now centred, with one button, Get My Free Itinerary, tracked as hero_cta_click. The See the Nine Journeys button and the side panel holding the rating and the Sundown Promise were removed. Below the button sits a row of four trust badges with gold icons: 4.9 on Google from 16 guest reviews, KATO bonded, 4 guests max, and Reply in 2 hours. They sit in one bar on desktop and a two by two grid on phones. The intro paragraph was shortened. The desktop video still plays behind it, now with an even overlay so centred text stays readable.

### 31. Three years operating

Every mention of seven years now says three years: the Our Story figures and text, the footer, the Explorer trip page and the cost guide.

### 32. Icons in Our Story

The four figures, years operating, guests per vehicle, private journeys and conservancy licences, each have a gold icon in a circle. The three cards below them use matching circled icons. The credentials under The Sundown Safaris Team, Nairobi, Kenya are now pills with icons: KATO bonded, KWS compliant, TRA licensed and Nairobi based. The guest photo now uses its wider crop, which removes the empty space beside it on desktop and keeps the Sundown mark in view on phones.

### 33. Testimonials tightened

The figures and credentials repeated in the testimonials section were removed, since Our Story already shows them. The closing button is now rounded to match the rest of the site.

### 34. Compact footer

The footer is rebuilt in about half the height. It has the brand, a one line promise, WhatsApp and email, then three link columns: Our Safaris, Travel Guide and Company. Our Safaris now links straight to each duration row. Below sits a row of credential pills and a single line for copyright and the icon credit. On desktop the floating WhatsApp and Plan my trip bar steps aside when the footer is in view, so it never covers it.

### 35. Logo icon swapped, footer credit removed

The elephant in the logo circle is now the Lucide Lab elephant, ISC licence, which allows commercial use without a visible credit. A short licence note sits in the page code beside each icon. The previous elephant was licensed CC BY 3.0, which required the visible footer credit, so both were replaced together. Applies to all 14 pages with the logo.

### 36. Prices in each visitor's own currency

Visitors now see prices in their country's official currency, worked out from their location by Vercel. A visitor in the UK sees the Explorer from £1,160, in Kenya from KES 201,000, and in the US from $1,500 as before. It covers the homepage cards, the safaris menu, the budget options in the enquiry form, both prices on every trip page, and the 105 From prices in blog posts. A small picker under the trip grid and on each trip page lets anyone switch currency, and their choice is remembered.

**Rates.** A small function at /api/fx returns the visitor's country and the day's market rates for 154 currencies, from the free exchange-api feed with a second mirror as backup. Rates refresh daily and are kept on the visitor's device for three hours. If the rates ever fail to load, prices simply stay in US dollars.

**No FX loss to Sundown.** Prices stay set in US dollars, and bookings are still invoiced in US dollars (or shillings for resident quotes), so what Sundown receives never depends on a visitor's currency. The local figure adds 3% for bank conversion spreads and is rounded up, so the guide price is never below what the guest will actually pay. The page says so plainly: Prices in GBP at today's rate, plus 3% for bank conversion. Invoiced in US dollars. The 3% is one setting, FX_BUFFER, at the top of js/currency.js.

Search engines and the structured data still see US dollars, and the enquiry form still sends the US dollar budget band. GA4 records currency_shown and currency_change, which shows where visitors come from.

## Legal name, deposit, quotes and compact pages, 26 October night

### 37. Legal name in every footer

Every page now carries the same compact footer as the homepage, ending with: Copyright 2026 Sundown Capital Limited, trading as Sundown Safaris. Westlands, Nairobi, Kenya. The old footers said Sundown Safaris Ltd., which is not the registered company. The homepage structured data now lists Sundown Capital Limited as the legal name, with Sundown Safaris as the trading name. The trip and blog footers use built in icons, so blog posts don't need an extra icon library to show them.

### 38. Deposit is now 50 percent

The booking answer in the homepage FAQ, both on the page and in the structured data, now says a 50 percent deposit confirms the booking, with the balance due 60 days before travel. It was 30 percent.

### 39. Quotes and reviews in Montserrat, upright

Guest reviews, the Our Story quote, the review on every trip page, the testimonial on the featured posts, quotes inside blog posts and the reviews on the weekend getaway page now use Montserrat in an upright style instead of italic serif. Blog quotes also get a gold side bar and a soft background so they stand out from the text.

### 40. Compact trip and blog pages

Trip pages are about 13 percent shorter on phones and desktop before the footer. The itinerary days sit closer together, the three feature cards become slim rows on phones, and section and card padding is tighter. Standard blog posts are about 7 to 13 percent shorter, with a smaller header image, tighter headings and paragraph spacing, and a slightly larger 17 pixel text size on phones for easier reading. Tables in articles now keep a readable width and scroll sideways on phones instead of squeezing into tall narrow rows; 29 tables are covered. The featured posts' header button now reads Book on phones instead of squashing. The shared styles live in css/sundown-shared.css.

# How to check the work

1. **Form.** Submit one test enquiry from a phone. The success message should appear straight away, and GA4 Realtime should show generate_lead once with a value.
2. **Date picker.** On a phone, tap the date field once. One month should open in the centre with the gold step bar.
3. **Sticky bar.** Scroll the homepage on a phone. The two buttons stay at the bottom, disappear at the form and return after it.
4. **Structured data.** Paste a trip page address into Google's Rich Results Test. It should detect the product and its price.
5. **Link previews.** Send a trip page link to yourself on WhatsApp. It should show the photo and price. WhatsApp keeps old previews for a while, so a link shared before this change may take time to refresh.
6. **Search Console.** Check the Pages report weekly. Indexed pages were 16 on 19 October, up from 9 on 7 October.

# Still to do

1. Six trips still use stock photos: the Photographer, Trailblazer, Horizon Chaser, Ultimate Kenya, Voyager and Constellation. Each needs a real photo of what it promises, such as a balloon, Amboseli elephants with Kilimanjaro, a river crossing, a night sky camp, Samburu wildlife, and golden hour photography.
2. The guide with guests photo is ready but waiting for the guests' permission to appear.
3. Send the original file for the Dreamcatcher lion photo, shared as a document rather than a photo so WhatsApp does not compress it.
4. Twelve older image sizes in the images folder are no longer used. They are harmless and can be deleted on GitHub whenever convenient.
5. Add the DMARC email record in Vercel DNS. Name _dmarc, type TXT, value v=DMARC1; p=none; rua=mailto:bookings@sundownsafari.com
6. If blog/blog-index-tracked.html is not used in any campaign, delete it.
7. Review the homepage banner in early January, when the festive messages go out of date.
8. Write supporting content for Ultimate Kenya once Search Console passes 30 indexed pages.
9. Replace the Tailwind test CDN with a built stylesheet on the 12 pages that still use it.
