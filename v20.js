// v20：潜力 IP 日报归纳与灵感扩写成长篇快捷工作台。
(function(){
  const IP_SOP='潜力IP日报归纳 SOP';
  const NOVEL_SOP='灵感扩写成长篇 SOP';
  const esc=v=>safe(v||'');
  const splitTags=v=>String(v||'').split(/[,，]/).map(x=>x.trim()).filter(Boolean);

  // 复用数据库已允许的“市场风向扫描”类型，避免要求用户额外执行 SQL 迁移。
  const unsupportedIpOption=$('pipelineType').querySelector('option[value="潜力IP日报归纳"]');
  if(unsupportedIpOption)unsupportedIpOption.remove();
  ['市场研究','长篇创作'].forEach(category=>{
    if(!$('templateCategory').querySelector(`option[value="${category}"]`))$('templateCategory').insertAdjacentHTML('beforeend',`<option>${category}</option>`);
  });

  document.head.insertAdjacentHTML('beforeend',`<style>
    .quick-workflows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 14px}
    .quick-workflow{padding:15px;border:1px solid #343747;border-radius:11px;background:linear-gradient(135deg,#171a25,#11131a)}
    .quick-workflow h3{margin:4px 0}.quick-workflow p{min-height:42px;margin:5px 0 12px;color:var(--muted);font-size:12px}
    .quick-workflow .btn{width:100%}.wizard-note{padding:10px 12px;margin:5px 0 10px;border-left:3px solid #22d3ee;background:#0f172a;color:#cbd5e1;font-size:12px;line-height:1.65}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.next-batch{background:#0e7490!important;color:#fff!important;font-weight:700}
    @media(max-width:700px){.quick-workflows,.field-row{grid-template-columns:1fr}.quick-workflow p{min-height:0}}
  </style>`);

  document.body.insertAdjacentHTML('beforeend',`
  <div class="modal-wrap" id="ipDailyModal"><form class="modal" id="ipDailyForm">
    <div class="modal-head"><h2>潜力 IP 日报归纳</h2><button type="button" class="close" id="ipDailyClose">×</button></div>
    <div class="wizard-note">粘贴 Codex 生成的日报。系统会保留证据等级，拆分榜单、题材趋势、人设关系、风险和可复用模块；推测不会被冒充为正文事实。</div>
    <input class="field" id="ipDailyDate" type="date" required>
    <textarea class="field wide-field" id="ipDailyText" required placeholder="粘贴《潜力 IP 观察日报》全文"></textarea>
    <input class="field" id="ipDailyTags" value="潜力IP,番茄,七猫,市场趋势,日报" placeholder="标签，用逗号分隔">
    <button class="btn" type="submit">建立日报归纳任务</button><div class="error" id="ipDailyError"></div>
  </form></div>
  <div class="modal-wrap" id="novelWizardModal"><form class="modal" id="novelWizardForm">
    <div class="modal-head"><h2>灵感扩写成书</h2><button type="button" class="close" id="novelWizardClose">×</button></div>
    <div class="wizard-note">先建立项目，再按6章一批生成正文。每批完成后可点“继续下一批”，系统会沿用项目设定并进行连续性质检，避免整本一次输出被截断。</div>
    <input class="field" id="novelTitle" required placeholder="小说名称（暂定名也可以）">
    <textarea class="field" id="novelSeed" required placeholder="灵感关键词或几句概括"></textarea>
    <div class="field-row"><select class="field" id="novelGenre"><option>暗黑玄幻</option><option>悬疑志怪</option><option>规则怪谈</option><option>克苏鲁</option><option>无限流</option><option>都市异能</option><option>古言权谋</option><option>现代言情</option><option>自定义</option></select><select class="field" id="novelStyle"><option>强钩子快节奏</option><option>阴冷压抑悬疑</option><option>热血升级爽文</option><option>细腻情感拉扯</option><option>群像史诗</option><option>轻松反套路</option></select></div>
    <input class="field" id="novelGenreCustom" placeholder="自定义题材/风格补充（可选）">
    <textarea class="field" id="novelTheme" required placeholder="核心主题：作品最终要讨论什么"></textarea>
    <textarea class="field" id="novelCharacters" required placeholder="核心人物设定：身份、欲望、缺陷、能力与代价"></textarea>
    <textarea class="field" id="novelRelations" placeholder="关键人物关系与关系变化"></textarea>
    <textarea class="field" id="novelWorld" placeholder="世界观、规则、时代与必须遵守的限制"></textarea>
    <textarea class="field" id="novelOutline" placeholder="已知大纲、结局方向、必须出现的情节（没有可留空）"></textarea>
    <textarea class="field" id="novelAvoid" placeholder="禁止元素、雷点、不能改变的设定"></textarea>
    <div class="field-row"><input class="field" id="novelChapters" type="number" min="6" max="300" step="1" value="60" placeholder="预计总章数"><input class="field" id="novelWords" type="number" min="10000" step="10000" value="300000" placeholder="预计总字数"></div>
    <button class="btn" type="submit">创建项目与首批6章任务</button><div class="error" id="novelWizardError"></div>
  </form></div>`);

  const previousPipelineMarkup=pipelineMarkup;
  pipelineMarkup=function(){
    return previousPipelineMarkup()
      .replace('<div class="pipeline-help">',`<div class="quick-workflows"><div class="quick-workflow"><span class="eyebrow">MARKET INTELLIGENCE</span><h3>潜力 IP 日报归纳</h3><p>粘贴日报，自动归纳榜单、趋势、人物关系、风险与可复用模块。</p><button class="btn" id="quickIpDaily">开始归纳日报</button></div><div class="quick-workflow"><span class="eyebrow">NOVEL ENGINE</span><h3>灵感扩写成书</h3><p>从几句灵感建立项目，按6章一批生成正文并持续质检。</p><button class="btn" id="quickNovel">开始扩写小说</button></div></div><div class="pipeline-help">`)
      ;
  };

  function bindQuickWorkflows(){
    if($('quickIpDaily'))$('quickIpDaily').onclick=()=>{ $('ipDailyDate').value=new Date().toISOString().slice(0,10); $('ipDailyError').textContent=''; $('ipDailyModal').classList.add('open') };
    if($('quickNovel'))$('quickNovel').onclick=()=>{ $('novelWizardError').textContent=''; $('novelWizardModal').classList.add('open') };
  }
  const previousRenderPipelines=renderPipelines;
  renderPipelines=function(){ previousRenderPipelines(); bindQuickWorkflows(); addNextBatchButtons(); };
  $('ipDailyClose').onclick=()=>$('ipDailyModal').classList.remove('open');
  $('novelWizardClose').onclick=()=>$('novelWizardModal').classList.remove('open');

  function findSop(name){return templates.find(x=>x.name===name)||templates.find(x=>x.name.includes(name.replace(' SOP','')))}
  $('ipDailyForm').onsubmit=async e=>{
    e.preventDefault();$('ipDailyError').textContent='';
    const date=$('ipDailyDate').value,text=$('ipDailyText').value.trim(),tags=splitTags($('ipDailyTags').value),sop=findSop(IP_SOP);
    const input=`报告日期：${date}\n标签：${tags.join('、')}\n\n【原始日报】\n${text}\n\n【强制规范】\n1. 保留平台、榜单、名次、作品、作者、原生指标、采集日期与证据等级。\n2. 明确标注 L0榜单级、L1简介级、L2目录/试读级、L3正文级；推断必须写“推测”。\n3. 热度不得等同于在读人数；不可核验时写“暂无公开数据”，不得构造排名。\n4. 仅在存在同口径历史快照时比较趋势；历史不足不得声称周趋势。\n5. 输出标准化作品表、趋势与异常、潜力候选、内容风险、改编成本、可复用人物/关系/情节模块。\n6. 全文最后单独输出 [[REPORT_COMPLETE]]。`;
    const payload={name:`潜力IP日报归纳｜${date}`,pipeline_type:'市场风向扫描',project_id:null,sop_id:sop?.id||null,input_brief:input,output_draft:'',review_notes:'',status:'待执行',steps:makeSteps('市场风向扫描'),output_complete:false,quality_report:{workflow:'potential_ip_daily',source_date:date,tags}};
    const {error}=await db.from('pipeline_runs').insert(payload);if(error){$('ipDailyError').textContent=error.message;return}$('ipDailyModal').classList.remove('open');showAppNotice('日报归纳任务已建立，请点击“AI 自动执行”。');loadAll();
  };

  $('novelWizardForm').onsubmit=async e=>{
    e.preventDefault();$('novelWizardError').textContent='';
    const title=$('novelTitle').value.trim(),seed=$('novelSeed').value.trim(),genre=[$('novelGenre').value,$('novelGenreCustom').value.trim()].filter(Boolean).join(' × '),style=$('novelStyle').value,theme=$('novelTheme').value.trim(),characters=$('novelCharacters').value.trim(),relations=$('novelRelations').value.trim(),world=$('novelWorld').value.trim(),outline=$('novelOutline').value.trim(),avoid=$('novelAvoid').value.trim(),totalChapters=Number($('novelChapters').value)||60,totalWords=Number($('novelWords').value)||300000;
    const projectPayload={title,genre,status:'概念期',logline:`待AI依据灵感完善：${seed.slice(0,300)}`,mainline:`原始灵感：${seed}\n核心主题：${theme}\n预定风格：${style}\n预计${totalChapters}章／${totalWords}字`,worldview:world||'待AI生成后人工确认',core_conflict:`人物：${characters}\n关系：${relations||'待AI生成'}\n禁用项：${avoid||'无'}`};
    const {data:project,error:projectError}=await db.from('story_projects').insert(projectPayload).select('*').single();if(projectError){$('novelWizardError').textContent='项目创建失败：'+projectError.message;return}
    const sop=findSop(NOVEL_SOP),input=`【长篇创作任务】\n小说：${title}\n生成范围：第1—6章\n预计规模：${totalChapters}章／${totalWords}字\n题材：${genre}\n文风与节奏：${style}\n原始灵感：${seed}\n核心主题：${theme}\n核心人物：${characters}\n关键关系：${relations||'由AI提出候选并标记待确认'}\n世界观与硬规则：${world||'由AI提出候选并标记待确认'}\n大纲与结局方向：${outline||'先生成完整总纲，再据此写首批正文'}\n禁止元素：${avoid||'无'}\n\n先在内部锁定故事圣经、完整总纲、人物弧和伏笔账本，再输出第1—6章完整正文。每章必须有事件推进、情绪变化、信息增量与章尾钩子；不得用梗概代替正文。第6章后输出1—6章连续性质检。全文最后单独输出 [[REPORT_COMPLETE]]。`;
    const run={name:`${title}｜第1—6章正文`,pipeline_type:'故事开发',project_id:project.id,sop_id:sop?.id||null,input_brief:input,output_draft:'',review_notes:'',status:'待执行',steps:makeSteps('故事开发'),output_complete:false,quality_report:{novel_engine:true,total_chapters:totalChapters,total_words:totalWords,batch_size:6,genre,style}};
    const {error:runError}=await db.from('pipeline_runs').insert(run);if(runError){$('novelWizardError').textContent='项目已创建，但首批任务创建失败：'+runError.message;return}$('novelWizardModal').classList.remove('open');showAppNotice('小说项目和第1—6章任务已建立，请在审核设定后点击“AI 自动执行”。');loadAll();
  };

  function rangeOf(task){const m=(task.name+'\n'+task.input_brief).match(/第\s*(\d+)\s*[—–-]\s*(\d+)\s*章/);return m?[Number(m[1]),Number(m[2])]:null}
  window.createNextNovelBatch=async id=>{
    const source=pipelines.find(x=>x.id===id),range=rangeOf(source);if(!source||!range||!source.project_id)return;
    const size=range[1]-range[0]+1,start=range[1]+1,total=Number(source.quality_report?.total_chapters)||start+size-1;if(start>total){showAppNotice('已达到计划总章数。');return}const end=Math.min(total,start+size-1);
    if(pipelines.some(x=>x.project_id===source.project_id&&rangeOf(x)?.[0]===start)){showAppNotice(`第${start}—${end}章任务已经存在。`);return}
    const input=source.input_brief.replace(/生成范围：第\s*\d+\s*[—–-]\s*\d+\s*章/,`生成范围：第${start}—${end}章`).replace(/输出第\s*\d+\s*[—–-]\s*\d+\s*章完整正文/,`输出第${start}—${end}章完整正文`).replace(/第\s*\d+章后输出\d+[—–-]\d+章连续性质检/,`第${end}章后输出${start}—${end}章连续性质检`)+`\n\n续写要求：读取项目中已确认的前文版本，先核对人物状态、时间线、规则、伏笔与道具，再从第${start}章无缝续写。`;
    const payload={name:`${pipelineProjectName(source.project_id)}｜第${start}—${end}章正文`,pipeline_type:'故事开发',project_id:source.project_id,sop_id:source.sop_id||null,input_brief:input,output_draft:'',review_notes:'',status:'待执行',steps:makeSteps('故事开发'),output_complete:false,quality_report:{...(source.quality_report||{}),novel_engine:true,batch_start:start,batch_end:end}};
    const {error}=await db.from('pipeline_runs').insert(payload);if(error){showAppNotice('下一批任务创建失败：'+error.message,'error');return}showAppNotice(`已建立第${start}—${end}章任务。`);loadAll();
  };
  function addNextBatchButtons(){
    pipelines.filter(x=>x.pipeline_type==='故事开发'&&x.status==='已完成'&&x.quality_report?.novel_engine&&rangeOf(x)).forEach(task=>{
      const edit=document.querySelector(`#pipelineList button[onclick="editPipeline('${task.id}')"]`);if(!edit)return;const actions=edit.parentElement;if(actions.querySelector('.next-batch'))return;const range=rangeOf(task),total=Number(task.quality_report?.total_chapters)||0;if(total&&range[1]>=total)return;const b=document.createElement('button');b.className='next-batch';b.textContent='继续下一批';b.onclick=e=>{e.stopPropagation();createNextNovelBatch(task.id)};actions.insertBefore(b,edit);
    });
  }
})();
