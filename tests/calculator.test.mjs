import test from 'node:test';
import assert from 'node:assert/strict';
import { portions, describe, billTotals, consumptionBill, dinersFor, allocateCents } from '../dist/calculator.mjs';
test('serving examples, including odd-sized groups',()=>{
  assert.deepEqual(portions(0),{full:0,half:0,quarter:0});
  assert.deepEqual(portions(1),{full:0,half:0,quarter:1});
  assert.deepEqual(portions(2),{full:0,half:1,quarter:0});
  assert.deepEqual(portions(4),{full:1,half:0,quarter:0});
  assert.deepEqual(portions(7),{full:1,half:1,quarter:1});
  assert.equal(describe(portions(11)),'2 full + 1 half + 1 quarter');
});
test('every supported group size has exact coverage and minimum number of portions',()=>{
  for(let n=0;n<=999;n++){
    const {full,half,quarter}=portions(n);
    assert.equal(full*4+half*2+quarter,n);
    for(let f=0;f<=Math.floor(n/4);f++){
      const remainder=n-4*f;
      assert.ok(full+half+quarter<=f+Math.floor(remainder/2)+remainder%2);
    }
  }
});
test('invalid counts cannot produce an order',()=>{
  for(const n of [-1,1.5,NaN,Infinity,1000,'4',null])assert.throws(()=>portions(n),RangeError);
});
test('each flavor uses its own portion prices, with extras and GST',()=>{
  const rows=[{people:7,prices:{full:800,half:450,quarter:250}},{people:4,prices:{full:900}}];
  assert.deepEqual(billTotals(rows,[{quantity:2,price:40}],5),{mandi:240000,extra:8000,tax:12400,calculated:260400,total:260400});
});
test('final bill replaces calculated total without adding GST twice',()=>{
  const bill=billTotals([{people:4,prices:{full:800}}],[{quantity:2,price:40}],5,1000);
  assert.equal(bill.calculated,92400);assert.equal(bill.total,100000);
});
test('money rounds to paise and absent prices count as zero',()=>{
  assert.equal(billTotals([{people:1}],[],0).total,0);
  assert.equal(billTotals([],[{quantity:3,price:10.10}],5).total,3182);
  assert.equal(billTotals([],[],0,0).total,0);
});
test('direct GST is added once, including fractional rupees',()=>{
  const rows=[{people:4,prices:{full:800}}],extras=[{quantity:2,price:40}];
  const bill=billTotals(rows,extras,50.50,null,'amount');
  assert.equal(bill.tax,5050);
  assert.equal(bill.total,93050);
  assert.equal(billTotals(rows,extras,0,null,'amount').total,88000);
  assert.equal(billTotals(rows,extras,50.50,1000,'amount').total,100000);
});
test('full, half, and quarter consumers pay their own portion rate',()=>{
  const rows=[{id:'a',name:'Alfahm',people:7,prices:{full:800,half:500,quarter:300}}];
  const bill=consumptionBill(rows,[],0);
  assert.equal(bill.ready,true);
  assert.deepEqual(bill.diners.map(d=>d.total),[20000,20000,20000,20000,25000,25000,30000]);
  assert.equal(bill.diners.reduce((s,d)=>s+d.total,0),160000);
});
test('extras charge only selected consumers and GST follows consumption',()=>{
  const rows=[{id:'a',name:'Alfahm',people:4,prices:{full:800}}];
  const bill=consumptionBill(rows,[{quantity:2,price:40,users:['a:0','a:2']}],5);
  assert.deepEqual(bill.diners.map(d=>d.extras),[4000,0,4000,0]);
  assert.deepEqual(bill.diners.map(d=>d.total),[25200,21000,25200,21000]);
  assert.equal(bill.diners.reduce((s,d)=>s+d.total,0),bill.total);
});
test('direct tax and final restaurant bill reconcile exactly without equal averaging',()=>{
  const rows=[{id:'a',people:2,prices:{half:500}},{id:'b',people:1,prices:{quarter:300}}];
  const bill=consumptionBill(rows,[{quantity:1,price:10,users:['a:0']}],17.37,900,'amount');
  assert.equal(bill.ready,true);
  assert.notEqual(bill.diners[0].total,bill.diners[1].total);
  assert.equal(bill.diners.reduce((s,d)=>s+d.total,0),90000);
  assert.equal(bill.diners.reduce((s,d)=>s+d.tax,0),1737);
  assert.ok(bill.diners.every(d=>d.food+d.extras+d.tax+d.adjustment===d.total));
});
test('unassigned extras, missing prices, and missing allocation basis block final shares',()=>{
  const rows=[{id:'a',people:1,prices:{quarter:200}}];
  assert.equal(consumptionBill(rows,[{quantity:1,price:40,users:[]}],0).ready,false);
  assert.equal(consumptionBill(rows,[{quantity:1,price:40,users:['deleted:0']}],0).ready,false);
  assert.equal(consumptionBill([{id:'a',people:1}],[],0).ready,false);
  assert.equal(consumptionBill([{id:'a',people:1,prices:{quarter:0}}],[],10,null,'amount').ready,false);
  assert.equal(consumptionBill([{id:'a',people:1,prices:{quarter:0}}],[],0).ready,true);
  assert.equal(consumptionBill(rows,[{quantity:0,price:'',users:[]}],0).ready,true);
});
test('paise allocation preserves totals, per plate, even for awkward prices',()=>{
  assert.deepEqual(allocateCents(101,[1,1,1,1]),[26,25,25,25]);
  const diners=dinersFor([{id:'a',people:8,prices:{full:800.01}}]);
  assert.deepEqual(diners.map(d=>d.food),[20001,20000,20000,20000,20001,20000,20000,20000]);
  for(let total=0;total<1000;total++)assert.equal(allocateCents(total,[1,3,9]).reduce((a,b)=>a+b,0),total);
});
