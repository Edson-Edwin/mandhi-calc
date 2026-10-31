# Mandi Table

A responsive, dependency-free mandi order and bill calculator.

## Run

From this directory, run `npm start` and open `http://localhost:4173`.
Run `npm test` for portion and billing checks. Static files live in `dist/`.

## Behavior

- Full serves 4, half serves 2, and quarter serves 1. Portions are calculated separately per flavor, using full portions first.
- Assign people to Alfahm, Peri Peri, other presets, or custom flavors. Split evenly distributes any remaining person to the first flavors.
- Enter independent full, half, and quarter prices for each flavor. Highlighted fields are the portions currently in the order.
- Add drinks or other extras with quantities and unit prices. Prices use INR; blank prices count as zero.
- The entered GST percentage applies to the combined mandi and extras subtotal. No tax rate is assumed.
- An optional final restaurant bill replaces the calculated total and already includes tax and extras.
- Equal per-person splits round to the nearest paisa and may differ by a few paise when multiplied back.
- Copy includes the portions, extras, tax, bill total, and equal split. Copy is disabled until the group allocation matches.
- Plan and theme are saved in this browser's local storage. No account or backend is required for the calculator.

The static site is configured in `.openai/hosting.json`. Google Fonts is optional; system fonts are used if it is unavailable.
