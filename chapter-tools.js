(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ChapterTools=api;
  if(typeof window!=='undefined')window.ChapterTools=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this),function(){
  const cnDigits={'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
  function chineseNumber(raw){
    const s=String(raw||'').trim();
    if(/^\d+$/.test(s))return Number(s);
    if(s==='十')return 10;
    if(s.includes('十')){
      const [a,b]=s.split('十');
      return (a?cnDigits[a]||0:1)*10+(b?cnDigits[b]||0:0);
    }
    return [...s].reduce((n,c)=>n*10+(cnDigits[c]??0),0);
  }
  function extractChapterNo(){
    for(const value of arguments){
      const m=String(value||'').match(/第\s*([0-9零〇一二两三四五六七八九十百]+)\s*章/);
      if(m){const n=chineseNumber(m[1]);if(n>0)return n;}
    }
    return null;
  }
  function cleanTitle(raw,no){
    return String(raw||'').replace(/^\s*[#>*-]*\s*/,'').replace(new RegExp(`^第\\s*(?:${no}|[零〇一二两三四五六七八九十百]+)\\s*章\\s*[｜|：:\-—]*\\s*`),'').trim()||`第${no}章`;
  }
  function parseChapterBlocks(text){
    const source=String(text||'').replace(/\r\n?/g,'\n');
    const re=/^(?:#{1,6}\s*)?第\s*([0-9零〇一二两三四五六七八九十百]+)\s*章(?:\s*[｜|：:\-—]\s*|\s+)?([^\n]*)$/gm;
    const hits=[...source.matchAll(re)];
    if(!hits.length)return [];
    return hits.map((m,i)=>{
      const no=chineseNumber(m[1]);
      const end=i+1<hits.length?hits[i+1].index:source.length;
      let body=source.slice(m.index+m[0].length,end).trim();
      body=body.replace(/\n*\[\[REPORT_COMPLETE\]\][\s\S]*$/,'').trim();
      return{chapter_no:no,title:cleanTitle(m[2],no),body,header:m[0].trim()};
    }).filter(x=>x.chapter_no>0&&x.body);
  }
  function nextVersion(rows,projectId,chapterNo){
    return Math.max(0,...(rows||[]).filter(x=>x.project_id===projectId&&Number(x.chapter_no)===Number(chapterNo)).map(x=>Number(x.version_no)||0))+1;
  }
  function validateBatch(blocks){
    const errors=[],seen=new Set();
    for(const b of blocks){
      if(seen.has(b.chapter_no))errors.push(`第${b.chapter_no}章重复`);
      seen.add(b.chapter_no);
      if(!b.body.trim())errors.push(`第${b.chapter_no}章正文为空`);
    }
    const sorted=[...seen].sort((a,b)=>a-b);
    for(let i=1;i<sorted.length;i++)if(sorted[i]!==sorted[i-1]+1)errors.push(`第${sorted[i-1]}章与第${sorted[i]}章之间不连续`);
    return{ok:errors.length===0,errors,chapter_nos:sorted};
  }
  return{chineseNumber,extractChapterNo,parseChapterBlocks,nextVersion,validateBatch};
});
