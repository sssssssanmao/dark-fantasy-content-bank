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
  function nextTarget(existing,expected,hasMarker){const blocks=parseBlocks(existing),present=new Set(blocks.map(x=>x.chapter_no));if(!hasMarker&&blocks.length){const last=blocks[blocks.length-1].chapter_no;if(expected.includes(last))return last}return expected.find(n=>!present.has(n))||null}
  function complete(existing,expected){const present=new Set(parseBlocks(existing).map(x=>x.chapter_no));return expected.length>0&&expected.every(n=>present.has(n))}
  return{rangeFromText,parseBlocks,merge,compose,nextTarget,complete};
});
