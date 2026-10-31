import { portions, describe, consumptionBill, dinersFor } from './calculator.mjs';
const $ = id => document.getElementById(id);
const defaults = () => ({guests:4, personNames:{}, rows:[],extras:[{name:'Pepsi',quantity:1,price:''}],gst:0,gstMode:'percentage',gstAmount:0,override:false,finalBill:0});
let currentStep=1, furthestStep=1;
let state = defaults();
try {
  const saved = JSON.parse(localStorage.getItem('mandi-table-v1'));
  if (saved && Number.isInteger(saved.guests) && saved.guests >= 1 && saved.guests <= 999 && Array.isArray(saved.rows) && saved.rows.length <= 50 && saved.rows.every(r => typeof r.name === 'string' && r.name.trim() && r.name.length <= 40 && Number.isInteger(r.people) && r.people >= 0 && r.people <= 999)) state = saved;
  if (localStorage.getItem('mandi-theme') === 'dark') document.body.classList.add('dark');
} catch {}
const validMoney = value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1000000;
for(const row of state.rows) row.id=typeof row.id==='string'&&/^[a-zA-Z0-9-]+$/.test(row.id)?row.id:crypto.randomUUID();
state.personNames=state.personNames&&typeof state.personNames==='object'&&!Array.isArray(state.personNames)?Object.fromEntries(Object.entries(state.personNames).filter(([key,value])=>typeof value==='string'&&value.length<=40)):{};
for(const row of state.rows) row.prices = Object.fromEntries(['full','half','quarter'].map(size=>[size,validMoney(row.prices?.[size])?row.prices[size]:'']));
state.extras = Array.isArray(state.extras) ? state.extras.filter(x=>typeof x.name==='string'&&x.name.length<=40&&Number.isInteger(x.quantity)&&x.quantity>=0&&x.quantity<=999&&validMoney(x.price)).slice(0,50) : [{name:'Pepsi',quantity:1,price:''}];
for(const extra of state.extras)extra.users=Array.isArray(extra.users)?extra.users.filter(id=>typeof id==='string'):[];
state.gst = Number.isFinite(state.gst)&&state.gst>=0&&state.gst<=100?state.gst:0;
state.gstMode = state.gstMode==='amount'?'amount':'percentage';
state.gstAmount = Number.isFinite(state.gstAmount)&&validMoney(state.gstAmount)?state.gstAmount:0;
state.override = state.override===true;
state.finalBill = Number.isFinite(state.finalBill)&&state.finalBill>=0&&state.finalBill<=1000000000?state.finalBill:0;
const money = cents => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(cents/100);
const escapeHtml = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const presets = ['Alfahm','Peri Peri','Classic','Honey Chilli','Smoky BBQ'];
const assigned = () => state.rows.reduce((n,r) => n+r.people,0);
function save(){try{localStorage.setItem('mandi-table-v1',JSON.stringify(state));}catch{}}
function renderRows(){
  if(currentStep<=3)furthestStep=Math.min(furthestStep,3);
  $('flavors').innerHTML = state.rows.map((r,i) => `<div class="flavor-row"><span class="flavor-symbol ${r.name==='Peri Peri'?'peri':r.name==='Alfahm'?'':'other'}" aria-hidden="true">${r.name==='Alfahm'?'♨':r.name==='Peri Peri'?'♧':'✧'}</span><div class="flavor-info"><div class="flavor-name">${escapeHtml(r.name)}</div><div class="flavor-subtitle">${r.name==='Alfahm'?'The charcoal-grilled favorite':r.name==='Peri Peri'?'A little heat, a lot of flavor':'A flavor for your table'}</div></div><div class="stepper"><button data-row="${i}" data-step="-1" aria-label="One fewer person for ${escapeHtml(r.name)}" ${r.people===0?'disabled':''}>−</button><input type="number" inputmode="numeric" min="0" max="999" data-row-input="${i}" value="${r.people}" aria-label="People for ${escapeHtml(r.name)}"><button data-row="${i}" data-step="1" aria-label="One more person for ${escapeHtml(r.name)}" ${r.people===999?'disabled':''}>+</button></div></div>`).join('');
  const choices=[...presets,...state.rows.map(r=>r.name).filter(name=>!presets.includes(name))];
  $('flavor-chips').innerHTML=choices.map(name=>{const selected=state.rows.some(r=>r.name===name);return `<button class="flavor-choice" data-flavor="${escapeHtml(name)}" aria-pressed="${selected}"><span class="flavor-symbol ${name==='Peri Peri'?'peri':'other'}" aria-hidden="true">${name==='Alfahm'?'♨':'✧'}</span><span>${escapeHtml(name)}</span><span class="choice-check" aria-hidden="true">${selected?'✓':''}</span></button>`;}).join('');
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
  if(currentStep===5)syncDinerControls();
  updateBill();
  updateFlow();
  save();
}
function parseCount(input,min){const n=Number(input.value);if(input.value.trim()===''||!Number.isInteger(n)||n<min||n>999){input.setCustomValidity(`Enter a whole number from ${min} to 999.`);input.reportValidity();return null;}input.setCustomValidity('');return n;}
$('guests').addEventListener('change',e=>{const n=parseCount(e.target,1);if(n!==null){state.guests=n;update();}else updateFlow();});
$('guests').addEventListener('input',e=>{e.target.setCustomValidity('');const n=Number(e.target.value);if(e.target.value!==''&&Number.isInteger(n)&&n>=1&&n<=999){state.guests=n;furthestStep=Math.min(furthestStep,3);update();}else updateFlow();});
document.querySelectorAll('[data-guest-step]').forEach(b=>b.addEventListener('click',()=>{state.guests=Math.min(999,Math.max(1,state.guests+Number(b.dataset.guestStep)));update();}));
document.querySelectorAll('[data-guests]').forEach(b=>b.addEventListener('click',()=>{state.guests=Number(b.dataset.guests);update();}));
$('flavors').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.remove!==undefined)state.rows.splice(Number(b.dataset.remove),1);else if(b.dataset.row!==undefined){const r=state.rows[Number(b.dataset.row)];r.people=Math.max(0,Math.min(999,r.people+Number(b.dataset.step)));}else return;const row=b.dataset.row,step=b.dataset.step;renderRows();if(row!==undefined)$('flavors').querySelector(`[data-row="${row}"][data-step="${step}"]`)?.focus();else $('custom-open').focus();});
$('flavors').addEventListener('input',e=>{if(e.target.dataset.rowInput===undefined)return;e.target.setCustomValidity('');const n=Number(e.target.value);if(e.target.value!==''&&Number.isInteger(n)&&n>=0&&n<=999){state.rows[Number(e.target.dataset.rowInput)].people=n;update();e.target.parentElement.querySelector('[data-step="-1"]').disabled=n===0;e.target.parentElement.querySelector('[data-step="1"]').disabled=n===999;}});
$('flavors').addEventListener('change',e=>{if(e.target.dataset.rowInput===undefined)return;const row=state.rows[Number(e.target.dataset.rowInput)],n=parseCount(e.target,0);if(n!==null){row.people=n;update();e.target.parentElement.querySelector('[data-step="-1"]').disabled=n===0;e.target.parentElement.querySelector('[data-step="1"]').disabled=n===999;}else e.target.value=row.people;});
function addFlavor(name){if(state.rows.length>=50)return;state.rows.push({id:crypto.randomUUID(),name,people:0,prices:{full:'',half:'',quarter:''}});furthestStep=Math.min(furthestStep,3);renderRows();}
$('flavor-chips').addEventListener('click',e=>{const b=e.target.closest('[data-flavor]');if(!b)return;const name=b.dataset.flavor,index=state.rows.findIndex(r=>r.name===name);if(index<0)addFlavor(name);else{state.rows.splice(index,1);furthestStep=Math.min(furthestStep,3);renderRows();}Array.from($('flavor-chips').querySelectorAll('button')).find(el=>el.dataset.flavor===name)?.focus();});
$('split').addEventListener('click',()=>{if(!state.rows.length)return;const base=Math.floor(state.guests/state.rows.length),extra=state.guests%state.rows.length;state.rows.forEach((r,i)=>r.people=base+(i<extra?1:0));renderRows();});
$('custom-open').addEventListener('click',()=>{$('custom-form').reset();$('custom-error').textContent='';$('custom-dialog').showModal();$('custom-name').focus();});
$('custom-close').addEventListener('click',()=>$('custom-dialog').close());
$('custom-form').addEventListener('submit',e=>{e.preventDefault();const name=$('custom-name').value.trim();if(!name){$('custom-error').textContent='Please enter a flavor name.';return;}if(state.rows.some(r=>r.name.toLowerCase()===name.toLowerCase())){$('custom-error').textContent='This flavor is already at your table.';return;}if(state.rows.length>=50){$('custom-error').textContent='Your table can have up to 50 flavors.';return;}addFlavor(name);$('custom-dialog').close();});
$('reset').addEventListener('click',()=>{state=defaults();furthestStep=1;currentStep=1;renderExtras();syncBillFields();renderRows();showStep(1);});
function themeLabel(){$('theme').setAttribute('aria-label',`Switch to ${document.body.classList.contains('dark')?'light':'dark'} theme`);}
$('theme').addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('mandi-theme',document.body.classList.contains('dark')?'dark':'light');}catch{}themeLabel();});
async function copySummary(includeBill=false){
  if(!allocationComplete())return;
  let text=`Mandi order — ${state.guests} ${state.guests===1?'person':'people'}\n\n`+state.rows.filter(r=>r.people>0).map(r=>`${r.name}: ${describe(portions(r.people))} (${r.people} ${r.people===1?'person':'people'})`).join('\n');
  if(includeBill){
    const b=currentBill();
    if(!b.ready||!billingInputsValid())return;
    const extrasText=state.extras.filter(x=>x.quantity>0&&x.name.trim()).map(x=>`${x.name}: ${x.quantity} × ${money(Math.round(Number(x.price||0)*100))} — shared by ${b.diners.filter(d=>x.users.includes(d.id)).map(personName).join(', ')}`).join('\n');
    text+=(extrasText?'\n\nExtras\n'+extrasText:'')+`\n\nMandi: ${money(b.mandi)}\nExtras: ${money(b.extra)}\n${taxLabel()}: ${money(b.tax)}\n${state.override?'Final restaurant bill':'Total bill'}: ${money(b.total)}`+(state.override?'\nFinal bill difference allocated proportionally.':'')+'\n\nWhat each person pays\n'+b.diners.map(d=>`${personName(d)} (${d.flavor}, ${d.size} shared by ${d.capacity}): ${money(d.total)} — food ${money(d.food)}, extras ${money(d.extras)}, tax ${money(d.tax)}${d.adjustment?`, bill adjustment ${money(d.adjustment)}`:''}`).join('\n');
  }
  text+='\n\nPortions: full serves 4 · half serves 2 · quarter serves 1';
  try{await navigator.clipboard.writeText(text);$(includeBill?'bill-copy-feedback':'copy-feedback').textContent=includeBill?'✓ Bill summary copied.':'✓ Order copied. Ready to send to the restaurant.';}catch{$('copy-text').value=text;$('copy-dialog').showModal();$('copy-text').select();}
}
$('copy').addEventListener('click',()=>copySummary(false));
$('copy-bill').addEventListener('click',()=>copySummary(true));
$('copy-close').addEventListener('click',()=>$('copy-dialog').close());
function renderPrices(){
  $('price-rows').innerHTML=state.rows.map((r,i)=>`<div class="price-row"><span class="price-name">${escapeHtml(r.name)}</span>${['full','half','quarter'].map(size=>`<input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" value="${r.prices?.[size]??''}" data-price-row="${i}" data-size="${size}" aria-label="${escapeHtml(r.name)} ${size} price in rupees">`).join('')}</div>`).join('');
}
function renderExtras(){
  $('extra-rows').innerHTML=state.extras.map((x,i)=>`<div class="extra-item"><div class="extra-row"><input maxlength="40" placeholder="Item name" value="${escapeHtml(x.name)}" data-extra="${i}" data-field="name" aria-label="Extra item ${i+1} name"><input type="number" min="0" max="999" step="1" value="${x.quantity}" data-extra="${i}" data-field="quantity" aria-label="Extra item ${i+1} quantity"><input type="number" min="0" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" value="${x.price}" data-extra="${i}" data-field="price" aria-label="Extra item ${i+1} price in rupees"><button data-remove-extra="${i}" class="remove-flavor" aria-label="Remove extra item ${i+1}">×</button></div><details class="extra-users"><summary>Who used this item? <span data-users-count="${i}"></span></summary><div class="users-actions"><button type="button" class="text-button" data-users-all="${i}">Everyone</button><button type="button" class="text-button" data-users-none="${i}">Clear</button></div><div class="user-picker" data-users-picker="${i}"></div></details></div>`).join('');
  $('add-extra').disabled=state.extras.length>=50;
  syncDinerControls(true);
}
function syncBillFields(){ syncTaxFields(); $('override-enabled').checked=state.override; $('bill-override').value=state.finalBill||''; $('override-fields').hidden=!state.override; }
function billingInputsValid(){return Array.from(document.querySelectorAll('[data-panel="5"] input[type=number]')).filter(el=>el.id!=='bill-override'||state.override).every(el=>el.checkValidity());}
function currentBill(){return consumptionBill(state.rows,state.extras,state.gstMode==='amount'?state.gstAmount:state.gst,state.override?state.finalBill:null,state.gstMode);}
function personName(diner){return state.personNames[diner.id]?.trim()||diner.defaultName;}
let dinerSignature='';
function syncDinerControls(force=false){
  if(assigned()>999)return;
  const diners=dinersFor(state.rows),ids=new Set(diners.map(d=>d.id));
  for(const extra of state.extras)extra.users=(extra.users??[]).filter(id=>ids.has(id));
  const signature=JSON.stringify(diners.map(d=>[d.id,d.flavor,d.size]));
  if(signature!==dinerSignature){
    dinerSignature=signature;
    $('diner-names').innerHTML=diners.map(d=>`<div class="diner-name-row"><input maxlength="40" data-person-name="${d.id}" value="${escapeHtml(state.personNames[d.id]??'')}" placeholder="${d.defaultName}" aria-label="Name for ${d.defaultName}"><span>${escapeHtml(d.flavor)} · ${d.size} / ${d.capacity}</span></div>`).join('');
    force=true;
  }
  document.querySelectorAll('[data-users-picker]').forEach(picker=>{
    const i=Number(picker.dataset.usersPicker),item=state.extras[i];
    if(force||!picker.children.length)picker.innerHTML=diners.map(d=>`<label><input type="checkbox" data-extra-user="${i}" value="${d.id}" ${item.users.includes(d.id)?'checked':''}><span data-person-label="${d.id}">${escapeHtml(personName(d))}</span><small>${escapeHtml(d.flavor)} · ${d.size}</small></label>`).join('');
    const count=item.users.length;
    document.querySelector(`[data-users-count="${i}"]`).textContent=count?`${count} ${count===1?'person':'people'} selected`:'Select people';
  });
}
function updateBill(){
  if(assigned()>999)return;
  const b=currentBill();
  const validInputs=billingInputsValid();
  b.ready=b.ready&&validInputs;
  $('mandi-subtotal').textContent=money(b.mandi);$('extras-subtotal').textContent=money(b.extra);$('tax-label').textContent=taxLabel();$('tax-total').textContent=money(b.tax);$('grand-total').textContent=money(b.total);$('grand-label').textContent=state.override?'Final restaurant bill':'Total bill';
  $('bill-note').textContent=state.override?'The final-bill difference is distributed in proportion to each person’s itemized share.':'Tax is shared in proportion to food + extras. Any rounding paisa is assigned so all shares match the bill.';
  const issues=[];
  if(!validInputs)issues.push('Correct the invalid price, quantity, or tax amount before copying the bill.');
  if(b.missingPrices)issues.push('Enter prices for the portions and extras ordered (enter 0 for a free item).');
  if(b.unassigned.length)issues.push(`Select who used: ${b.unassigned.map(i=>state.extras[i].name.trim()||`Item ${i+1}`).join(', ')}.`);
  if(b.noBasis)issues.push('Enter item prices to distribute tax and the final bill fairly.');
  $('personal-status').textContent=issues.join(' ');
  $('personal-status').className=issues.length?'allocation warning':'';
  $('copy-bill').disabled=!b.ready;
  $('personal-shares').innerHTML=b.diners.map(d=>`<article class="person-share"><div class="person-share-heading"><div><strong>${escapeHtml(personName(d))}</strong><span>${escapeHtml(d.flavor)} · ${d.size} shared by ${d.capacity}</span></div><strong>${b.ready?money(d.total):'Pending'}</strong></div><div class="share-breakdown"><span>Food <b>${money(d.food)}</b></span><span>Extras <b>${money(d.extras)}</b></span><span>GST <b>${money(d.tax)}</b></span>${state.override?`<span>Adjustment <b>${b.ready?money(d.adjustment):'—'}</b></span>`:''}</div><small>${money(d.price)} ÷ ${d.capacity} for the ${d.size} portion${d.capacity>1?' (rounded to paise)':''}</small></article>`).join('');
  $('shares-check').textContent=b.ready?`✓ All individual shares add up to ${money(b.diners.reduce((sum,d)=>sum+d.total,0))}.`:'';
  $('price-rows').querySelectorAll('input').forEach(el=>el.classList.toggle('used-price',portions(state.rows[Number(el.dataset.priceRow)].people)[el.dataset.size]>0));
}
function numberValue(input,max,integer=false){
  const value=Number(input.value||0);const valid=Number.isFinite(value)&&value>=0&&value<=max&&(!integer||Number.isInteger(value));
  input.setCustomValidity(valid?'':`Enter ${integer?'a whole number':'an amount'} from 0 to ${max}.`);
  if(!valid){updateBill();input.reportValidity();return null;}
  return integer?value:Math.round(value*100)/100;
}
$('price-rows').addEventListener('input',e=>{const el=e.target;if(el.dataset.priceRow===undefined)return;const n=numberValue(el,1000000);if(n===null)return;state.rows[Number(el.dataset.priceRow)].prices[el.dataset.size]=el.value===''?'':n;update();});
$('extra-rows').addEventListener('input',e=>{const el=e.target;if(el.dataset.extra===undefined)return;const x=state.extras[Number(el.dataset.extra)],field=el.dataset.field;if(field==='name')x.name=el.value;else{const n=numberValue(el,field==='quantity'?999:1000000,field==='quantity');if(n===null)return;x[field]=field==='price'&&el.value===''?'':n;}update();});
$('extra-rows').addEventListener('click',e=>{const action=e.target.closest('[data-users-all],[data-users-none]');if(action){const all=action.dataset.usersAll!==undefined,i=Number(all?action.dataset.usersAll:action.dataset.usersNone);state.extras[i].users=all?dinersFor(state.rows).map(d=>d.id):[];syncDinerControls(true);update();return;}const b=e.target.closest('[data-remove-extra]');if(!b)return;state.extras.splice(Number(b.dataset.removeExtra),1);renderExtras();update();});
$('add-extra').addEventListener('click',()=>{if(state.extras.length>=50)return;state.extras.push({name:'',quantity:1,price:'',users:[]});renderExtras();update();$('extra-rows').querySelector(`[data-extra="${state.extras.length-1}"][data-field="name"]`).focus();});
$('diner-names').addEventListener('input',e=>{const id=e.target.dataset.personName;if(!id)return;state.personNames[id]=e.target.value;const diner=dinersFor(state.rows).find(d=>d.id===id);document.querySelectorAll('[data-person-label]').forEach(el=>{if(el.dataset.personLabel===id)el.textContent=personName(diner);});update();});
$('extra-rows').addEventListener('change',e=>{const i=e.target.dataset.extraUser;if(i===undefined)return;const item=state.extras[Number(i)],id=e.target.value;item.users=e.target.checked?[...new Set([...item.users,id])]:item.users.filter(user=>user!==id);update();});
function taxLabel(){return state.gstMode==='amount'?'GST (direct amount)':`GST (${state.gst}%)`;}
function syncTaxFields(){
  const amount=state.gstMode==='amount';
  $('gst').value=amount?state.gstAmount:state.gst;
  $('gst').max=amount?'1000000':'100';
  $('gst').setCustomValidity('');
  $('gst-input-label').textContent=amount?'GST amount in rupees':'GST percentage';
  $('gst-help').textContent=amount?'Added once to the bill subtotal':'Applied to mandi + extras';
  $('gst-unit').textContent=amount?'₹':'%';
  document.querySelectorAll('[name="gst-mode"]').forEach(radio=>radio.checked=radio.value===state.gstMode);
}
document.querySelectorAll('[name="gst-mode"]').forEach(radio=>radio.addEventListener('change',()=>{state.gstMode=radio.value;syncTaxFields();update();}));
$('gst').addEventListener('input',e=>{const amount=state.gstMode==='amount',n=numberValue(e.target,amount?1000000:100);if(n!==null){state[amount?'gstAmount':'gst']=n;update();}});
$('override-enabled').addEventListener('change',e=>{state.override=e.target.checked;$('override-fields').hidden=!state.override;update();});
$('bill-override').addEventListener('input',e=>{const n=numberValue(e.target,1000000000);if(n!==null){state.finalBill=n;update();}});
function allocationComplete(){
  return state.rows.length>0&&state.rows.every(r=>r.people>0)&&assigned()===state.guests&&Array.from($('flavors').querySelectorAll('input')).every(input=>input.value!==''&&input.checkValidity());
}
function updateFlow(){
  const validGuests=$('guests').value!==''&&$('guests').checkValidity();
  const complete=allocationComplete();
  const count=state.rows.length;
  $('people-next').disabled=!validGuests;
  $('flavors-next').disabled=!count||count>state.guests;
  $('order-next').disabled=!complete;
  $('bill-next').disabled=!complete;
  $('copy').disabled=!complete;
  $('selection-context').textContent=`Choosing flavors for ${state.guests} ${state.guests===1?'person':'people'}.`;
  $('selection-status').textContent=count>state.guests?'Choose no more flavors than people in your group.':count?`${count} flavor${count===1?'':'s'} selected. Next, decide how many people want each one.`:'Select at least one flavor to continue.';
  $('assign-description').textContent=`You have ${state.guests} people. Give each selected flavor at least one person.`;
  if(assigned()===state.guests&&count&&state.rows.some(r=>r.people===0)){$('allocation').className='allocation warning';$('allocation').textContent='Assign at least one person to every flavor, or go back and deselect unused flavors.';}
  $('step-label').textContent=`Step ${currentStep} of 5`;
  $('group-context').textContent=currentStep>1?`${state.guests} ${state.guests===1?'person':'people'}${currentStep>2?` · ${count} ${count===1?'flavor':'flavors'}`:''}`:'';
  $('confirmed-order').replaceChildren();
  const title=document.createElement('strong');title.textContent=`Your confirmed order · ${state.guests} people`;$('confirmed-order').append(title);
  for(const row of state.rows.filter(r=>r.people>0)){const line=document.createElement('div');line.textContent=`${row.name}: ${describe(portions(row.people))}`;$('confirmed-order').append(line);}
  document.querySelectorAll('[data-go]').forEach(button=>{const step=Number(button.dataset.go);button.disabled=step>furthestStep||(step>1&&!validGuests)||(step>2&&(!count||count>state.guests))||(step>3&&!complete);button.classList.toggle('done',step<currentStep);if(step===currentStep)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  $('bill-copy-feedback').textContent='';
}
function showStep(step){
  currentStep=step;furthestStep=Math.max(furthestStep,step);
  if(step===5){syncDinerControls();updateBill();}
  document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=Number(panel.dataset.panel)!==step);
  updateFlow();
  const heading=document.querySelector(`[data-panel="${step}"] h2`);heading.focus({preventScroll:true});
  document.querySelector('.flow-nav').scrollIntoView({block:'start',behavior:'instant'});
}
$('people-next').addEventListener('click',()=>{if(parseCount($('guests'),1)!==null)showStep(2);});
$('flavors-next').addEventListener('click',()=>{if(state.rows.length&&state.rows.length<=state.guests){renderRows();showStep(3);}});
$('order-next').addEventListener('click',()=>{if(allocationComplete())showStep(4);});
$('bill-next').addEventListener('click',()=>{if(allocationComplete())showStep(5);});
document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>showStep(Number(button.dataset.back))));
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{if(!button.disabled)showStep(Number(button.dataset.go));}));
$('flavors').addEventListener('input',()=>{furthestStep=Math.min(furthestStep,3);updateFlow();});
document.querySelectorAll('[data-guest-step],[data-guests]').forEach(button=>button.addEventListener('click',()=>{furthestStep=Math.min(furthestStep,3);updateFlow();}));
themeLabel();renderExtras();syncBillFields();renderRows();
