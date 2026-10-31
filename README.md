# Mandi Table

A responsive, dependency-free mandi order and bill calculator.

## Run

From this directory, run `npm start` and open `http://localhost:4173`.
Run `npm test` for portion and billing checks. Static files live in `dist/`.

## Guided flow

1. Enter the total number of people.
2. Select mandi flavors (including custom flavors).
3. Assign a positive number of people to each flavor. Counts must match the group total.
4. Review and copy the full, half, and quarter portions to order.
5. Continue to prices, extras, GST, and the bill split.

Only the current step is shown. Back buttons preserve entries, and changing assignments requires reviewing the order again before billing. Existing saved entries remain available; a fresh plan starts without selected flavors.

## Behavior

- Full serves 4, half serves 2, and quarter serves 1. Portions are calculated separately per flavor, using full portions first.
- Assign people to Alfahm, Peri Peri, other presets, or custom flavors. Split evenly distributes any remaining person to the first flavors.
- Enter independent full, half, and quarter prices for each flavor. Highlighted fields are the portions currently in the order.
- Add drinks or other extras with quantities and unit prices, then select the people who used each item. Only those people share its cost. Optional names make selection easier.
- Each full portion is divided among its four consumers, each half among its two consumers, and each quarter belongs to one person. Different portion sizes and flavors can have different per-person food costs.
- Prices use INR. Missing prices and extras without consumers keep individual totals pending; enter 0 explicitly for a free item.
- GST can be a percentage of the mandi and extras subtotal, or a direct rupee amount added once. The two input values are preserved independently when switching modes. No tax rate is assumed.
- GST is allocated in proportion to each person’s food and extras subtotal.
- An optional final restaurant bill replaces the calculated total. Its difference from the itemized total is allocated proportionally to individual shares and shown as an adjustment; item prices and extras consumers are still required.
- Largest-remainder allocation distributes rounding paise so individual shares add up exactly to the bill.
- Order copy contains portions only. Bill copy includes extras consumers and each person’s food, extras, GST, adjustment, and total. Bill copy is disabled until all required prices and consumers are entered.
- Plan and theme are saved in this browser's local storage. No account or backend is required for the calculator.

The static site is configured in `.openai/hosting.json`. Google Fonts is optional; system fonts are used if it is unavailable.
