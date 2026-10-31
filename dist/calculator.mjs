export function portions(people) {
  if (!Number.isSafeInteger(people) || people < 0 || people > 999) throw new RangeError('People must be a whole number from 0 to 999.');
  return { full: Math.floor(people / 4), half: Math.floor((people % 4) / 2), quarter: people % 2 };
}
export function describe({ full, half, quarter }) {
  return [[full, 'full'], [half, 'half'], [quarter, 'quarter']].filter(([n]) => n).map(([n, size]) => `${n} ${size}`).join(' + ') || 'No portions yet';
}
export function billTotals(rows, extras, gst, override = null, gstMode = 'percentage') {
  const cents = value => Math.round(Number(value || 0) * 100);
  const mandi = rows.reduce((sum, row) => {
    const sizes = portions(row.people);
    return sum + Object.keys(sizes).reduce((s, size) => s + sizes[size] * cents(row.prices?.[size]), 0);
  }, 0);
  const extra = extras.reduce((sum, item) => sum + item.quantity * cents(item.price), 0);
  const tax = gstMode === 'amount' ? cents(gst) : Math.round((mandi + extra) * gst / 100);
  const calculated = mandi + extra + tax;
  return { mandi, extra, tax, calculated, total: override === null ? calculated : cents(override) };
}

// Largest-remainder allocation keeps every displayed share in whole paise.
export function allocateCents(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!weights.length || sum === 0) return weights.map(() => 0);
  const raw = weights.map(weight => total * weight / sum);
  const result = raw.map(Math.floor);
  const priority = raw.map((value, index) => ({index, fraction:value-result[index]})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
  const remainder = total - result.reduce((a,b)=>a+b,0);
  for (let i=0;i<remainder;i++) result[priority[i].index]++;
  return result;
}

export function dinersFor(rows) {
  const diners=[];
  rows.forEach((row,index)=>{
    let slot=0;
    for (const [size,capacity] of [['full',4],['half',2],['quarter',1]]) {
      const count=portions(row.people)[size];
      for(let plate=0;plate<count;plate++) {
        const price=Math.round(Number(row.prices?.[size]||0)*100);
        const shares=allocateCents(price,Array(capacity).fill(1));
        for(let seat=0;seat<capacity;seat++) {
          const id=`${row.id??index}:${slot++}`;
          diners.push({id,flavor:row.name,size,capacity,plate:plate+1,price,food:shares[seat],defaultName:`Person ${diners.length+1}`});
        }
      }
    }
  });
  return diners;
}

export function consumptionBill(rows, extras, gst, override=null, gstMode='percentage') {
  const diners=dinersFor(rows).map(d=>({...d,extras:0,tax:0,adjustment:0,total:0}));
  const byId=new Map(diners.map((d,i)=>[d.id,i]));
  const unassigned=[];
  extras.forEach((item,index)=>{
    if(!item.quantity)return;
    const users=[...new Set(item.users??[])].filter(id=>byId.has(id));
    if(!users.length){unassigned.push(index);return;}
    const shares=allocateCents(Math.round(Number(item.price||0)*100)*item.quantity,users.map(()=>1));
    users.forEach((id,i)=>diners[byId.get(id)].extras+=shares[i]);
  });
  const bill=billTotals(rows,extras,gst,override,gstMode);
  const subtotals=diners.map(d=>d.food+d.extras);
  const taxShares=allocateCents(bill.tax,subtotals);
  diners.forEach((d,i)=>{d.tax=taxShares[i];d.total=d.food+d.extras+d.tax;});
  const base=diners.map(d=>d.total);
  const missingPrices=rows.some(row=>Object.entries(portions(row.people)).some(([size,n])=>n>0&&(row.prices?.[size]??'')===''))||extras.some(x=>x.quantity>0&&(x.price??'')==='');
  const noBasis=subtotals.every(n=>n===0)&&(bill.tax>0||bill.total>0);
  const ready=!unassigned.length&&!missingPrices&&!noBasis&&diners.length>0;
  if(override!==null&&ready){
    const finalShares=allocateCents(bill.total,base);
    diners.forEach((d,i)=>{d.adjustment=finalShares[i]-d.total;d.total=finalShares[i];});
  }
  return {...bill,diners,unassigned,missingPrices,noBasis,ready};
}
