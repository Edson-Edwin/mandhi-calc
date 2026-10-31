import { portions, describe, billTotals } from './calculator.mjs';
const $ = id => document.getElementById(id);
const defaults = () => ({guests:12, rows:[{name:'Alfahm',people:8},{name:'Peri Peri',people:4}]});
let state = defaults();
try {
  const saved = JSON.parse(localStorage.getItem('mandi-table-v1'));
  if (saved && Number.isInteger(saved.guests) && saved.guests >= 1 && saved.guests <= 999 && Array.isArray(saved.rows) && saved.rows.length <= 50 && saved.rows.every(r => typeof r.name === 'string' && r.name.trim() && r.name.length <= 40 && Number.isInteger(r.people) && r.people >= 0 && r.people <= 999)) state = saved;
  if (localStorage.getItem('mandi-theme') === 'dark') document.body.classList.add('dark');
} catch {}
const validMoney = value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1000000;
for(const row of state.rows) row.prices = Object.fromEntries(['full','half','quarter'].map(size=>[size,validMoney(row.prices?.[size])?row.prices[size]:'']));
state.extras = Array.isArray(state.extras) ? state.extras.filter(x=>typeof x.name==='string'&&x.name.length<=40&&Number.isInteger(x.quantity)&&x.quantity>=0&&x.quantity<=999&&validMoney(x.price)).slice(0,50) : [{name:'Pepsi',quantity:1,price:''}];
state.gst = Number.isFinite(state.gst)&&state.gst>=0&&state.gst<=100?state.gst:0;
state.override = state.override===true;
state.finalBill = Number.isFinite(state.finalBill)&&state.finalBill>=0&&state.finalBill<=1000000000?state.finalBill:0;
const money = cents => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(cents/100);
const escapeHtml = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const presets = ['Alfahm','Peri Peri','Classic','Honey Chilli','Smoky BBQ'];
const assigned = () => state.rows.reduce((n,r) => n+r.people,0);
function save(){try{localStorage.setItem('mandi-table-v1',JSON.stringify(state));}catch{}}
function renderRows(){
  $('flavors').innerHTML = state.rows.map((r,i) => `<div class="flavor-row"><span class="flavor-symbol ${r.name==='Peri Peri'?'peri':r.name==='Alfahm'?'':'other'}" aria-hidden="true">${r.name==='Alfahm'?'♨':r.name==='Peri Peri'?'♧':'✧'}</span><div class="flavor-info"><div class="flavor-name">${escapeHtml(r.name)}</div><div class="flavor-subtitle">${r.name==='Alfahm'?'The charcoal-grilled favorite':r.name==='Peri Peri'?'A little heat, a lot of flavor':'A flavor for your table'}</div></div><div class="stepper"><button data-row="${i}" data-step="-1" aria-label="One fewer person for ${escapeHtml(r.name)}" ${r.people===0?'disabled':''}>−</button><input type="number" inputmode="numeric" min="0" max="999" data-row-input="${i}" value="${r.people}" aria-label="People for ${escapeHtml(r.name)}"><button data-row="${i}" data-step="1" aria-label="One more person for ${escapeHtml(r.name)}" ${r.people===999?'disabled':''}>+</button></div><button class="remove-flavor" data-remove="${i}" aria-label="Remove ${escapeHtml(r.name)}">×</button></div>`).join('');
  $('flavor-chips').innerHTML=presets.filter(name=>!state.rows.some(r=>r.name.toLowerCase()===name.toLowerCase())).map(name=>`<button data-add="${name}">+ ${name}</button>`).join('');
  $('flavor-count').textContent=state.rows.length;
  $('split').disabled=!state.rows.length;
  renderPrices();
  update();
}
function update(){
  const count=assigned(), remaining=state.guests-count, complete=remaining===0;
  $('guests').value=state.guests;
  document.querySelectorAll('[data-guest-step]').forEach(b=>b.disabled=Number(b.dataset.guestStep)<0?state.guests===1:state.guests===999);
  document.querySelectorAll('[data-guests]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.guests)===state.guests);b.setAttribute('aria-pressed',String(Number(b.dataset.guests)===state.guests));});
  $('summary-people').textContent=state.guests;
  const active=state.rows.filter(r=>r.people>0);
  $('summary-caption').textContent=active.length?`${active.length} flavor${active.length===1?'':'s'}. Something for everyone.`:'Your next great meal starts here.';
  const totals={full:0,half:0,quarter:0};
  $('order-lines').innerHTML=active.length?active.map(r=>{const p=portions(r.people);Object.keys(totals).forEach(k=>totals[k]+=p[k]);return `<div class="order-line"><div><strong>${escapeHtml(r.name)}</strong><span>${r.people} ${r.people===1?'person':'people'}</span></div><p>${describe(p)}</p></div>`;}).join(''):'<div class="order-line"><p>Add a flavor and a few hungry people.</p></div>';
  for(const k of Object.keys(totals)) $(k+'-total').textContent=totals[k];
  $('covered').textContent=`${count} / ${state.guests}`;
  $('progress').style.width=`${Math.min(100,count/state.guests*100)}%`;
  $('progress').style.background=remaining<0?'#c48631':'';
  const message=complete?`All ${state.guests} people accounted for. Let’s eat!`:remaining>0?`${remaining} ${remaining===1?'person still needs':'people still need'} a flavor. Assign them above.`:`${-remaining} extra ${remaining===-1?'person assigned':'people assigned'}. Adjust your flavors or group size.`;
  $('allocation').className=`allocation${complete?'':' warning'}`;
  $('allocation').textContent=`${complete?'✓':'ⓘ'} ${message}`;
  $('summary-status').textContent=complete?'Everyone is covered. Your order is ready.':remaining>0?'Finish assigning people to complete your order.':'You’ve assigned more people than your group size.';
  $('copy').disabled=!complete;
  $('copy-feedback').textContent='';
  updateBill();
  save();
}
function parseCount(input,min){const n=Number(input.value);if(input.value.trim()===''||!Number.isInteger(n)||n<min||n>999){input.setCustomValidity(`Enter a whole number from ${min} to 999.`);input.reportValidity();return null;}input.setCustomValidity('');return n;}
$('guests').addEventListener('change',e=>{const n=parseCount(e.target,1);if(n!==null){state.guests=n;update();}else e.target.value=state.guests;});
$('guests').addEventListener('input',e=>{e.target.setCustomValidity('');const n=Number(e.target.value);if(e.target.value!==''&&Number.isInteger(n)&&n>=1&&n<=999){state.guests=n;update();}});
document.querySelectorAll('[data-guest-step]').forEach(b=>b.addEventListener('click',()=>{state.guests=Math.min(999,Math.max(1,state.guests+Number(b.dataset.guestStep)));update();}));
document.querySelectorAll('[data-guests]').forEach(b=>b.addEventListener('click',()=>{state.guests=Number(b.dataset.guests);update();}));
$('flavors').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.remove!==undefined)state.rows.splice(Number(b.dataset.remove),1);else if(b.dataset.row!==undefined){const r=state.rows[Number(b.dataset.row)];r.people=Math.max(0,Math.min(999,r.people+Number(b.dataset.step)));}else return;const row=b.dataset.row,step=b.dataset.step;renderRows();if(row!==undefined)$('flavors').querySelector(`[data-row="${row}"][data-step="${step}"]`)?.focus();else $('custom-open').focus();});
$('flavors').addEventListener('input',e=>{if(e.target.dataset.rowInput===undefined)return;e.target.setCustomValidity('');const n=Number(e.target.value);if(e.target.value!==''&&Number.isInteger(n)&&n>=0&&n<=999){state.rows[Number(e.target.dataset.rowInput)].people=n;update();e.target.parentElement.querySelector('[data-step="-1"]').disabled=n===0;e.target.parentElement.querySelector('[data-step="1"]').disabled=n===999;}});
$('flavors').addEventListener('change',e=>{if(e.target.dataset.rowInput===undefined)return;const row=state.rows[Number(e.target.dataset.rowInput)],n=parseCount(e.target,0);if(n!==null){row.people=n;update();e.target.parentElement.querySelector('[data-step="-1"]').disabled=n===0;e.target.parentElement.querySelector('[data-step="1"]').disabled=n===999;}else e.target.value=row.people;});
function addFlavor(name){state.rows.push({name,people:Math.max(0,state.guests-assigned()),prices:{full:'',half:'',quarter:''}});renderRows();}
$('flavor-chips').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)addFlavor(b.dataset.add);});
$('split').addEventListener('click',()=>{if(!state.rows.length)return;const base=Math.floor(state.guests/state.rows.length),extra=state.guests%state.rows.length;state.rows.forEach((r,i)=>r.people=base+(i<extra?1:0));renderRows();});
$('custom-open').addEventListener('click',()=>{$('custom-form').reset();$('custom-error').textContent='';$('custom-dialog').showModal();$('custom-name').focus();});
$('custom-close').addEventListener('click',()=>$('custom-dialog').close());
$('custom-form').addEventListener('submit',e=>{e.preventDefault();const name=$('custom-name').value.trim();if(!name){$('custom-error').textContent='Please enter a flavor name.';return;}if(state.rows.some(r=>r.name.toLowerCase()===name.toLowerCase())){$('custom-error').textContent='This flavor is already at your table.';return;}if(state.rows.length>=50){$('custom-error').textContent='Your table can have up to 50 flavors.';return;}addFlavor(name);$('custom-dialog').close();});
$('reset').addEventListener('click',()=>{state={guests:4,rows:[{name:'Alfahm',people:4,prices:{full:'',half:'',quarter:''}}],extras:[{name:'Pepsi',quantity:1,price:''}],gst:0,override:false,finalBill:0};renderExtras();syncBillFields();renderRows();});
function themeLabel(){$('theme').setAttribute('aria-label',`Switch to ${document.body.classList.contains('dark')?'light':'dark'} theme`);}
$('theme').addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('mandi-theme',document.body.classList.contains('dark')?'dark':'light');}catch{}themeLabel();});
$('copy').addEventListener('click',async()=>{if(assigned()!==state.guests)return;const b=billTotals(state.rows,state.extras,state.gst,state.override?state.finalBill:null);const extrasText=state.extras.filter(x=>x.quantity>0&&x.name.trim()).map(x=>`${x.name}: ${x.quantity} × ${money(Math.round(Number(x.price||0)*100))}`).join('\n');const text=`Mandi order — ${state.guests} ${state.guests===1?'person':'people'}\n\n`+state.rows.filter(r=>r.people>0).map(r=>`${r.name}: ${describe(portions(r.people))} (${r.people} ${r.people===1?'person':'people'})`).join('\n')+(extrasText?'\n\nExtras\n'+extrasText:'')+`\n\nMandi: ${money(b.mandi)}\nExtras: ${money(b.extra)}\nGST (${state.gst}%): ${money(b.tax)}\n${state.override?'Final restaurant bill':'Total bill'}: ${money(b.total)}\nPer person (equal split): ${money(Math.round(b.total/state.guests))}`+(state.override?'\nFinal bill includes tax and extras.':'\nBased on entered prices; blank prices count as ₹0.')+'\n\nPortions: full serves 4 · half serves 2 · quarter serves 1';try{await navigator.clipboard.writeText(text);$('copy-feedback').textContent='✓ Order copied. Good food is on the way!';}catch{$('copy-text').value=text;$('copy-dialog').showModal();$('copy-text').select();}});
$('copy-close').addEventListener('click',()=>$('copy-dialog').close());
function renderPrices(){
  $('price-rows').innerHTML=state.rows.map((r,i)=>`<div class="price-row"><span class="price-name">${escapeHtml(r.name)}</span>${['full','half','quarter'].map(size=>`<input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" value="${r.prices?.[size]??''}" data-price-row="${i}" data-size="${size}" aria-label="${escapeHtml(r.name)} ${size} price in rupees">`).join('')}</div>`).join('');
}
function renderExtras(){
  $('extra-rows').innerHTML=state.extras.map((x,i)=>`<div class="extra-row"><input maxlength="40" placeholder="Item name" value="${escapeHtml(x.name)}" data-extra="${i}" data-field="name" aria-label="Extra item ${i+1} name"><input type="number" min="0" max="999" step="1" value="${x.quantity}" data-extra="${i}" data-field="quantity" aria-label="Extra item ${i+1} quantity"><input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" value="${x.price}" data-extra="${i}" data-field="price" aria-label="Extra item ${i+1} price in rupees"><button data-remove-extra="${i}" class="remove-flavor" aria-label="Remove extra item ${i+1}">×</button></div>`).join('');
  $('add-extra').disabled=state.extras.length>=50;
}
function syncBillFields(){ $('gst').value=state.gst; $('override-enabled').checked=state.override; $('bill-override').value=state.finalBill||''; $('override-fields').hidden=!state.override; }
function updateBill(){
  const b=billTotals(state.rows,state.extras,state.gst,state.override?state.finalBill:null);
  $('mandi-subtotal').textContent=money(b.mandi);$('extras-subtotal').textContent=money(b.extra);$('tax-label').textContent=`GST (${state.gst}%)`;$('tax-total').textContent=money(b.tax);$('grand-total').textContent=money(b.total);$('grand-label').textContent=state.override?'Final restaurant bill':'Total bill';$('per-person').textContent=money(Math.round(b.total/state.guests));
  const missing=state.rows.some(r=>Object.entries(portions(r.people)).some(([size,n])=>n>0&&(r.prices?.[size]??'')===''))||state.extras.some(x=>x.quantity>0&&x.price==='');
  $('bill-note').textContent=state.override?'Using your final bill, including tax and extras. Equal split rounded to the nearest paisa.':missing?'Some prices are blank and count as ₹0. Add them for a complete estimate.':'Equal split rounded to the nearest paisa. Tax applies to mandi and extras.';
  $('price-rows').querySelectorAll('input').forEach(el=>el.classList.toggle('used-price',portions(state.rows[Number(el.dataset.priceRow)].people)[el.dataset.size]>0));
}
function numberValue(input,max,integer=false){
  const value=Number(input.value||0);const valid=Number.isFinite(value)&&value>=0&&value<=max&&(!integer||Number.isInteger(value));
  input.setCustomValidity(valid?'':`Enter ${integer?'a whole number':'an amount'} from 0 to ${max}.`);
  if(!valid){input.reportValidity();return null;}
  return integer?value:Math.round(value*100)/100;
}
$('price-rows').addEventListener('input',e=>{const el=e.target;if(el.dataset.priceRow===undefined)return;const n=numberValue(el,1000000);if(n===null)return;state.rows[Number(el.dataset.priceRow)].prices[el.dataset.size]=el.value===''?'':n;update();});
$('extra-rows').addEventListener('input',e=>{const el=e.target;if(el.dataset.extra===undefined)return;const x=state.extras[Number(el.dataset.extra)],field=el.dataset.field;if(field==='name')x.name=el.value;else{const n=numberValue(el,field==='quantity'?999:1000000,field==='quantity');if(n===null)return;x[field]=field==='price'&&el.value===''?'':n;}update();});
$('extra-rows').addEventListener('click',e=>{const b=e.target.closest('[data-remove-extra]');if(!b)return;state.extras.splice(Number(b.dataset.removeExtra),1);renderExtras();update();});
$('add-extra').addEventListener('click',()=>{if(state.extras.length>=50)return;state.extras.push({name:'',quantity:1,price:''});renderExtras();update();$('extra-rows').querySelector(`[data-extra="${state.extras.length-1}"][data-field="name"]`).focus();});
$('gst').addEventListener('input',e=>{const n=numberValue(e.target,100);if(n!==null){state.gst=n;update();}});
$('override-enabled').addEventListener('change',e=>{state.override=e.target.checked;$('override-fields').hidden=!state.override;update();});
$('bill-override').addEventListener('input',e=>{const n=numberValue(e.target,1000000000);if(n!==null){state.finalBill=n;update();}});
themeLabel();renderExtras();syncBillFields();renderRows();
