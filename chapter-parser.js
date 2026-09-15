// Browser-safe chapter parser (the filename intentionally avoids blocker rules matching "tools").
window.ChapterTools={
  extractChapterNo(...values){for(const value of values){const m=String(value||'').match(/第\s*(\d+)\s*章/);if(m)return Number(m[1])}return null},
  parseChapterBlocks(text){const s=String(text||'').replace(/\r\n?/g,'\n'),re=/^(?:#{1,6}\s*)?第\s*(\d+)\s*章(?:\s*[｜|：:\-—]\s*|\s+)?([^\n]*)$/gm,h=[...s.matchAll(re)];return h.map((m,i)=>({chapter_no:Number(m[1]),title:m[2].trim()||`第${m[1]}章`,body:s.slice(m.index+m[0].length,i+1<h.length?h[i+1].index:s.length).replace(/\n*\[\[REPORT_COMPLETE\]\][\s\S]*$/,'').trim()})).filter(x=>x.body)},
  nextVersion(rows,projectId,chapterNo){return Math.max(0,...(rows||[]).filter(x=>x.project_id===projectId&&Number(x.chapter_no)===Number(chapterNo)).map(x=>Number(x.version_no)||0))+1},
  validateBatch(blocks){const errors=[],seen=new Set();for(const b of blocks){if(seen.has(b.chapter_no))errors.push(`第${b.chapter_no}章重复`);seen.add(b.chapter_no);if(!b.body.trim())errors.push(`第${b.chapter_no}章正文为空`)}const n=[...seen].sort((a,b)=>a-b);for(let i=1;i<n.length;i++)if(n[i]!==n[i-1]+1)errors.push(`第${n[i-1]}章与第${n[i]}章之间不连续`);return{ok:!errors.length,errors,chapter_nos:n}}
};
