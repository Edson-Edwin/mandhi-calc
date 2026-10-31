export function portions(people) {
  if (!Number.isSafeInteger(people) || people < 0 || people > 999) throw new RangeError('People must be a whole number from 0 to 999.');
  return { full: Math.floor(people / 4), half: Math.floor((people % 4) / 2), quarter: people % 2 };
}
export function describe({ full, half, quarter }) {
  return [[full, 'full'], [half, 'half'], [quarter, 'quarter']].filter(([n]) => n).map(([n, size]) => `${n} ${size}`).join(' + ') || 'No portions yet';
}
export function billTotals(rows, extras, gst, override = null) {
  const cents = value => Math.round(Number(value || 0) * 100);
  const mandi = rows.reduce((sum, row) => {
    const sizes = portions(row.people);
    return sum + Object.keys(sizes).reduce((s, size) => s + sizes[size] * cents(row.prices?.[size]), 0);
  }, 0);
  const extra = extras.reduce((sum, item) => sum + item.quantity * cents(item.price), 0);
  const tax = Math.round((mandi + extra) * gst / 100);
  const calculated = mandi + extra + tax;
  return { mandi, extra, tax, calculated, total: override === null ? calculated : cents(override) };
}
