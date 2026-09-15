const test=require('node:test');
const assert=require('node:assert/strict');
const T=require('../chapter-tools.js');

test('从任务名称识别阿拉伯数字章节号',()=>assert.equal(T.extractChapterNo('雾隐城第1章正文试写测试'),1));
test('识别中文数字章节号',()=>assert.equal(T.extractChapterNo('第十二章｜钟楼'),12));
test('拆分连续六章',()=>{
  const text=Array.from({length:6},(_,i)=>`# 第${i+1}章｜标题${i+1}\n正文${i+1}`).join('\n\n')+'\n[[REPORT_COMPLETE]]';
  const rows=T.parseChapterBlocks(text);
  assert.equal(rows.length,6);assert.deepEqual(rows.map(x=>x.chapter_no),[1,2,3,4,5,6]);assert.equal(rows[5].body,'正文6');
});
test('检测重复与断章',()=>{
  const r=T.validateBatch([{chapter_no:1,body:'a'},{chapter_no:3,body:'b'},{chapter_no:3,body:'c'}]);
  assert.equal(r.ok,false);assert.match(r.errors.join('|'),/重复/);assert.match(r.errors.join('|'),/不连续/);
});
test('同章保存为下一版本',()=>assert.equal(T.nextVersion([{project_id:'p',chapter_no:1,version_no:1},{project_id:'p',chapter_no:1,version_no:3}],'p',1),4));
