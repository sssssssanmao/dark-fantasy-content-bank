// v18：章节正文、版本管理与连续章节批量入库。
if(!window.ChapterTools){
  window.ChapterTools={
    extractChapterNo(...values){for(const value of values){const m=String(value||'').match(/第\s*(\d+)\s*章/);if(m)return Number(m[1])}return null},
    parseChapterBlocks(text){const s=String(text||'').replace(/\r\n?/g,'\n'),re=/^(?:#{1,6}\s*)?第\s*(\d+)\s*章(?:\s*[｜|：:\-—]\s*|\s+)?([^\n]*)$/gm,h=[...s.matchAll(re)];return h.map((m,i)=>({chapter_no:Number(m[1]),title:m[2].trim()||`第${m[1]}章`,body:s.slice(m.index+m[0].length,i+1<h.length?h[i+1].index:s.length).replace(/\n*\[\[REPORT_COMPLETE\]\][\s\S]*$/,'').trim()})).filter(x=>x.body)},
    nextVersion(rows,projectId,chapterNo){return Math.max(0,...(rows||[]).filter(x=>x.project_id===projectId&&Number(x.chapter_no)===Number(chapterNo)).map(x=>Number(x.version_no)||0))+1},
    validateBatch(blocks){const errors=[],seen=new Set();for(const b of blocks){if(seen.has(b.chapter_no))errors.push(`第${b.chapter_no}章重复`);seen.add(b.chapter_no);if(!b.body.trim())errors.push(`第${b.chapter_no}章正文为空`)}const n=[...seen].sort((a,b)=>a-b);for(let i=1;i<n.length;i++)if(n[i]!==n[i-1]+1)errors.push(`第${n[i-1]}章与第${n[i]}章之间不连续`);return{ok:!errors.length,errors,chapter_nos:n}}
  };
}
let chapterContents=[],chapterContentsAvailable=true,chapterContentEditing=null;
document.head.insertAdjacentHTML('beforeend',`<style>
.chapter-content-card{padding:14px 0;border-top:1px solid #242735}.chapter-content-card h3{margin:4px 0}.chapter-content-meta{color:#a78bfa;font-size:12px}.chapter-preview{white-space:pre-wrap;max-height:110px;overflow:hidden;color:var(--muted);font-size:12px}.setup-warn{padding:12px;border:1px solid #92400e;border-radius:8px;background:#451a031f;color:#fbbf24}.batch-note{padding:10px;border-radius:8px;background:#111827;color:#c4b5fd;font-size:12px;margin:8px 0}.quick-six{margin:0 0 8px;background:#0e7490!important}
</style>`);

document.body.insertAdjacentHTML('beforeend',`<div class="modal-wrap" id="chapterContentModal"><form class="modal" id="chapterContentForm"><div class="modal-head"><h2 id="chapterContentFormTitle">编辑章节正文</h2><button type="button" class="close" id="chapterContentClose">×</button></div><input class="field" id="chapterContentNo" type="number" min="1" required placeholder="章节序号"><input class="field" id="chapterContentTitle" required placeholder="章节标题"><textarea class="field wide-field" id="chapterContentBody" required placeholder="章节正文"></textarea><textarea class="field" id="chapterContentContinuity" placeholder="连续性检查或本章交接摘要"></textarea><select class="field" id="chapterContentStatus"><option>草稿</option><option>待审核</option><option>已确认</option></select><button class="btn" type="submit">保存为当前版本</button><div class="error" id="chapterContentError"></div></form></div>`);

$('conversionType').insertAdjacentHTML('beforeend','<option>章节正文</option>');
$('chapterConvertFields').insertAdjacentHTML('afterend',`<div class="convert-fields" id="chapterContentConvertFields"><select class="field" id="contentConversionProject"></select><input class="field" id="contentConversionChapterNo" type="number" min="1" placeholder="单章章节序号"><input class="field" id="contentConversionTitle" placeholder="单章章节标题"><textarea class="field wide-field" id="contentConversionBody" placeholder="章节正文；如含“第1章…第6章”标题，将自动拆成6条"></textarea><textarea class="field" id="contentConversionContinuity" placeholder="六章连续性质检或单章交接摘要（可选）"></textarea><div class="batch-note" id="contentConversionHint">系统会自动识别章节号；同一章节再次入库会保存为新版本，不会覆盖旧稿。</div></div>`);

const v18ConversionTypeView=conversionTypeView;
conversionTypeView=function(){
  v18ConversionTypeView();
  const on=$('conversionType').value==='章节正文';
  $('chapterContentConvertFields').classList.toggle('on',on);
  if(on){$('assetConvertFields').classList.remove('on');$('chapterConvertFields').classList.remove('on');$('sopConvertFields').classList.remove('on')}
};
$('conversionType').onchange=conversionTypeView;

const v18OpenConversion=openConversion;
openConversion=function(id){
  v18OpenConversion(id);
  const task=pipelines.find(x=>x.id===id);if(!task)return;
  const detected=ChapterTools.extractChapterNo(task.name,task.input_brief,task.output_draft)||1;
  const blocks=ChapterTools.parseChapterBlocks(task.output_draft);
  if(task.pipeline_type==='故事开发')$('conversionType').value='章节正文';
  $('contentConversionProject').innerHTML='<option value="">请选择故事项目</option>'+projects.map(p=>`<option value="${p.id}">${safe(p.title)}</option>`).join('');
  $('contentConversionProject').value=task.project_id||'';
  $('contentConversionChapterNo').value=detected;
  $('contentConversionTitle').value=blocks.length===1?blocks[0].title:task.name.replace(/测试|正文试写/g,'').trim();
  $('contentConversionBody').value=task.output_draft;
  $('contentConversionContinuity').value=sectionOf(task.output_draft,'连续性质检')||sectionOf(task.output_draft,'连续性检查');
  $('contentConversionHint').textContent=blocks.length>1?`已识别 ${blocks.length} 章（${blocks.map(x=>'第'+x.chapter_no+'章').join('、')}），确认后将分别入库。`:`已识别为第 ${detected} 章；若已存在，将自动保存为下一版本。`;
  conversionTypeView();
};
window.convertPipeline=openConversion;

const v18ConversionSubmit=$('conversionForm').onsubmit;
$('conversionForm').onsubmit=async function(e){
  if($('conversionType').value!=='章节正文')return v18ConversionSubmit.call(this,e);
  e.preventDefault();
  if(!chapterContentsAvailable){$('conversionError').textContent='章节正文数据表尚未启用，请先执行 v18 数据库升级脚本。';return}
  const projectId=$('contentConversionProject').value,raw=$('contentConversionBody').value.trim();
  if(!projectId||!raw){$('conversionError').textContent='请选择故事项目并填写章节正文。';return}
  let blocks=ChapterTools.parseChapterBlocks(raw);
  if(!blocks.length)blocks=[{chapter_no:Number($('contentConversionChapterNo').value),title:$('contentConversionTitle').value.trim(),body:raw}];
  const validation=ChapterTools.validateBatch(blocks);
  if(!validation.ok){$('conversionError').textContent='无法入库：'+validation.errors.join('；');return}
  const task=pipelines.find(x=>x.id===conversionPipelineId),continuity=$('contentConversionContinuity').value.trim();
  const payloads=blocks.map(b=>({project_id:projectId,chapter_no:b.chapter_no,title:b.title||`第${b.chapter_no}章`,body:b.body,version_no:ChapterTools.nextVersion(chapterContents,projectId,b.chapter_no),status:'待审核',continuity_notes:continuity,source_pipeline_id:conversionPipelineId}));
  const {data,error}=await db.from('chapter_contents').insert(payloads).select('id,title,chapter_no,version_no');
  if(error){$('conversionError').textContent=error.message;return}
  const logs=(data||[]).map(x=>({pipeline_id:conversionPipelineId,target_type:'章节正文',target_id:x.id,target_title:`第${x.chapter_no}章 ${x.title} v${x.version_no}`}));
  if(logs.length){const lr=await db.from('pipeline_conversions').insert(logs);if(lr.error){$('conversionError').textContent='正文已入库，但来源记录失败：'+lr.error.message;return}}
  await db.from('pipeline_runs').update({status:'已完成'}).eq('id',conversionPipelineId);
  $('conversionModal').classList.remove('open');alert(`已将 ${payloads.length} 章正文分别入库；旧版本均已保留。`);loadAll();
};

const v18LoadAll=loadAll;
loadAll=async function(){
  await v18LoadAll();
  const r=await db.from('chapter_contents').select('*').order('chapter_no',{ascending:true}).order('version_no',{ascending:false});
  if(r.error){chapterContents=[];chapterContentsAvailable=false}else{chapterContents=r.data||[];chapterContentsAvailable=true}
  renderCurrent();
};

const v18RenderProjects=renderProjects;
renderProjects=function(){
  v18RenderProjects();
  const section=$('chapterList')?.closest('section');if(!section)return;
  let panel=$('chapterContentPanel');
  if(!panel){section.insertAdjacentHTML('beforeend','<article class="panel" id="chapterContentPanel" style="margin-top:14px"><div class="story-toolbar"><div><span class="eyebrow">CHAPTER CONTENT</span><h2 id="chapterContentPanelTitle">章节正文与版本</h2></div></div><div id="chapterContentList"></div></article>');panel=$('chapterContentPanel')}
  const project=projects.find(x=>x.id===selectedProjectId);
  $('chapterContentPanelTitle').textContent=project?`《${project.title}》章节正文与版本`:'章节正文与版本';
  if(!chapterContentsAvailable){$('chapterContentList').innerHTML='<div class="setup-warn">章节正文功能等待数据库升级；完成一次 SQL 升级后即可使用。</div>';return}
  if(!project){$('chapterContentList').innerHTML='<div class="empty">选择一个故事项目后查看章节正文。</div>';return}
  const rows=chapterContents.filter(x=>x.project_id===project.id);
  $('chapterContentList').innerHTML=rows.length?rows.map(x=>`<div class="chapter-content-card"><div class="chapter-content-meta">第 ${x.chapter_no} 章 · v${x.version_no} · ${safe(x.status)}</div><h3>${safe(x.title)}</h3><div class="chapter-preview">${safe(x.body)}</div><div class="row-actions"><button onclick="editChapterContent('${x.id}')">查看/编辑</button><button onclick="removeChapterContent('${x.id}')">删除此版本</button></div></div>`).join(''):'<div class="empty">暂无章节正文。流水线完成后点击“转为内容资产 → 章节正文”。</div>';
};

function openChapterContent(x){chapterContentEditing=x.id;$('chapterContentFormTitle').textContent=`编辑第${x.chapter_no}章 · v${x.version_no}`;$('chapterContentNo').value=x.chapter_no;$('chapterContentTitle').value=x.title;$('chapterContentBody').value=x.body;$('chapterContentContinuity').value=x.continuity_notes||'';$('chapterContentStatus').value=x.status;$('chapterContentError').textContent='';$('chapterContentModal').classList.add('open')}
window.editChapterContent=id=>openChapterContent(chapterContents.find(x=>x.id===id));
window.removeChapterContent=async id=>{if(!confirm('只删除这个正文版本，其他版本仍会保留。确定继续吗？'))return;const {error}=await db.from('chapter_contents').delete().eq('id',id);error?alert(error.message):loadAll()};
$('chapterContentClose').onclick=()=>$('chapterContentModal').classList.remove('open');
$('chapterContentForm').onsubmit=async e=>{e.preventDefault();const {error}=await db.from('chapter_contents').update({chapter_no:Number($('chapterContentNo').value),title:$('chapterContentTitle').value.trim(),body:$('chapterContentBody').value.trim(),continuity_notes:$('chapterContentContinuity').value.trim(),status:$('chapterContentStatus').value}).eq('id',chapterContentEditing);if(error)$('chapterContentError').textContent=error.message;else{$('chapterContentModal').classList.remove('open');loadAll()}};

const v18OpenPipeline=openPipeline;
openPipeline=function(x={}){
  v18OpenPipeline(x);
  if(!$('quickSix'))$('pipelineInput').insertAdjacentHTML('beforebegin','<button type="button" class="btn quick-six" id="quickSix">套用“连续6章正文”任务</button>');
  $('quickSix').onclick=()=>{
    $('pipelineType').value='故事开发';
    if(!$('pipelineName').value.trim())$('pipelineName').value='连续6章正文创作';
    $('pipelineInput').value=`请基于所选故事项目、已确认资产和第1—6章章节卡，连续生成第1—6章小说正文。\n\n硬性格式：每章必须以“# 第N章｜章节标题”单独起行；每章正文完整，不得用梗概代替；六章后另起“## 六章连续性质检”，检查人物、规则、时间线、伏笔、道具和章间衔接；全文最后单独一行输出 [[REPORT_COMPLETE]]。\n\n若一次输出长度不足，必须优先保证章节完整，不得在句中截断。`;
  };
};

const v18ExportBackup=exportBackup;
exportBackup=function(){
  const original=chapterContents;
  let payload={format:'dark-fantasy-content-bank',version:'1.8',exported_at:new Date().toISOString(),data:{ideas,assets,characters,relationships,story_projects:projects,chapter_cards:chapters,chapter_contents:original,sop_templates:templates,pipeline_runs:pipelines,pipeline_conversions:conversions}},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`工作资料库_备份_${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
};
