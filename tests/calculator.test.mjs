import test from 'node:test';
import assert from 'node:assert/strict';
import { portions, describe, billTotals } from '../dist/calculator.mjs';
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
