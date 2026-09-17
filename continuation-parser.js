(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ContinuationTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function rangeFromText(){
    const text=[...arguments].filter(Boolean).join('\n');
    const m=text.match(/第\s*(\d+)\s*(?:[-—–~～至到])\s*(\d+)\s*章/);
    if(!m)return null;
    const start=Number(m[1]),end=Number(m[2]);
    if(!start||end<start||end-start>19)return null;
    return Array.from({length:end-start+1},(_,i)=>start+i);
  }
  function parseBlocks(text){
    const source=String(text||'').replace(/\r\n?/g,'\n');
    const re=/^(?:#{1,6}\s*)?第\s*(\d+)\s*章(?:\s*[｜|：:\-—]\s*|\s+)?([^\n]*)$/gm;
    const hits=[...source.matchAll(re)];
    return hits.map((m,i)=>{const no=Number(m[1]),end=i+1<hits.length?hits[i+1].index:source.length;const body=source.slice(m.index+m[0].length,end).replace(/\n*\[\[REPORT_COMPLETE\]\][\s\S]*$/,'').trim();return{chapter_no:no,title:m[2].trim()||`第${no}章`,body}}).filter(x=>x.chapter_no&&x.body);
  }
  function merge(existing,incoming){const byNo=new Map(parseBlocks(existing).map(x=>[x.chapter_no,x]));for(const block of parseBlocks(incoming))byNo.set(block.chapter_no,block);return[...byNo.values()].sort((a,b)=>a.chapter_no-b.chapter_no)}
  function compose(blocks,expected,complete){const allowed=new Set(expected||[]);const body=(blocks||[]).filter(x=>!allowed.size||allowed.has(x.chapter_no)).sort((a,b)=>a.chapter_no-b.chapter_no).map(x=>`# 第${x.chapter_no}章｜${x.title}\n\n${x.body.trim()}`).join('\n\n');return complete?`${body}\n\n[[REPORT_COMPLETE]]`:body}
  function quality(existing,expected,minChars=1){const blocks=parseBlocks(existing),byNo=new Map(blocks.map(x=>[x.chapter_no,x])),missing=expected.filter(n=>!byNo.has(n)),short=expected.filter(n=>byNo.has(n)&&byNo.get(n).body.replace(/\s/g,'').length<minChars),hasReport=/^#{1,6}\s*.*连续性质检.*$/m.test(String(existing||''));return{blocks,missing,short,hasReport,ok:expected.length>0&&!missing.length&&!short.length&&hasReport}}
  function nextTarget(existing,expected,_hasMarker,minChars=1){const q=quality(existing,expected,minChars);return q.missing[0]||q.short[0]||(!q.hasReport?expected.at(-1):null)}
  function complete(existing,expected,minChars=1){return quality(existing,expected,minChars).ok}
  return{rangeFromText,parseBlocks,merge,compose,quality,nextTarget,complete};
});
