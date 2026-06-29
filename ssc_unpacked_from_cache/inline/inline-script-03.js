/* extracted from index.html | inline script #3 | attrs: (none) */
(function(){
if(typeof Vue==='undefined'||typeof TDesign==='undefined'){
  document.body.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;font-family:-apple-system,sans-serif;color:#5b6470;gap:14px"><div style="font-size:15px;color:#e34d59;font-weight:600">页面资源加载失败 · Resources failed to load</div><div style="font-size:13px">可能是网络瞬时波动，请重新加载页面。</div><button onclick="location.reload(true)" style="margin-top:6px;background:#0052d9;color:#fff;border:none;border-radius:8px;padding:9px 22px;font-size:13px;cursor:pointer">重新加载 · Reload</button></div>';
  return;
}

const { createApp, ref, reactive, computed, watch, onMounted } = Vue;
const { MessagePlugin } = TDesign;

// ===== DATA =====
const panels = ref([
  {id:1,label:'Function PM 作战室',labelEn:'Function PM Workspace',status:'ok'}, {id:2,label:'OPS Hub 运营中心',labelEn:'OPS Hub Operations',status:'warn'},
  {id:3,label:'Chatbot 98008',labelEn:'Chatbot Operations',status:'ok'}, {id:4,label:'AI 工具广场',labelEn:'AI Tool Plaza',status:'ok'}, {id:5,label:'知识库',labelEn:'Knowledge Base',status:'ok'},
  {id:6,label:'Multi-Agent',labelEn:'Multi-Agent',status:'ok'}, {id:7,label:'会议中枢',labelEn:'Meeting Hub',status:'ok'}, {id:8,label:'系统需求全景',labelEn:'System Demand Map',status:'ok'},
  {id:9,label:'自由主题共享论坛',labelEn:'Open Topic Forum',status:'ok'}, {id:10,label:'工作项分配',labelEn:'Work Assignment',status:'ok'},
]);
let nextPanelId = 11;

function getPanelById(id){ return panels.value.find(function(p){return String(p.id)===String(id);}); }
function panelName(p){ return p.label; }
function panelNameEn(p){ return p.labelEn || 'Custom Panel'; }
function viewIdForPanel(p){ if(p.id===1)return'p2';if(p.id===3)return'p4';if(p.id===4)return'aitools';if(p.id===7)return'meeting-hub';if(p.id===9)return'p10';if(p.id===10)return'assign';return'dashboard'; }

const p2Ownership = [
  {num:'1.1',title:{zh:'政策落地'},owner:'danniewu',status:{zh:'进行中'}},
  {num:'1.2',title:{zh:'运营升级'},owner:'vvvliu',status:{zh:'进行中'}},
  {num:'1.3',title:{zh:'事项看板'},owner:'jiachunngu',status:{zh:'已接入'}},
  {num:'1.4',title:{zh:'类型矩阵'},owner:'tobyliao',status:{zh:'待补全'},warn:true},
  {num:'1.6',title:{zh:'会议跟进'},owner:'danniewu',status:{zh:'已接入'}},
  {num:'1.7',title:{zh:'系统需求'},owner:'vvvliu',status:{zh:'进行中'}}
];

// 用户名单：从服务器拉取（准入唯一真相源）。首屏先给默认值避免空白，loadUsers() 覆盖。
// 测试阶段全员 System Admin，保证都能看到完整内容。
const users = ref([
  {name:'qianjunshan',role:'System Admin',domain:'PMO · 全部'},
  {name:'danniewu',role:'System Admin',domain:'P2 · Function PM'},
  {name:'vvvliu',role:'System Admin',domain:'P2 · Function PM'},
  {name:'jiachunngu',role:'System Admin',domain:'P2 · Function PM'},
  {name:'tobyliao',role:'System Admin',domain:'P2 · Function PM'},
  {name:'oscarwei',role:'System Admin',domain:'PMO · 全部'},
  {name:'annawzhang',role:'System Admin',domain:'P2 · Function PM'},
  {name:'melodyxuxu',role:'System Admin',domain:'P2 · Function PM'},
  {name:'rrayzhao',role:'System Admin',domain:'P2 · Function PM'}
]);

const logs = ref([
  {time:'2026-06-18 14:20',user:'qianjunshan',type:'权限变更',panel:'全局',detail:'修改 oscarwei 权限：P3 OPS Hub → 只读'},
  {time:'2026-06-18 11:05',user:'danniewu',type:'内容编辑',panel:'P2 · 薪酬',detail:'更新薪酬政策落地追踪表'},
  {time:'2026-06-18 09:30',user:'qianjunshan',type:'权限变更',panel:'全局',detail:'通过权限申请：rrayzhao → P2 绩效 只读'},
  {time:'2026-06-17 17:15',user:'vvvliu',type:'配置修改',panel:'P2 · 入职',detail:'修改入职流程 SOP 刷新频率'},
  {time:'2026-06-17 16:40',user:'jiachunngu',type:'内容编辑',panel:'P2 · 异动',detail:'提交异动系统需求 PRD v1.2'},
  {time:'2026-06-17 14:10',user:'qianjunshan',type:'登录',panel:'全局',detail:'登录系统 (System Admin)'},
  {time:'2026-06-17 13:25',user:'tobyliao',type:'权限变更',panel:'P2 · 绩效',detail:'添加实习生 rrayzhao 到绩效板块'},
  {time:'2026-06-17 10:00',user:'qianjunshan',type:'权限变更',panel:'全局',detail:'拒绝权限申请：外部顾问 liwei → P3 只读'},
]);

const approvals = ref([
  {id:1,applicant:'annawzhang',panelId:1,panel:'P1 · Function PM 作战室',level:'view',reason:'需要查看入职政策落地数据',time:'2 hours ago',status:'pending'},
  {id:2,applicant:'melodyxuxu',panelId:2,panel:'P2 · OPS Hub',level:'operate',reason:'需要跟进 CA Hub 运营数据任务',time:'yesterday',status:'pending'},
]);

const myRequests = ref([
  {id:101,applicant:'oscarwei',panelId:2,panel:'P2 · OPS Hub',level:'仅浏览 / View Only',reason:'需要查看运营数据做报告',time:'3 days ago',status:'approved'},
  {id:102,applicant:'oscarwei',panelId:4,panel:'P4 · AI 工具广场',level:'操作+编辑 / Manage',reason:'需要配置 AI 分析模板',time:'1 week ago',status:'approved'},
]);

// Permission state
let permState = {};
function initPermState(){
  users.value.forEach(function(u,i){
    var s={};
    panels.value.forEach(function(p){
      if(u.role==='System Admin')s[p.id]='manage';
      else if(u.role==='Operator'){ s[p.id]=(p.id===1||p.id===7)?'manage':(p.id===3?'operate':'off'); }
      else if(u.domain.indexOf('Mentor:')!==-1){ s[p.id]=(p.id===1||p.id===3||p.id===7)?'view':'off'; }
      else s[p.id]='off';
    });
    permState[i]=s;
  });
}
initPermState();

let pendingPerms = {};
let matrixHasChanges = ref(false);
let matrixTab = ref('formal');

function getPermValue(ui,pi){
  if(pendingPerms[ui]&&pendingPerms[ui].hasOwnProperty(String(pi)))return pendingPerms[ui][pi];
  return permState[ui][pi];
}
function setPerm(ui,pi,level){
  var u=users.value[ui];
  if(!u||u.role==='System Admin')return;
  if(currentRole.value!=='admin'&&u.role!=='User')return;
  if(!pendingPerms[ui])pendingPerms[ui]={};
  pendingPerms[ui][pi]=level;
  matrixHasChanges.value=true;
}
function permissionLabel(level){
  return ({off:'无权限 / No Access',view:'仅浏览 / View Only',operate:'可操作 / Operate Only',manage:'操作+编辑 / Manage'})[level]||level;
}
function saveMatrixChanges(){
  if(!matrixHasChanges.value)return;
  if(!confirm('确认保存所有权限变更？ / Save all permission changes?'))return;
  var op=currentRole.value==='admin'?'qianjunshan':'danniewu';
  for(var ui in pendingPerms){
    var u=users.value[parseInt(ui)];
    for(var pi in pendingPerms[ui]){
      var old=permState[parseInt(ui)][pi],nw=pendingPerms[ui][pi];
      if(old!==nw){
        permState[parseInt(ui)][pi]=nw;
        logs.value.unshift({time:'刚刚',user:op,type:'权限变更',panel:'P'+pi,detail:'修改 '+u.name+' 权限：'+permissionLabel(old)+' → '+permissionLabel(nw)});
      }
    }
  }
  pendingPerms={};matrixHasChanges.value=false;
  MessagePlugin.success('变更已保存 / Saved');
}
function cancelMatrixChanges(){ pendingPerms={};matrixHasChanges.value=false; }

// AI Summary（真实模型生成 + 打字动画）
let aiSummaryHTML = ref('');
let aiTimer = null;
let aiRefreshing = ref(false);
function escapeHTML(s){return String(s).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}

// 汇总当前平台真实运行状态，喂给 LLM（保证它说的是真数据，不臆造）
function buildAIInsightContext(){
  var total=panels.value.length;
  var ok=panels.value.filter(function(p){return p.status==='ok';}).length;
  var warn=panels.value.filter(function(p){return p.status==='warn';}).length;
  var pending=approvals.value.filter(function(a){return a.status==='pending';}).length;
  var totalDecks=(sharedPpts.value?sharedPpts.value.length:0)+(myPpts.value?myPpts.value.length:0);
  var sharedDecks=sharedPpts.value?sharedPpts.value.length:0;
  var myDecks=myPpts.value?myPpts.value.length:0;
  var forumShares=(shareList.value||[]).length;
  var forumComments=(shareList.value||[]).reduce(function(m,s){return m+((s.comments&&s.comments.length)||0);},0);
  var inboxPpt=inboxPptShares.value?inboxPptShares.value.length:0;
  var inboxFor=inboxForumShares.value?inboxForumShares.value.length:0;
  var openA=openAssignmentCount.value, dueA=dueSoonAssignmentCount.value, doneA=doneAssignmentCount.value;
  // P3 Chatbot 98008 真实数据
  var fbCount = p4Feedbacks.value.length;
  var avgSat = metricsAvgSat.value;
  var avgAcc = metricsAvgAccuracy.value;
  var avgSpd = metricsAvgSpeed.value;
  var solvedPct = metricsSolvedRate.value;
  var npsVal = metricsNPS.value;
  var lowScoreN = metricsLowScoreList.value.length;
  var moduleStats = metricsModuleStats.value.slice(0,5).map(function(m){return m.name+':'+m.count;});
  var syncSource = feedbackSyncSource.value || 'none';
  var weekNew = metricsThisWeek.value;
  return {
    panels:{total:total,ok:ok,warn:warn},
    access:{accounts:users.value.length,pending:pending},
    p3_chatbot:{
      feedbackCount:fbCount, thisWeekNew:weekNew,
      avgSatisfaction:avgSat, avgAccuracy:avgAcc, avgSpeed:avgSpd,
      solvedRate:solvedPct, nps:npsVal,
      lowScoreFeedbacks:lowScoreN,
      topModules:moduleStats,
      dataSource:syncSource
    },
    p4_aitools:{totalDecks:totalDecks,shared:sharedDecks,mine:myDecks,inbox:inboxPpt},
    p9_forum:{shares:forumShares,comments:forumComments,inbox:inboxFor},
    p10_assignments:{open:openA,due48h:dueA,done:doneA,assignees:SHARE_PEOPLE.length},
    me: realStaff.value ? realStaff.value.staffName : currentUserName.value,
    timestamp: new Date().toLocaleString('zh-CN')
  };
}

// 打字动画：把 lines 数组逐字符渲染到 aiSummaryHTML
function typeAILines(lines){
  if(aiTimer) clearTimeout(aiTimer);
  var typed=lines.map(function(){return '';});
  var line=0,pos=0;
  function render(){aiSummaryHTML.value=typed.map(function(s,i){return '<div class="ai-line '+(i===line?'active':'')+'">'+escapeHTML(s)+'</div>';}).join('');}
  function type(){
    if(line>=lines.length){render();return;}
    typed[line]=lines[line].slice(0,pos+1);
    render();
    pos++;
    if(pos>=lines[line].length){line++;pos=0;aiTimer=setTimeout(type,240);return;}
    aiTimer=setTimeout(type,16);
  }
  type();
}

// 兜底：模型失败时仍能显示有用信息（基于真实数据，自然段落式）
function fallbackAILines(ctx){
  var p3 = ctx.p3_chatbot || {};
  var lines = [];
  lines.push('当前平台 '+ctx.panels.ok+'/'+ctx.panels.total+' 个板块运行正常'+(ctx.panels.warn>0?'，其中 '+ctx.panels.warn+' 个板块存在数据延迟需关注':'，整体状态健康')+'。');
  if(p3.feedbackCount>0){
    lines.push('98008 Chatbot 方面，目前已累计收到 '+p3.feedbackCount+' 条反馈'+(p3.thisWeekNew>0?'（本周新增 '+p3.thisWeekNew+' 条）':'')+
      '，平均满意度 '+p3.avgSatisfaction+'/5，解决率 '+p3.solvedRate+'%，NPS '+p3.nps+'。'+
      (p3.lowScoreFeedbacks>0?'需注意有 '+p3.lowScoreFeedbacks+' 条低分反馈待跟进。':'用户反馈整体良好。'));
  }
  lines.push('AI 工具广场共生成 '+ctx.p4_aitools.totalDecks+' 份文稿'+(ctx.p4_aitools.inbox>0?'，你有 '+ctx.p4_aitools.inbox+' 份待查看':'')+
    '；论坛 '+ctx.p9_forum.shares+' 条分享、'+ctx.p9_forum.comments+' 条评论'+(ctx.p9_forum.inbox>0?'，'+ctx.p9_forum.inbox+' 条 @你未读':'')+
    '；工作项 '+ctx.p10_assignments.open+' 项进行中'+(ctx.p10_assignments.due48h>0?'，其中 '+ctx.p10_assignments.due48h+' 项 48 小时内到期':'')+'。');
  return lines;
}

async function refreshAI(){
  if(aiRefreshing.value) return;
  aiRefreshing.value = true;
  aiSummaryHTML.value = '';
  var ctx = buildAIInsightContext();
  // 先用 fallback 立即开打（保证 ai-body 不空）
  var localLines = fallbackAILines(ctx);
  typeAILines(localLines);
  // 同时异步调真实模型，拿到结果再覆盖打字动画
  try{
    var sysPrompt = '你是 SSC 全局指挥台的 AI 助理。基于下面的"真实平台运行状态"JSON，写一段简洁、连贯的运营洞察（3-5 句话，自然段落）。禁止使用任何问候语（如"各位好""早上好""大家好"）、禁止标题、禁止 bullet point、禁止序号、禁止 markdown。要求：①只用 JSON 里给出的真实数字，禁止编造任何数据；②语气务实、像一位资深运营经理在早会上用 30 秒做口头简报——直接说事，不要寒暄；③重点关注 98008 Chatbot 的反馈质量（满意度、NPS、低分数、解决率），如有异常要点出；④其他板块简要带过即可；⑤如果有"需要注意"的事项（低分反馈、48h 到期工作项、待审批、@我未读等），要自然融入语境提醒；⑥中文输出，可穿插关键英文术语；⑦直接输出段落文字，不加任何格式；⑧第一句话必须以数据事实开头，不能用问候语开头。';
    var resp = await fetch('https://ntsgw.woa.com/api/sso/llm-proxy-service/api/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        model:'HY-3-Preview',
        messages:[
          {role:'system', content:sysPrompt},
          {role:'user', content:'当前平台状态（JSON）：\n'+JSON.stringify(ctx,null,2)+'\n\n请用一段话（3-5 句）做运营简报。'}
        ],
        temperature:0.4,
        max_tokens:600
      })
    });
    if(!resp.ok){ throw new Error('HTTP '+resp.status); }
    var data = await resp.json();
    var content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    // 切成行：保留非空、去掉 markdown 列表符号
    // 模型返回的是一段话，合并成一个段落
    var text = content.replace(/^\s*[\d\-\*•·]+[\.\)\s]+/gm,'').replace(/\n+/g,' ').trim();
    // 校验：过滤掉模型的"开场白垃圾"——问候语、标题、空话
    var fluffCheck = text.replace(/^[各位大家好早安午安晚早上好下好,，!！\s]+/,'').trim();
    if(fluffCheck.length>=30 && !/^(各位|大家|早安|午安|晚上好|Welcome|Hello|Hi\b)/i.test(fluffCheck.substring(0,8))){
      typeAILines([fluffCheck]);
    }
    // 否则保留 fallback 内容
  }catch(e){
    // 模型调用失败 → 保留 fallback 打字内容，不再重打
  }finally{
    aiRefreshing.value = false;
  }
}

// KPI
let kpiActiveId = ref(-1);
let kpiDetailTitle = ref('');
let kpiChartHTML = ref('');
const kpiChartData = [
  {values:[98,105,118,120,135,142,147,152],max:170,unit:'项'},
  {values:[12,14,13,11,9,10,8,7],max:18,unit:'项'},
  {values:[87.2,88.5,89.5,91.2,91.8,93.0,93.5,94.3],max:100,unit:'%'},
  {values:[3,4,4,4,5,5,5,6],max:10,unit:'次'},
];
const kpiDetailTitles = ['本周需求总量 · Weekly Requests Detail','超期/阻塞 · Overdue / Blocked Detail','SLA 达标率 · SLA Detail','跨板块协同 · Cross-panel Sync Detail'];

function toggleKPIDetail(id){
  if(kpiActiveId.value===id){kpiActiveId.value=-1;return;}
  kpiActiveId.value=id;
  var weeks=['W19','W20','W21','W22','W23','W24','W25','W26'];
  var data=kpiChartData[id];
  kpiDetailTitle.value=kpiDetailTitles[id];
  kpiChartHTML.value=data.values.map(function(v,i){
    var h=(v/data.max*100).toFixed(0),isLast=i===data.values.length-1;
    return '<div class="kpi-bar-col"><div class="kpi-bar-val">'+v+data.unit+'</div><div class="kpi-bar '+(isLast?'kpi-bar-cur':'')+'" style="height:'+h+'%"></div><div class="kpi-bar-label">'+weeks[i]+'</div></div>';
  }).join('');
}

// Panel status
function togglePanelDetail(id){ var wasOpen=openPanelIds[id]; for(var k in openPanelIds){delete openPanelIds[k];} if(!wasOpen){openPanelIds[id]=true;activePanel.value=id;}else{activePanel.value=0;} }
function statusColor(s){return s==='ok'?'#00a870':s==='warn'?'#e37318':'#e34d59';}
function statusText(s){return s==='ok'?'正常 / Normal':s==='warn'?'预警 / Warning':'异常 / Error';}
function panelCardMetrics(p){
  // 每个板块卡片里的 4 个小数字 — 从 panelDetailHTML 里提取关键指标
  if(p.id===1) return '<div class="pc-dot-item"><div class="val">23</div><div class="lbl">活跃事项</div></div><div class="pc-dot-item"><div class="val">5</div><div class="lbl">待处理</div></div><div class="pc-dot-item"><div class="val">4</div><div class="lbl">本周会议</div></div><div class="pc-dot-item"><div class="val">8</div><div class="lbl">系统需求</div></div>';
  if(p.id===2) return '<div class="pc-dot-item"><div class="val">'+users.value.length+'</div><div class="lbl">授权账号</div></div><div class="pc-dot-item"><div class="val">'+approvals.value.filter(function(a){return a.status==="pending";}).length+'</div><div class="lbl">待审批</div></div><div class="pc-dot-item"><div class="val">'+approvals.value.filter(function(a){return a.status==="approved";}).length+'</div><div class="lbl">已通过</div></div><div class="pc-dot-item"><div class="val">'+SHARE_PEOPLE.length+'</div><div class="lbl">可分配</div></div>';
  if(p.id===3){
    var fbCount=p4Feedbacks.value.length;
    var avgSat=fbCount?(p4Feedbacks.value.reduce(function(s,f){return s+(f.score||0);},0)/fbCount).toFixed(1):'—';
    return '<div class="pc-dot-item"><div class="val">'+fbCount+'</div><div class="lbl">反馈数</div></div><div class="pc-dot-item"><div class="val">'+avgSat+'</div><div class="lbl">满意度·5</div></div><div class="pc-dot-item"><div class="val">'+(p4SyncStatus.value==='ok'?'已连接':p4SyncStatus.value==='failed'?'离线':'...')+'</div><div class="lbl">数据源</div></div><div class="pc-dot-item"><div class="val">'+metricsThisWeek.value+'</div><div class="lbl">本周新增</div></div>';
  }
  if(p.id===4){
    var totalDecks=(sharedPpts.value?sharedPpts.value.length:0)+(myPpts.value?myPpts.value.length:0);
    return '<div class="pc-dot-item"><div class="val">'+totalDecks+'</div><div class="lbl">总文稿</div></div><div class="pc-dot-item"><div class="val">'+pptTemplates.value.length+'</div><div class="lbl">模板</div></div><div class="pc-dot-item"><div class="val">'+(sharedPpts.value?sharedPpts.value.length:0)+'</div><div class="lbl">共享中</div></div><div class="pc-dot-item"><div class="val">'+(myPpts.value?myPpts.value.length:0)+'</div><div class="lbl">我的作品</div></div>';
  }
  if(p.id>=5&&p.id<=6 || p.id===8 || p.id===9) return '<div class="pc-dot-item"><div class="val">—</div><div class="lbl">建设中</div></div><div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div><div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div><div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div>';
  // P7 会议中枢
  if(p.id===7){
    var allAttendees = meetingList.value.reduce(function(set,m){ (m.attendees||[]).forEach(function(a){ set.add(a); }); return set; }, new Set());
    return '<div class="pc-dot-item"><div class="val">'+meetingTodayCount.value+'</div><div class="lbl">今日会议</div></div><div class="pc-dot-item"><div class="val">'+meetingWeekCount.value+'</div><div class="lbl">本周会议</div></div><div class="pc-dot-item"><div class="val">'+meetingTotalCount.value+'</div><div class="lbl">累计会议</div></div><div class="pc-dot-item"><div class="val">'+allAttendees.size+'</div><div class="lbl">参会人次</div></div>';
  }
  if(p.id===10) return '<div class="pc-dot-item"><div class="val">'+openAssignmentCount.value+'</div><div class="lbl">进行中</div></div><div class="pc-dot-item"><div class="val">'+dueSoonAssignmentCount.value+'</div><div class="lbl">48h到期</div></div><div class="pc-dot-item"><div class="val">'+doneAssignmentCount.value+'</div><div class="lbl">已完成</div></div><div class="pc-dot-item"><div class="val">'+SHARE_PEOPLE.length+'</div><div class="lbl">可派发</div></div>';
  return '<div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div><div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div><div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div><div class="pc-dot-item"><div class="val">—</div><div class="lbl">—</div></div>';
}
function panelDetailHTML(p){
  if(p.id===1)return'<div class="panel-detail-grid"><div class="panel-metric"><b>23</b><span>活跃事项 / Active Items</span></div><div class="panel-metric"><b>5</b><span>待处理政策 / Pending Policies</span></div><div class="panel-metric"><b>4</b><span>本周会议 / Meetings</span></div><div class="panel-metric"><b>8</b><span>系统需求 / System Needs</span></div></div>';
  if(p.id===3){
    var fbCount = p4Feedbacks.value.length;
    var avgSat = metricsAvgSat.value;
    var solved = metricsSolvedRate.value;
    var nps = metricsNPS.value;
    var syncSrc = feedbackSyncSource.value === 'live' ? '实时' : feedbackSyncSource.value === 'cache' ? '缓存' : '未连接';
    return '<div class="panel-detail-grid">'+
      '<div class="panel-metric"><b>'+fbCount+'</b><span>反馈数 / Feedbacks</span></div>'+
      '<div class="panel-metric"><b>'+avgSat+'/5</b><span>满意度 / Satisfaction</span></div>'+
      '<div class="panel-metric"><b>'+solved+'%</b><span>解决率 / Solved</span></div>'+
      '<div class="panel-metric"><b>'+nps+'</b><span>NPS · '+syncSrc+'</span></div>'+
    '</div>';
  }
  // P4 AI 工具广场：实时数据
  if(p.id===4){
    var totalDecks = (sharedPpts.value ? sharedPpts.value.length : 0) + (myPpts.value ? myPpts.value.length : 0);
    var mine = myPpts.value ? myPpts.value.length : 0;
    var shared = sharedPpts.value ? sharedPpts.value.length : 0;
    var inboxN = inboxPptShares.value ? inboxPptShares.value.length : 0;
    return '<div class="panel-detail-grid">'+
      '<div class="panel-metric"><b>'+totalDecks+'</b><span>累计演示文稿 / Total Decks</span></div>'+
      '<div class="panel-metric"><b>'+shared+'</b><span>共享文稿 / Shared</span></div>'+
      '<div class="panel-metric"><b>'+mine+'</b><span>我的作品 / My Decks</span></div>'+
      '<div class="panel-metric"><b>'+inboxN+'</b><span>待我查看 / Pending</span></div>'+
    '</div>';
  }
  // P9 自由主题共享论坛：实时数据
  if(p.id===9){
    var shares = shareList.value || [];
    var totalShares = shares.length;
    var commentN = shares.reduce(function(m,s){ return m + ((s.comments&&s.comments.length)||0); }, 0);
    var likeN = shares.reduce(function(m,s){ return m + (s.likes||0); }, 0);
    var inboxF = inboxForumShares.value ? inboxForumShares.value.length : 0;
    return '<div class="panel-detail-grid">'+
      '<div class="panel-metric"><b>'+totalShares+'</b><span>累计分享 / Shares</span></div>'+
      '<div class="panel-metric"><b>'+commentN+'</b><span>评论数 / Comments</span></div>'+
      '<div class="panel-metric"><b>'+likeN+'</b><span>点赞数 / Likes</span></div>'+
      '<div class="panel-metric"><b>'+inboxF+'</b><span>@我未读 / Mentions</span></div>'+
    '</div>';
  }
  // P7 会议中枢
  if(p.id===7){
    var allAtt2 = meetingList.value.reduce(function(set,m){ (m.attendees||[]).forEach(function(a){ set.add(a); }); return set; }, new Set());
    return '<div class="panel-detail-grid">'+
      '<div class="panel-metric"><b>'+meetingTodayCount.value+'</b><span>今日会议 / Today</span></div>'+
      '<div class="panel-metric"><b>'+meetingWeekCount.value+'</b><span>本周会议 / This Week</span></div>'+
      '<div class="panel-metric"><b>'+meetingTotalCount.value+'</b><span>累计会议 / Total</span></div>'+
      '<div class="panel-metric"><b>'+allAtt2.size+'</b><span>参会人次 / Attendees</span></div>'+
    '</div>';
  }
  if(p.id===10)return'<div class="panel-detail-grid"><div class="panel-metric"><b>'+openAssignmentCount.value+'</b><span>Open 工作项 / Open Tasks</span></div><div class="panel-metric"><b>'+dueSoonAssignmentCount.value+'</b><span>48h DDL</span></div><div class="panel-metric"><b>'+doneAssignmentCount.value+'</b><span>已完成 / Done</span></div><div class="panel-metric"><b>'+SHARE_PEOPLE.length+'</b><span>可派发对象 / Assignees</span></div></div>';
  if(p.status==='warn')return'<div style="font-size:12px;color:#e37318;padding:4px 0">'+panelName(p)+' 数据刷新延迟 / Data refresh delayed</div>';
  return'<div style="font-size:12px;color:rgba(0,0,0,.4);padding:4px 0">'+panelName(p)+' 运行正常 / Running normally</div>';
}

// P2
let p2ActiveTab = ref('all');
const p2Modules = [
  {num:'1.1',label:'向下·政策落地',desc:'政策落地下发清单、国家适配分析、落地执行看板、培训追踪、效果验证',tab:'11',
   slots:[{label:'国家适配清单',sub:'识别COE政策在各国的本地化要求',filled:true},{label:'落地执行追踪',sub:'政策下发进度 & 执行状态',filled:true},{},{},{}]},
  {num:'1.2',label:'向上·运营升级',desc:'运营问题收纳站、归因分析、优化建议提报 COE、闭环追踪',tab:'12',
   slots:[{label:'问题收纳站',sub:'区域运营问题自动汇聚',filled:true},{label:'升级触发规则',sub:'阈值配置 & 升级路径',filled:true},{}]},
  {num:'1.3',label:'事项全景看板',desc:'统一事项池（四类标签）、双向流动图、月度日历、效能分析、阻塞预警',tab:'13',
   slots:[{label:'统一事项池',sub:'四类标签 & 双向流动',filled:true},{label:'月度效能分析',sub:'事项趋势 & 完成率',filled:true},{}]},
  {num:'1.4',label:'事项类型矩阵',desc:'四类事项的处理路径和交付物标准，PMO 已统一定义',tab:'14',
   slots:[{label:'处理路径',sub:'四类事项处理流程',filled:true},{label:'交付物标准',sub:'PMO统一定义',filled:true},{}]},
  {num:'1.6',label:'会议与跟进',desc:'本模块会议日历、议题墙、决议跟进项、跨模块联席会',tab:'16',
   slots:[{label:'会议日历',sub:'例会节奏 & 议题模板',filled:true},{label:'决议跟进',sub:'行动项 & 超期预警',filled:true},{}]},
  {num:'1.7',label:'系统需求生命周期',desc:'9 阶段追踪、12 分区详情卡片、上线数据反馈',tab:'17',
   slots:[{label:'9阶段追踪',sub:'需求全生命周期',filled:true},{label:'12分区详情',sub:'TAPD对接状态',filled:true},{label:'上线反馈',sub:'上线后数据回收',filled:true},{}]}
];

let p2TabContentHTML = computed(function(){
  var filtered = p2ActiveTab.value==='all' ? p2Modules : p2Modules.filter(function(m){return m.tab===p2ActiveTab.value;});
  return filtered.map(function(m){
    var filled=m.slots.filter(function(s){return s&&s.filled;});
    var empty=m.slots.filter(function(s){return !s||!s.filled;});
    return '<div class="p2-module-hero"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><span style="font-size:10px;font-weight:700;color:rgba(0,0,0,.4)">'+m.num+'</span><span style="font-size:18px;font-weight:600;flex:1;margin-left:12px">'+m.label+'</span></div><div style="font-size:13px;color:rgba(0,0,0,.6);line-height:1.7;margin-bottom:16px">'+m.desc+'</div><div class="p2-module-slots">'+
      filled.map(function(s){return'<div class="p2-slot filled"><div class="label">'+s.label+'</div><div style="font-size:10px;color:rgba(0,0,0,.4);margin-top:2px">'+s.sub+'</div></div>';}).join('')+
      empty.map(function(){return'<div class="p2-slot"><div class="plus">+</div><div style="font-size:11px;color:rgba(0,0,0,.4)">扩展接口</div></div>';}).join('')+
    '</div></div>';
  }).join('');
});

// ===== P4 CHATBOT =====
let p4ActiveTab = ref('open-tickets');

// ===== 运营数据看板（Mock 数据 — 后续接入真实数据库） =====
let opsTickets = reactive({ d: 47, m: 1283, ytd: 8956 });
let opsManual = reactive({ d: 12, m: 342, ytd: 2410 });
let opsLastMonth = reactive({ d: '-', m: 1156, ytd: 7673 });

let opsModules = ref([
  { name: '薪酬', count: 186, percent: 100 },
  { name: '社保公积金', count: 152, percent: 82 },
  { name: '入离职', count: 134, percent: 72 },
  { name: '考勤假期', count: 98, percent: 53 },
  { name: '合同签署', count: 67, percent: 36 },
  { name: '证明开具', count: 45, percent: 24 },
  { name: '系统权限', count: 38, percent: 20 },
  { name: '其他', count: 22, percent: 12 },
]);

let opsExceptions = reactive({
  firstResponseOverdue: 3,
  closeOverdue: 7,
  sat1: 2,
  sat2: 8,
  sat3: 15,
});

// 未关单工单（Mock 数据）
let opsOpenTickets = ref([
  { id: 'TK-20260623-001', title: '薪资发放日期咨询 - 6月工资未到账', module: '薪酬', owner: 'danniewu', elapsed: '2d 3h', overdue: false },
  { id: 'TK-20260623-002', title: '社保基数调整申请流程确认', module: '社保', owner: 'annawzhang', elapsed: '1d 18h', overdue: false },
  { id: 'TK-20260622-015', title: '公积金提取材料清单', module: '公积金', owner: 'melodyxuxu', elapsed: '3d 5h', overdue: true },
  { id: 'TK-20260622-008', title: '入职证明开具 - 需英文版', module: '证明', owner: 'rrayzhao', elapsed: '2d 12h', overdue: true },
  { id: 'TK-20260621-003', title: '年假余额计算有误反馈', module: '考勤假期', owner: 'jiachunngu', elapsed: '4d 1h', overdue: true },
  { id: 'TK-20260623-007', title: '离职手续办理进度查询', module: '入离职', owner: 'tobyliao', elapsed: '8h', overdue: false },
  { id: 'TK-20260623-012', title: '劳动合同续签提醒未收到', module: '合同', owner: 'vvvliu', elapsed: '5h', overdue: false },
]);

function refreshOpenTickets(){
  MessagePlugin.info('刷新未关单列表（数据接入后将拉取真实数据）');
}
let p4FeedbackTab = ref('list');
let p4FaqTab = ref('faq');
let p4TrendTab = ref('hourly');

let p4Metrics = reactive({slaTop:'97.2%'});

let p4HourlyChartHTML = computed(function(){
  var data=[{h:'00:00',v:180},{h:'02:00',v:90},{h:'04:00',v:45},{h:'06:00',v:120},{h:'08:00',v:420},{h:'10:00',v:580,peak:true},{h:'12:00',v:510},{h:'14:00',v:610,peak:true},{h:'16:00',v:490},{h:'18:00',v:350},{h:'20:00',v:280},{h:'22:00',v:200}];
  var max=Math.max.apply(null,data.map(function(d){return d.v;}));
  return data.map(function(d){var h=Math.max(4,Math.round(d.v/max*100));return'<div class="p4-chart-col"><div class="p4-chart-val">'+d.v+'</div><div class="p4-chart-bar '+(d.peak?'cur':'')+'" style="height:'+h+'%"></div><div class="p4-chart-label">'+d.h+'</div></div>';}).join('');
});

let p4DailyChartHTML = computed(function(){
  var data=[{d:'6/14',v:7200},{d:'6/15',v:6850},{d:'6/16',v:8100},{d:'6/17',v:7950},{d:'6/18',v:8320},{d:'6/19',v:8680},{d:'6/20',v:8521}];
  var max=Math.max.apply(null,data.map(function(d){return d.v;}));
  return data.map(function(d,i){var h=Math.max(4,Math.round(d.v/max*100));return'<div class="p4-chart-col"><div class="p4-chart-val">'+(d.v/1000).toFixed(1)+'k</div><div class="p4-chart-bar '+(i===data.length-1?'cur':'')+'" style="height:'+h+'%"></div><div class="p4-chart-label">'+d.d+'</div></div>';}).join('');
});

let p4DataFreshness = ref([
  {metric:'会话量 / 在线用户',source:'Chatbot Log / BA 报表',last:'10:05',freq:'每小时',status:'正常',owner:'BA'},
  {metric:'满意度趋势',source:'用户评分与反馈标签',last:'09:30',freq:'每日',status:'Demo mock',owner:'danniewu'},
  {metric:'告警队列',source:'企微群 / ServiceNow',last:'实时',freq:'5 min',status:'待接接口',owner:'Monitor'},
  {metric:'FAQ Audit',source:'语料库巡检任务',last:'2026-06-20',freq:'双周',status:'正常',owner:'vvvliu'}
]);
let p4DataFreshnessColumns = [
  {colKey:'metric',title:'指标 / 模块 · Metric',width:180},{colKey:'source',title:'数据来源 · Source',width:180},{colKey:'last',title:'最近刷新 · Last Refresh',width:130},
  {colKey:'freq',title:'刷新频率 · Frequency',width:120},{colKey:'status',title:'状态 · Status',width:110},{colKey:'owner',title:'Owner',width:80}
];

let p4Feedbacks = ref([]);

// ===== 反馈打分表 =====
let fbForm = reactive({ summary:'', satisfaction:0, accuracy:0, speed:0, solved:'', nps:null, liked:'', improve:'', callback:null, screenshots:[] });
function resetFbForm(){ fbForm.summary=''; fbForm.satisfaction=0; fbForm.accuracy=0; fbForm.speed=0; fbForm.solved=''; fbForm.nps=null; fbForm.liked=''; fbForm.improve=''; fbForm.callback=null; fbForm.screenshots=[]; }
function onFbUpload(e){
  var files = Array.from(e.target.files||[]).slice(0,5);
  fbForm.screenshots = files.map(function(f){ return f.name; });
}
function submitFeedback(){
  if(!fbForm.summary.trim()||!fbForm.satisfaction){ MessagePlugin.warning('请填写反馈摘要并打分'); return; }
  var who = (realStaff.value && realStaff.value.staffName) ? realStaff.value.staffName : currentUserName.value;
  var score = fbForm.satisfaction;
  var tags = [];
  if(score<=2) tags.push(['低分 · Low','red']);
  if(fbForm.solved==='No') tags.push(['未解决 · Unsolved','red']);
  else if(fbForm.solved==='Partial') tags.push(['部分解决 · Partial','amber']);
  else if(fbForm.solved==='Yes') tags.push(['已解决 · Solved','green']);
  if(fbForm.callback===true) tags.push(['愿回访 · Callback','amber']);
  tags.push(['新提交 · New','green']);
  p4Feedbacks.value.unshift({
    user: who,
    time: '刚刚 · Just now',
    score: score,
    q: fbForm.summary.trim(),
    a: buildFbDetail(),
    tags: tags,
    raw: { accuracy:fbForm.accuracy, speed:fbForm.speed, solved:fbForm.solved, nps:fbForm.nps, liked:fbForm.liked, improve:fbForm.improve, callback:fbForm.callback }
  });
  MessagePlugin.success('反馈已提交并同步到反馈看板');
  resetFbForm();
  p4ActiveTab.value='feedback';
}
function buildFbDetail(){
  var parts=[];
  if(fbForm.accuracy) parts.push('准确度 '+fbForm.accuracy+'/5');
  if(fbForm.speed) parts.push('响应速度 '+fbForm.speed+'/5');
  if(fbForm.solved) parts.push('是否解决: '+fbForm.solved);
  if(fbForm.nps!==null) parts.push('NPS '+fbForm.nps);
  if(fbForm.liked) parts.push('优点: '+fbForm.liked);
  if(fbForm.improve) parts.push('待改进: '+fbForm.improve);
  if(fbForm.callback!==null) parts.push('企微回访: '+(fbForm.callback?'是':'否'));
  return parts.join(' · ') || '（无补充）';
}

let p4FeedbackActions = ref([]);

// ===== Metrics 真实计算 (从 p4Feedbacks 驱动) =====
let csvUploadStatus = ref('支持 98008 管理后台导出的 CSV 格式');
let csvFileInput = ref(null);
let metricsThisWeek = computed(function(){
  var now=Date.now(), week=7*24*3600000;
  return p4Feedbacks.value.filter(function(f){
    try{ return (now-new Date(f.submittedAt||f.time).getTime())<week; }catch(e){return false;}
  }).length;
});
let metricsAvgSat = computed(function(){
  var rows=p4Feedbacks.value.filter(function(f){return f.score>0;});
  if(!rows.length) return '—';
  return (rows.reduce(function(s,f){return s+f.score;},0)/rows.length).toFixed(1);
});
let metricsAvgAccuracy = computed(function(){
  var rows=p4Feedbacks.value.filter(function(f){return f.accuracy>0;});
  if(!rows.length) return '—';
  return (rows.reduce(function(s,f){return s+f.accuracy;},0)/rows.length).toFixed(1);
});
let metricsAvgSpeed = computed(function(){
  var rows=p4Feedbacks.value.filter(function(f){return f.speed>0;});
  if(!rows.length) return '—';
  return (rows.reduce(function(s,f){return s+f.speed;},0)/rows.length).toFixed(1);
});
let metricsSolvedRate = computed(function(){
  var rows=p4Feedbacks.value; if(!rows.length) return '—';
  var yes=rows.filter(function(f){return f.solved==='yes'||f.solved==='true';}).length;
  return Math.round(yes/rows.length*100);
});
let metricsNPS = computed(function(){
  var rows=p4Feedbacks.value.filter(function(f){return f.nps>=0;});
  if(!rows.length) return '—';
  var promoters=rows.filter(function(f){return f.nps>=9;}).length;
  var detractors=rows.filter(function(f){return f.nps<=6;}).length;
  return Math.round((promoters-detractors)/rows.length*100);
});

// 按模块统计问询量（来自 98008 真实 modules 字段）
let metricsModuleStats = computed(function(){
  var map={};
  p4Feedbacks.value.forEach(function(f){
    var mod = f.modules||'未分类';
    map[mod] = (map[mod]||0) + 1;
  });
  var arr = Object.keys(map).map(function(k){ return {name:k,count:map[k]}; });
  arr.sort(function(a,b){return b.count-a.count;});
  var max = arr.length ? arr[0].count : 1;
  arr.forEach(function(x){ x.percent = Math.round(x.count/Math.max(1,max)*100); });
  return arr;
});

// 按部门统计
let metricsDeptStats = computed(function(){
  var map={};
  p4Feedbacks.value.forEach(function(f){
    var dept = f.department||'未知';
    map[dept] = (map[dept]||0) + 1;
  });
  var arr = Object.keys(map).map(function(k){ return {name:k,count:map[k]}; });
  arr.sort(function(a,b){return b.count-a.count;});
  var max = arr.length ? arr[0].count : 1;
  arr.forEach(function(x){ x.percent = Math.round(x.count/Math.max(1,max)*100); });
  return arr;
});

// 低分反馈（overall <= 2）
let metricsLowScoreList = computed(function(){
  return p4Feedbacks.value.filter(function(f){return f.score>0 && f.score<=2;});
});

// 用户好评/改进意见汇总
let metricsLikedList = computed(function(){
  return p4Feedbacks.value.filter(function(f){return f.liked && f.liked.trim();}).map(function(f){return {user:f.user,text:f.liked,time:f.time};});
});
let metricsImproveList = computed(function(){
  return p4Feedbacks.value.filter(function(f){return f.improve && f.improve.trim();}).map(function(f){return {user:f.user,text:f.improve,time:f.time};});
});

let metricsDailyChartHTML = computed(function(){
  var rows=p4Feedbacks.value; if(!rows.length) return '';
  var days={};
  rows.forEach(function(f){
    var raw = f.submittedAt || f.time;
    if(!raw) return;
    try{
      var d = new Date(raw);
      if(isNaN(d.getTime())) return;
      var key = (d.getMonth()+1)+'/'+d.getDate();
      days[key] = (days[key]||0)+1;
    }catch(e){}
  });
  var keys = Object.keys(days);
  // 按日期排序
  keys.sort(function(a,b){
    var pa=a.split('/'), pb=b.split('/');
    return (parseInt(pa[0])*100+parseInt(pa[1])) - (parseInt(pb[0])*100+parseInt(pb[1]));
  });
  keys = keys.slice(-14);
  if(!keys.length) return '';
  var max = Math.max.apply(null, keys.map(function(k){return days[k];}));
  // 竖向柱状图
  return '<div style="display:flex;align-items:flex-end;gap:6px;height:140px;padding-top:10px">' +
    keys.map(function(k){
      var pct = Math.round(days[k]/Math.max(1,max)*100);
      var h = Math.max(8, pct * 1.2);
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">' +
        '<span style="font-size:11px;font-weight:700;color:#0052d9">' + days[k] + '</span>' +
        '<div style="width:100%;max-width:36px;height:' + h + 'px;background:linear-gradient(180deg,#0052d9,#4e93ff);border-radius:4px 4px 0 0;transition:height .3s"></div>' +
        '<span style="font-size:10px;color:rgba(0,0,0,.45);white-space:nowrap">' + k + '</span>' +
      '</div>';
    }).join('') + '</div>';
});

// CSV 上传解析
function onCsvUpload(ev){
  var file=ev.target.files&&ev.target.files[0]; if(!file) return;
  csvUploadStatus.value='正在解析: '+file.name+'...';
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var text=e.target.result;
      var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
      if(lines.length<2){ csvUploadStatus.value='CSV 为空或只有表头'; return; }
      var headers=lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'').toLowerCase();});
      var imported=0;
      for(var i=1;i<lines.length;i++){
        var cols=lines[i].split(',').map(function(c){return c.trim().replace(/^"|"$/g,'');});
        var row={};
        headers.forEach(function(h,idx){row[h]=cols[idx]||'';});
        // 映射到 p4Feedbacks 格式
        var fb={
          user: row.user||row.username||row.staff||row.name||row.staffname||'anonymous',
          time: row.time||row.date||row.createtime||row.created_at||row.timestamp||('CSV 第'+(i+1)+'行'),
          score: parseInt(row.score||row.satisfaction||row.overall||row.rating)||3,
          accuracy: parseInt(row.accuracy||row.answer_accuracy)||0,
          speed: parseInt(row.speed||row.response_speed)||0,
          solved: row.solved||row.problem_solved||'',
          nps: parseInt(row.nps||row.recommendation),
          q: row.q||row.question||row.feedback||row.summary||row.content||'',
          a: row.a||row.answer||row.reply||'',
          tags: [['CSV 导入','amber']],
          source: 'csv-import'
        };
        if(isNaN(fb.nps)) fb.nps=null;
        p4Feedbacks.value.push(fb);
        imported++;
      }
      csvUploadStatus.value='✅ 成功导入 '+imported+' 条反馈（共 '+p4Feedbacks.value.length+' 条）';
    }catch(err){
      csvUploadStatus.value='❌ 解析失败: '+err.message;
    }
  };
  reader.readAsText(file);
  ev.target.value=''; // reset input
}

let p4FeedbackKpisHTML = computed(function(){
  var rows=p4Feedbacks.value;
  var avg=rows.reduce(function(s,f){return s+f.score;},0)/Math.max(1,rows.length);
  return'<div class="p4-kpi-card"><div class="p4-kpi-label">当前平均评分 · Avg Score</div><div class="p4-kpi-val">'+avg.toFixed(1)+'<small>/5</small></div></div>'+
    '<div class="p4-kpi-card warn"><div class="p4-kpi-label">低分率 · Low-score Rate<div style="font-size:10px;font-weight:400;color:rgba(0,0,0,.4);margin-top:2px">满意度 ≤ 2 分的占比</div></div><div class="p4-kpi-val">'+Math.round(rows.filter(function(f){return f.score<=2;}).length/Math.max(1,rows.length)*100)+'<small>%</small></div></div>'+
    '<div class="p4-kpi-card"><div class="p4-kpi-label">已转动作 · Actions</div><div class="p4-kpi-val">'+p4FeedbackActions.value.length+'</div></div>'+
    '<div class="p4-kpi-card"><div class="p4-kpi-label">已处理 · Resolved</div><div class="p4-kpi-val">'+rows.filter(function(f){return f.resolved;}).length+'</div></div>';
});

function feedbackId(f){return p4Feedbacks.value.indexOf(f)+1;}
function actionsForFeedback(f){var id=feedbackId(f);return p4FeedbackActions.value.filter(function(a){return a.fid===id;});}
function hasFeedbackAction(f,kind){var id=feedbackId(f);return p4FeedbackActions.value.some(function(a){return a.fid===id&&a.kind===kind;});}
function upsertFeedbackAction(fid,kind,type,source,owner,status){
  var found=p4FeedbackActions.value.find(function(a){return a.fid===fid&&a.kind===kind;});
  if(found){found.status=status||found.status;return found;}
  var item={fid:fid,kind:kind,type:type,source:source,owner:owner,status:status||'待确认'};
  p4FeedbackActions.value.unshift(item);
  return item;
}
function removeFeedbackAction(fid,kind){
  p4FeedbackActions.value=p4FeedbackActions.value.filter(function(a){return !(a.fid===fid&&a.kind===kind);});
  MessagePlugin.success('已从动作队列移除');
}
function markFeedback(f,type){
  var id=feedbackId(f);
  var actionLabel = type==='faq'?'FAQ 跟进':type==='alert'?'告警跟进':'反馈处理';
  if(type==='resolved'){
    f.resolved=true;
    actionsForFeedback(f).forEach(function(a){a.status='已处理';});
    createFeedbackTodo(actionLabel, f.q);
    MessagePlugin.success('已标记处理完成，24h 待办已生成');
    return;
  }
  if(hasFeedbackAction(f,type)){
    removeFeedbackAction(id,type);
    return;
  }
  upsertFeedbackAction(id,type,type==='faq'?'FAQ 候选':'告警候选',f.q,realStaff.value?realStaff.value.staffName:'oscarwei','待确认');
  createFeedbackTodo(actionLabel, f.q);
  MessagePlugin.success((type==='faq'?'已转入 FAQ 候选':'已转入告警候选')+'，24h 待办已生成');
}

// 反馈转动作时自动给自己创建一条 24h DDL 的工作项
function createFeedbackTodo(label, content){
  var me = realStaff.value ? realStaff.value.staffName : 'oscarwei';
  var ddl = new Date(Date.now()+24*3600*1000).toISOString().slice(0,16);
  var title = '['+label+'] ' + (content||'').slice(0,40);
  // 复用工作项派发接口（存容器持久盘，to-do 自动联动）
  fetch('/api/assignment/create', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'include',
    body: JSON.stringify({title:title, assignee:me, priority:'High', dueAt:ddl, source:'反馈看板自动生成', note:'请在 24h 内跟进此反馈动作。'})
  }).then(function(){ if(typeof loadAssignments==='function') loadAssignments(); }).catch(function(){});
}

let p4SatisfactionReasons = [['政策答案不准确',42],['流程卡顿/链接失效',31],['语料覆盖不足',18],['转人工不及时',9]];
let p4SatisfactionKpisHTML = computed(function(){
  var rows=p4Feedbacks.value;
  var avg=rows.length?(rows.reduce(function(s,f){return s+(f.score||0);},0)/rows.length).toFixed(1):'—';
  var lowRate=rows.length?Math.round(rows.filter(function(f){return f.score<=2;}).length/rows.length*100):0;
  var npsRows=rows.filter(function(f){return typeof f.nps==='number';});
  var nps=npsRows.length?Math.round((npsRows.filter(function(f){return f.nps>=9;}).length-npsRows.filter(function(f){return f.nps<=6;}).length)/npsRows.length*100):'—';
  return '<div class="p4-kpi-card"><div class="p4-kpi-label">平均满意度 · Avg Satisfaction</div><div class="p4-kpi-val">'+avg+'<small>/5</small></div></div>'+
    '<div class="p4-kpi-card'+(lowRate>20?' warn':'')+'"><div class="p4-kpi-label">低分率 · Low-score Rate<div style=\"font-size:10px;font-weight:400;color:rgba(0,0,0,.4);margin-top:2px\">满意度 ≤ 2 分的占比</div></div><div class="p4-kpi-val">'+lowRate+'<small>%</small></div></div>'+
    '<div class="p4-kpi-card"><div class="p4-kpi-label">反馈总量 · Total</div><div class="p4-kpi-val">'+rows.length+'</div></div>'+
    '<div class="p4-kpi-card'+(nps<0?' warn':'')+'"><div class="p4-kpi-label">NPS 净推荐值</div><div class="p4-kpi-val">'+nps+'</div></div>';
});

let p4SatisfactionChartHTML = computed(function(){
  var rows=p4Feedbacks.value; if(!rows.length) return '<div style="text-align:center;padding:24px;color:rgba(0,0,0,.3);font-size:12px">暂无数据</div>';
  // 按日分组算平均满意度
  var days={},counts={};
  rows.forEach(function(f){
    try{var d=new Date(f.time);var key=(d.getMonth()+1)+'/'+d.getDate();days[key]=(days[key]||0)+(f.score||0);counts[key]=(counts[key]||0)+1;}catch(e){}
  });
  var keys=Object.keys(days).slice(-10);
  return keys.map(function(k,i){
    var avg=(days[k]/counts[k]).toFixed(1);
    var h=Math.max(10,Math.round(avg/5*100));
    return '<div class="p4-chart-col"><div class="p4-chart-val">'+avg+'</div><div class="p4-chart-bar '+(i===keys.length-1?'cur':'')+'" style="height:'+h+'%"></div><div class="p4-chart-label">'+k+'</div></div>';
  }).join('');
});

// P4 FAQ
let p4AuditRuns = ref([
  {cycle:'W23',issues:9,resolved:6,conflicts:3,gaps:2,next:'W24 周五'},
  {cycle:'W24',issues:7,resolved:6,conflicts:2,gaps:2,next:'W25 周五'},
  {cycle:'W25',issues:5,resolved:4,conflicts:1,gaps:1,next:'W26 周五'},
  {cycle:'W26',issues:4,resolved:2,conflicts:2,gaps:1,next:'W27 周五'}
]);
let p4AuditColumns = [
  {colKey:'cycle',title:'周期 · Cycle'},{colKey:'issues',title:'发现问题 · Issues'},{colKey:'resolved',title:'已处理 · Resolved'},
  {colKey:'conflicts',title:'冲突 · Conflicts'},{colKey:'gaps',title:'覆盖缺口 · Gaps'},{colKey:'next',title:'下次节点 · Next'}
];
let p4Audits = ref([
  {id:1,type:'语义冲突',faqA:'公积金提取流程',faqB:'住房补贴申请流程',desc:'两条 FAQ 均涉及"住房提取"但路径不同',status:'待处理',done:false},
  {id:2,type:'信息过期',faqA:'2025 年个税扣除标准',faqB:'-',desc:'该 FAQ 引用的税率标准已过期',status:'待处理',done:false}
]);
let p4AuditTableColumns = [
  {colKey:'type',title:'类型 · Type',width:120},{colKey:'faqA',title:'FAQ A'},{colKey:'faqB',title:'FAQ B'},
  {colKey:'desc',title:'问题描述 · Description',ellipsis:true},{colKey:'status',title:'状态 · Status',width:110},{colKey:'action',title:'操作 · Action',width:110}
];
let p4Faqs = ref([
  {title:'公积金提取流程与所需材料',cat:'社保公积金',author:'danniewu',time:'2026-06-20',status:'正常'},
  {title:'入职体检预约指引',cat:'入职指引',author:'vvvliu',time:'2026-06-19',status:'待审/冲突'},
  {title:'差旅报销标准（国内）',cat:'差旅报销',author:'jiachunngu',time:'2026-06-19',status:'正常'},
  {title:'年假计算规则与申请流程',cat:'请假审批',author:'tobyliao',time:'2026-06-18',status:'正常'},
  {title:'工资条查询指引',cat:'薪酬福利',author:'danniewu',time:'2026-06-18',status:'正常'},
]);
let p4FaqTableColumns = [
  {colKey:'title',title:'FAQ 标题 · Title',ellipsis:true},{colKey:'cat',title:'分类 · Category',width:120},{colKey:'author',title:'作者 · Author',width:100},
  {colKey:'time',title:'更新时间 · Updated',width:140},{colKey:'status',title:'状态 · Status',width:120}
];
function resolveFaqIssue(id){var a=p4Audits.value.find(function(x){return x.id===id;});if(a){a.done=true;a.status='已处理';}MessagePlugin.success('已完成');}
function addP4Faq(){
  var candidate=p4FeedbackActions.value.find(function(a){return a.kind==='faq'&&a.status!=='已处理';});
  var title=prompt('请输入 FAQ 标题：',candidate?candidate.source:'新 FAQ 条目');
  if(!title)return;
  p4Faqs.value.unshift({title:title,cat:candidate?'反馈转入':'待分类',author:'oscarwei',time:'2026-06-22',status:'待审'});
  if(candidate){
    candidate.status='已处理';
    var fb=p4Feedbacks.value[candidate.fid-1];
    if(fb)fb.resolved=true;
  }
  MessagePlugin.success(candidate?'已由反馈候选生成 FAQ':'已新增 FAQ');
}

// P4 Lexicon
let p4LexSearch = ref('');
let p4LexLevel = ref('');
let p4LexiconData = ref([
  {word:'fuck you',lang:'EN',level:'L3',trigger:'direct_abuse',construct:'辱骂 / 攻击性表达',source:'chatbot_alert_full_report',regex:'yes'},
  {word:'垃圾系统',lang:'CN',level:'L3',trigger:'direct_abuse',construct:'强烈负面辱骂',source:'chatbot_alert_full_report',regex:'yes'},
  {word:'投诉',lang:'CN',level:'L3',trigger:'escalation_intent',construct:'升级 / 投诉意图',source:'用户反馈',regex:'no'},
  {word:'not working',lang:'EN',level:'L2',trigger:'process_blocked',construct:'流程阻塞 / 链接不可用',source:'FAQ feedback',regex:'no'},
  {word:'打不开',lang:'CN',level:'L2',trigger:'process_blocked',construct:'入口或链接异常',source:'企微反馈',regex:'no'},
  {word:'一直处理中',lang:'CN',level:'L2',trigger:'timeout',construct:'流程超时 / 状态卡住',source:'ServiceNow',regex:'no'},
  {word:'urgent',lang:'EN',level:'L2',trigger:'urgency',construct:'紧急诉求',source:'chatbot_alert_full_report',regex:'no'},
  {word:'马上处理',lang:'CN',level:'L2',trigger:'urgency',construct:'即时处理诉求',source:'用户反馈',regex:'no'},
  {word:'frustrated',lang:'EN',level:'L1',trigger:'emotion',construct:'轻度负面情绪',source:'情绪词库',regex:'no'},
  {word:'太慢了',lang:'CN',level:'L1',trigger:'emotion',construct:'体验不满',source:'情绪词库',regex:'no'},
  {word:'人工客服',lang:'CN',level:'L1',trigger:'handoff',construct:'转人工意图',source:'对话日志',regex:'no'},
  {word:'human agent',lang:'EN',level:'L1',trigger:'handoff',construct:'转人工意图',source:'对话日志',regex:'no'},
  {word:'签证邀请函',lang:'CN',level:'L1',trigger:'topic_hotspot',construct:'高频业务主题',source:'HRSSC FAQ',regex:'no'},
  {word:'invitation letter',lang:'EN',level:'L1',trigger:'topic_hotspot',construct:'高频业务主题',source:'HRSSC FAQ',regex:'no'},
  {word:'payroll error',lang:'EN',level:'L2',trigger:'sensitive_payroll',construct:'薪酬敏感问题',source:'Payroll FAQ',regex:'no'},
  {word:'工资不对',lang:'CN',level:'L2',trigger:'sensitive_payroll',construct:'薪酬敏感问题',source:'Payroll FAQ',regex:'no'}
]);
let p4LexiconDisplay = computed(function(){
  var q=p4LexSearch.value.toLowerCase(),lvl=p4LexLevel.value;
  return p4LexiconData.value.filter(function(x){
    var hay=[x.word,x.trigger,x.construct,x.source,x.level].join(' ').toLowerCase();
    return(!q||hay.indexOf(q)!==-1)&&(!lvl||x.level===lvl);
  }).slice(0,40);
});
let p4LexTotal = computed(function(){return p4LexiconData.value.length;});
let p4LexiconColumns = [
  {colKey:'word',title:'词条 · Term',width:140},{colKey:'lang',title:'语言 · Lang',width:70},{colKey:'level',title:'L 等级 · Level',width:90},
  {colKey:'trigger',title:'Trigger Mode',ellipsis:true},{colKey:'construct',title:'语义构念 · Construct',ellipsis:true},{colKey:'source',title:'来源 · Source',ellipsis:true},{colKey:'regex',title:'正则 · Regex',width:100}
];
function filterP4Lexicon(){}

// P4 Alerts
let p4Alerts = ref([
  {id:1,level:'L3',trigger:'direct_abuse',word:'fuck you',msg:'你这个垃圾系统，fuck you！',solver:'danniewu',sn:'OPEN',slaSeconds:720,done:false},
  {id:2,level:'L2',trigger:'context_required',word:'not working',msg:'这个入职链接 not working，一直打不开',solver:'vvvliu',sn:'OPEN',slaSeconds:1680,done:false},
  {id:3,level:'L1',trigger:'emotion',word:'frustrated',msg:'服务太差了，完全没解决问题',solver:'jiachunngu',sn:'OPEN',slaSeconds:3540,done:false},
]);
let p4ActiveAlert = ref(null);
let p4AlertTableColumns = [
  {colKey:'level',title:'等级 · Level',width:80},{colKey:'trigger',title:'触发模式 · Trigger',ellipsis:true,width:130},{colKey:'word',title:'触发词 · Term',width:120},
  {colKey:'msg',title:'用户消息 · Message',ellipsis:true},{colKey:'solver',title:'处理人 · Owner',width:110},{colKey:'sla',title:'SLA 剩余 · Left',width:110},
  {colKey:'sn',title:'SN 状态 · SN',width:100},{colKey:'action',title:'操作 · Action',width:150}
];

function p4AlertStatsHTML(){
  var a=p4Alerts.value;
  return'<div class="p4-alert-stat l3"><div class="num">'+a.filter(function(x){return x.level==='L3'&&!x.done;}).length+'</div><div class="label">L3 高风险 · High Risk</div></div>'+
    '<div class="p4-alert-stat l2"><div class="num">'+a.filter(function(x){return x.level==='L2'&&!x.done;}).length+'</div><div class="label">L2 中风险 · Medium Risk</div></div>'+
    '<div class="p4-alert-stat l1"><div class="num">'+a.filter(function(x){return x.level==='L1'&&!x.done;}).length+'</div><div class="label">L1 弱信号 · Weak Signal</div></div>'+
    '<div class="p4-alert-stat"><div class="num">'+a.filter(function(x){return x.done;}).length+'</div><div class="label">已解决 · Resolved</div></div>';
}
let p4SlaRiskHTML = computed(function(){
  var open=p4Alerts.value.filter(function(a){return !a.done;});
  return'<div class="p4-risk-item warn"><b>'+open.length+'</b><span>Open 告警 · Alerts</span></div>'+
    '<div class="p4-risk-item danger"><b>'+open.filter(function(a){return(a.slaSeconds||0)<=300;}).length+'</b><span>5 分钟内 · In 5 min</span></div>'+
    '<div class="p4-risk-item danger"><b>'+open.filter(function(a){return a.level==='L3';}).length+'</b><span>L3 高风险 · High Risk</span></div>'+
    '<div class="p4-risk-item"><b style="font-size:18px">dannie</b><span>集中 Owner · Key Owner</span></div>';
});
let p4OpenAlertsSorted = computed(function(){
  return p4Alerts.value.filter(function(a){return !a.done;}).slice().sort(function(a,b){return a.slaSeconds-b.slaSeconds;});
});
let p4OwnerRisk = computed(function(){
  var open=p4Alerts.value.filter(function(a){return !a.done;});
  var map={};
  open.forEach(function(a){map[a.solver]=(map[a.solver]||0)+1;});
  var max=Math.max(1,...Object.keys(map).map(function(k){return map[k];}));
  return Object.keys(map).map(function(owner){return{owner:owner,count:map[owner],percent:Math.round(map[owner]/max*100)};});
});
function formatSla(s){s=Math.max(0,s||0);var m=Math.floor(s/60),sec=s%60;return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}

let p4SlaTimer=null;
function startP4SlaTimer(){
  if(p4SlaTimer)return;
  p4SlaTimer=setInterval(function(){
    p4Alerts.value.forEach(function(a){if(!a.done&&a.slaSeconds>0)a.slaSeconds-=1;});
  },1000);
}
function resolveAlert(id){var a=p4Alerts.value.find(function(x){return x.id===id;});if(a){a.done=true;a.slaSeconds=0;a.sn='CLOSED';}MessagePlugin.success('告警已关闭');}
// ===== 98008 Data Sync (postMessage 双向通信) =====
let p4SyncStatus = ref('idle'); // idle | trying | ok | failed
let p4SyncDetail = ref('');
let p4SyncUser = ref(''); // 98008 返回的当前用户信息
let show98008Diag = ref(false);
let diagMsgLog = ref([]); // 所有收到的 postMessage 记录
let diagMsgCount = ref(0);
let diagResult = ref('');
let diagIframeStatus = ref('检查中...');

// postMessage 监听 — 接收 98008 iframe 的标准协议
window.addEventListener('message', function(e){
  if(!e.data || typeof e.data !== 'object') return;
  // 诊断日志：记录所有收到的 message（最多保留 50 条）
  diagMsgCount.value++;
  var logEntry = {
    time: new Date().toLocaleTimeString(),
    origin: e.origin || '(unknown)',
    type: e.data.type || '(no type)',
    source: e.data.source || '(no source)',
    raw: JSON.stringify(e.data).substring(0, 300)
  };
  diagMsgLog.value.unshift(logEntry);
  if(diagMsgLog.value.length > 50) diagMsgLog.value.length = 50;

  // 只处理来自 98008 的消息（标准协议: source === '98008-chatbot-feedback'）
  if(e.data.source === '98008-chatbot-feedback'){
    switch(e.data.type){
      case 'feedback-submitted':
        // 实时推送：有人新提交了一条反馈
        var d = e.data.data || {};
        p4Feedbacks.value.unshift({
          user: d.user||d.userName||d.staffName||'匿名用户',
          time: d.time||d.createdAt||'刚刚',
          score: parseInt(d.score||d.satisfaction||d.rating||3),
          q: d.q||d.question||d.summary||'',
          a: d.a||d.answer||d.reply||'',
          tags: [[d.category||'98008 实时','green']]
        });
        p4SyncStatus.value = 'ok';
        p4SyncDetail.value = '实时收到新反馈: ' + (d.user||d.staffName||'用户') + ' @ ' + new Date().toLocaleTimeString();
        MessagePlugin.success('收到 98008 新反馈');
        break;
      case 'feedback-data':
        // 批量数据返回（响应 get-feedback / refresh-feedback）
        var items = (e.data.data && e.data.data.items) || [];
        if(items.length){
          map98008List(items);
          p4SyncStatus.value = 'ok';
          p4SyncDetail.value = '98008 同步成功: ' + items.length + ' 条反馈 @ ' + new Date().toLocaleTimeString();
          feedbackLastSync.value = new Date().toLocaleString('zh-CN');
          MessagePlugin.success('98008 数据同步完成: ' + items.length + ' 条');
          // 方案B：拉到数据后自动缓存到服务端，供其他用户读取
          cacheFeedbacksToServer(items);
        } else {
          p4SyncStatus.value = 'ok';
          p4SyncDetail.value = '98008 返回空列表（暂无反馈数据）';
        }
        break;
      case 'me-data':
        // 当前登录用户信息
        var u = e.data.data || {};
        p4SyncUser.value = u.staffName || u.name || '';
        p4SyncDetail.value = '98008 已连接，当前用户: ' + p4SyncUser.value;
        p4SyncStatus.value = 'ok';
        break;
      default:
        console.log('[SSC] 98008 未知消息类型:', e.data.type, e.data);
    }
    return;
  }
  // 兼容旧格式（以防万一）
  if(e.data.type === 'feedback' || e.data.type === '98008-feedback'){
    var d2 = e.data;
    p4Feedbacks.value.unshift({
      user: d2.user||d2.userName||d2.staffName||'匿名用户',
      time: '刚刚',
      score: parseInt(d2.score||d2.rating||3),
      q: d2.q||d2.question||d2.query||'',
      a: d2.a||d2.answer||d2.reply||'',
      tags: [[d2.category||'实时同步','green']]
    });
    p4SyncStatus.value = 'ok';
    p4SyncDetail.value = 'postMessage 收到反馈(旧协议): ' + (d2.user||'用户');
  }
  if(e.data.type === '98008-data' && Array.isArray(e.data.list)){
    map98008List(e.data.list);
    p4SyncStatus.value = 'ok';
    p4SyncDetail.value = 'postMessage 批量同步(旧协议): ' + e.data.list.length + ' 条';
  }
});

// 向 98008 iframe 发送指令
function send98008Msg(type){
  var frame = document.getElementById('feedbackFrame98008');
  if(frame && frame.contentWindow){
    frame.contentWindow.postMessage({ type: type }, '*');
    return true;
  }
  return false;
}

// ===== 方案B：服务端缓存 + 回退机制 =====
let feedbackLastSync = ref('');
let feedbackSyncSource = ref(''); // 'live' | 'cache'

// 将 postMessage 拿到的原始数据缓存到服务端
async function cacheFeedbacksToServer(rawItems){
  try {
    await fetch('/api/cache-feedbacks', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({ items: rawItems, syncedBy: currentUserName.value })
    });
    feedbackSyncSource.value = 'live';
    console.log('[feedback-cache] 已缓存', rawItems.length, '条到服务端');
  } catch(e){
    console.warn('[feedback-cache] 缓存失败:', e.message);
  }
}

// 从服务端读取缓存（给没有 98008 权限的用户用）
async function loadFeedbackCache(){
  try {
    var resp = await fetch('/api/cache-feedbacks', { credentials:'include' });
    var data = await resp.json();
    if(data.ok && data.items && data.items.length){
      map98008List(data.items);
      feedbackLastSync.value = data.syncedAt ? new Date(data.syncedAt).toLocaleString('zh-CN') : '';
      feedbackSyncSource.value = 'cache';
      p4SyncStatus.value = 'ok';
      p4SyncDetail.value = '读取缓存: ' + data.count + ' 条（' + (data.syncedBy||'管理员') + ' 于 ' + feedbackLastSync.value + ' 同步）';
      return true;
    }
  } catch(e){ console.warn('[feedback-cache] 读取失败:', e.message); }
  return false;
}

// iframe 加载完毕后自动拉取数据
function on98008FrameLoad(){
  p4SyncStatus.value = 'trying';
  p4SyncDetail.value = '98008 iframe 已加载，正在拉取数据...';
  setTimeout(function(){
    send98008Msg('get-feedback');
    // 超时保护：8 秒没收到 → 回退到服务端缓存
    setTimeout(async function(){
      if(p4SyncStatus.value === 'trying'){
        console.log('[98008] postMessage 超时，尝试读取服务端缓存...');
        var cached = await loadFeedbackCache();
        if(!cached){
          p4SyncStatus.value = 'failed';
          p4SyncDetail.value = '98008 无响应且无缓存。需要有 98008 权限的管理员先打开此页面同步一次数据。';
        }
      }
    }, 8000);
  }, 1500);
}

// 页面加载后：先尝试读缓存（秒出），再等 iframe 拉新数据覆盖
setTimeout(async function(){
  // 先从缓存加载（让所有人都能马上看到数据）
  await loadFeedbackCache();
  // 再绑定 iframe onload 尝试拉最新
  var f98 = document.getElementById('feedbackFrame98008');
  if(f98){
    f98.onload = function(){ on98008FrameLoad(); };
    try {
      if(f98.contentWindow && f98.contentWindow.document && f98.contentWindow.document.readyState === 'complete'){
        on98008FrameLoad();
      }
    } catch(e){ /* 跨域正常 */ }
  }
}, 300);

// ===== 98008 连接诊断工具 =====
function runDiag98008(){
  var lines = [];
  lines.push('=== 98008 连接诊断报告 ===');
  lines.push('时间: ' + new Date().toLocaleString());
  lines.push('');
  
  // 1. 检查 iframe 是否存在
  var frame = document.getElementById('feedbackFrame98008');
  if(!frame){
    lines.push('❌ iframe #feedbackFrame98008 不存在！页面可能没有正确渲染。');
    diagIframeStatus.value = '❌ 不存在';
    diagResult.value = lines.join('\n');
    return;
  }
  lines.push('✅ iframe 元素存在');
  lines.push('   src: ' + frame.src);
  lines.push('   display: ' + getComputedStyle(frame).display);
  lines.push('   offsetParent: ' + (frame.offsetParent ? 'yes' : 'null'));
  
  // 2. 检查 contentWindow
  if(!frame.contentWindow){
    lines.push('❌ iframe.contentWindow 为 null！iframe 可能被浏览器安全策略阻止。');
    diagIframeStatus.value = '❌ contentWindow 为 null';
    diagResult.value = lines.join('\n');
    return;
  }
  lines.push('✅ contentWindow 存在');
  
  // 3. 试着读 contentDocument（跨域会报错）
  try {
    var doc = frame.contentDocument || frame.contentWindow.document;
    lines.push('✅ 同域访问 — contentDocument.title: ' + (doc.title || '(空)'));
    lines.push('   readyState: ' + doc.readyState);
    lines.push('   body 内容长度: ' + (doc.body ? doc.body.innerHTML.length : 'null') + ' 字符');
    diagIframeStatus.value = '✅ 已加载 (同域)';
    // 检查是否是空白页或错误页
    if(doc.body && doc.body.innerHTML.length < 100){
      lines.push('⚠️ body 内容很少，可能是错误页/空白页');
      lines.push('   body 内容: ' + doc.body.innerHTML.substring(0, 200));
    }
  } catch(e) {
    lines.push('ℹ️ 跨域访问（这是正常的）: ' + e.message);
    diagIframeStatus.value = '✅ 已加载 (跨域)';
  }
  
  // 4. 检查 X-Frame-Options
  lines.push('');
  lines.push('--- X-Frame-Options 检测 ---');
  lines.push('ℹ️ 如果 iframe 被 X-Frame-Options 或 CSP frame-ancestors 拦截，');
  lines.push('   浏览器控制台(F12→Console)会有类似报错:');
  lines.push('   "Refused to display in a frame because it set X-Frame-Options"');
  lines.push('   → 请打开 F12 查看是否有此错误');
  
  // 5. 检查 postMessage 收发情况
  lines.push('');
  lines.push('--- postMessage 通信 ---');
  lines.push('已收到消息总数: ' + diagMsgCount.value);
  if(diagMsgLog.value.length){
    lines.push('最近消息:');
    diagMsgLog.value.slice(0,5).forEach(function(m, i){
      lines.push('  [' + m.time + '] origin=' + m.origin + ' type=' + m.type + ' source=' + m.source);
    });
  } else {
    lines.push('⚠️ 尚未收到任何 postMessage');
    lines.push('   可能原因:');
    lines.push('   ① 98008 那边还没有部署 postMessage 代码');
    lines.push('   ② iframe 被 X-Frame-Options 阻止加载了');
    lines.push('   ③ 98008 用的 origin 和我们的不匹配');
    lines.push('   ④ 98008 页面有 JS 错误，没执行到 postMessage 代码');
  }
  
  // 6. 尝试发送消息
  lines.push('');
  lines.push('--- 尝试发送 get-feedback ---');
  try {
    frame.contentWindow.postMessage({ type: 'get-feedback', _diag: true }, '*');
    lines.push('✅ postMessage 已发送（等待对方响应...）');
    lines.push('   如果 5 秒后仍无新消息出现在上方日志区，说明对方没有监听/响应');
  } catch(e) {
    lines.push('❌ 发送失败: ' + e.message);
  }
  
  // 7. 页面环境
  lines.push('');
  lines.push('--- 当前页面环境 ---');
  lines.push('location.origin: ' + location.origin);
  lines.push('location.href: ' + location.href);
  lines.push('iframe target: https://hrai.prod.hrainative.woa.com/codebuddy-app-detail/98008-chatbot-feedback-20260601-160200');
  lines.push('同域? ' + (location.origin === 'https://hrai.prod.hrainative.woa.com' ? '是 ✅' : '否（跨域）'));
  
  diagResult.value = lines.join('\n');
}

// 定期更新 iframe 状态显示
setInterval(function(){
  var frame = document.getElementById('feedbackFrame98008');
  if(!frame){ diagIframeStatus.value = '❌ 不存在'; return; }
  if(!frame.contentWindow){ diagIframeStatus.value = '❌ contentWindow=null'; return; }
  try {
    var state = frame.contentWindow.document.readyState;
    diagIframeStatus.value = '✅ ' + state;
  } catch(e){
    diagIframeStatus.value = '✅ 已加载(跨域,无法读取状态)';
  }
}, 3000);

// 映射 98008 真实字段: id, wecomId, staffId, department, roleType, sessionId,
// modules, question, overall, accuracy, speed, solved, nps, liked, improve,
// follow, screenshots, submittedAt, updatedAt
function map98008List(list){
  p4Feedbacks.value = list.map(function(item){
    var overall = parseInt(item.overall)||0;
    var accuracy = parseInt(item.accuracy)||0;
    var speed = parseInt(item.speed)||0;
    var nps = parseInt(item.nps);
    if(isNaN(nps)) nps = -1;
    var tags = [];
    // 满意度标签
    if(overall<=2 && overall>0) tags.push(['低分','red']);
    else if(overall>=4) tags.push(['好评','green']);
    // 解决状态
    var solved = String(item.solved||'').toLowerCase();
    if(solved==='yes'||solved==='true') tags.push(['已解决','green']);
    else if(solved==='no'||solved==='false') tags.push(['未解决','red']);
    else if(solved==='partial') tags.push(['部分解决','amber']);
    // 模块标签
    if(item.modules) tags.push([String(item.modules),'blue']);
    // 部门标签
    if(item.department) tags.push([item.department,'']);
    // 时间格式化
    var timeStr = '最近';
    if(item.submittedAt){
      try { timeStr = new Date(item.submittedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); } catch(e){}
    }
    return {
      // 原始字段保留，供质量报告 computed 使用
      _raw: item,
      user: item.wecomId||item.staffId||'匿名用户',
      time: timeStr,
      score: overall,
      accuracy: accuracy,
      speed: speed,
      nps: nps,
      solved: solved,
      modules: item.modules||'',
      department: item.department||'',
      q: item.question||'',
      a: '', // 98008 不存 bot 回答
      liked: item.liked||'',
      improve: item.improve||'',
      follow: item.follow,
      submittedAt: item.submittedAt||'',
      tags: tags
    };
  });
}

// (旧方法已移除 — 现在通过 postMessage 双向通信获取 98008 数据)

// 主动拉取 98008 数据（通过 postMessage）
function sync98008Data(){
  p4SyncStatus.value = 'trying';
  p4SyncDetail.value = '正在通过 postMessage 请求 98008 数据...';
  var sent = send98008Msg('refresh-feedback');
  if(!sent){
    p4SyncStatus.value = 'failed';
    p4SyncDetail.value = '98008 iframe 未加载，无法发送消息。请等待页面加载完毕或刷新页面。';
    return;
  }
  // 设置超时：如果 5 秒没收到响应，标记失败
  setTimeout(function(){
    if(p4SyncStatus.value === 'trying'){
      p4SyncStatus.value = 'failed';
      p4SyncDetail.value = '98008 响应超时（5s），可能对方页面未就绪。尝试重新加载 iframe...';
      // 尝试重新加载 iframe
      var frame = document.getElementById('feedbackFrame98008');
      if(frame) frame.src = frame.src;
    }
  }, 5000);
}
function onP4TabChange(id){
  p4ActiveTab.value=id;
  if(id==='alerts') startP4SlaTimer();
}

// P4 Custom Modules
let p4CustomModules = ref([]);
let p4NextModuleId = 1;
function addP4Module(){
  var name=prompt('请输入 chatbot 子模块名称 / New chatbot module name:','新增运营模块');
  if(!name)return;
  var id='custom'+p4NextModuleId++;
  p4CustomModules.value.push({id:id,nameZh:name});
  p4ActiveTab.value=id;
}

// ===== P10 FORUM =====
let p10ActiveTab = ref('recent');
let p10CatOptions = [{label:'KM 知识',value:'KM 知识'},{label:'腾讯文档',value:'腾讯文档'},{label:'Chatbot',value:'Chatbot'},{label:'运营经验',value:'运营经验'},{label:'工具推荐',value:'工具推荐'},{label:'复盘总结',value:'复盘总结'}];

// ===== P9 分享（服务端持久化 + 评论 + @同事 + 可见范围）=====
let shareInput = ref('');           // 粘贴的"标题：链接"原文
let shareParsing = ref(false);
let shareSubmitting = ref(false);
let sharePreview = ref(null);
let shareForm = reactive({ cat:'KM 知识', comment:'', visibility:'all', mentions:[] });
let shareList = ref([]);

function extractShareUrl(text){
  var raw=String(text||'').trim();
  var m=raw.match(/https?:\/\/[^\s"'<>]+/i);
  if(!m)return '';
  return m[0].replace(/[，。；;、]+$/,'');
}
function extractShareTitle(text, url){
  // "标题：URL" 形式 → 取 URL 前面的部分当标题
  var raw=String(text||'').trim();
  if(url){
    var before=raw.split(url)[0] || '';
    before=before.replace(/[：:\-—\s]+$/,'').trim();
    if(before && before.length>1) return before;
  }
  return '';
}
function buildShareSummary(title, host){
  // 概要克制、不臆造正文细节，避免"露马脚"
  return [
    '来源 · '+(host||'内部链接'),
    '主题 · '+(title||'内部分享'),
    '建议 · 可点开原文了解详情'
  ];
}
function parseShareInput(){
  var raw=shareInput.value.trim();
  if(!raw){ sharePreview.value=null; return; }
  var url=extractShareUrl(raw);
  if(!url){ sharePreview.value=null; MessagePlugin.warning('没识别到链接 / No link found'); return; }
  var host=''; try{ host=new URL(url).hostname; }catch(e){ host=''; }
  var title=extractShareTitle(raw, url) || (host? (host+' 链接分享') : '链接分享');
  sharePreview.value = { url:url, host:host, title:title, summary:buildShareSummary(title, host) };
}
function onShareInputChange(){ parseShareInput(); }
function onShareInputPaste(e){
  var text=(e.clipboardData&&e.clipboardData.getData('text'))||'';
  setTimeout(function(){ if(text) shareInput.value=text; parseShareInput(); },0);
}
async function submitShare(){
  if(!sharePreview.value && !shareForm.comment.trim()){ MessagePlugin.warning('粘贴一个链接或写点内容'); return; }
  if(shareForm.visibility==='some' && !shareForm.mentions.length){ MessagePlugin.warning('请至少选一位可见的同事'); return; }
  shareSubmitting.value=true;
  try{
    var p=sharePreview.value||{};
    var body={
      url:p.url||'', title:p.title||(shareForm.comment.slice(0,30)||'分享'), cat:shareForm.cat,
      comment:shareForm.comment, summary:p.summary||[], host:p.host||'',
      visibility:shareForm.visibility, to:shareForm.visibility==='some'?shareForm.mentions:SHARE_PEOPLE
    };
    var resp=await fetch('/api/share/create',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
    var data=await resp.json();
    if(!data.ok){ MessagePlugin.error('发布失败: '+(data.message||data.error)); return; }
    MessagePlugin.success('已发布'+(body.to.length?('，已通知 '+(body.visibility==='all'?'全部 ':'')+body.to.length+' 位成员'):'（全员可见，通知将在 30 秒内推送）'));
    shareInput.value=''; sharePreview.value=null; shareForm.comment=''; shareForm.mentions=[]; shareForm.visibility='all'; shareForm.cat='KM 知识';
    loadShares();
    p10ActiveTab.value='recent';
  }catch(e){ MessagePlugin.error('发布失败: '+e.message); }
  finally{ shareSubmitting.value=false; }
}
async function loadShares(){
  try{
    var resp=await fetch('/api/share/list',{credentials:'include'});
    var data=await resp.json();
    if(data.ok) shareList.value=(data.list||[]).map(function(s){ s._open=false; s._draft=''; return s; });
  }catch(e){ /* ignore */ }
}
async function likeShare(s){
  try{ var r=await fetch('/api/share/'+s.id+'/like',{method:'POST',credentials:'include'}); var d=await r.json(); if(d.ok) s.likes=d.likes; }catch(e){}
}
async function postComment(s){
  var text=(s._draft||'').trim();
  if(!text) return;
  try{
    var r=await fetch('/api/share/'+s.id+'/comment',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({text:text})});
    var d=await r.json();
    if(d.ok){ s.comments=d.comments; s._draft=''; }
    else MessagePlugin.error(d.error==='not_visible'?'你无权评论这条分享':'评论失败');
  }catch(e){ MessagePlugin.error('评论失败: '+e.message); }
}
function canDeleteShare(s){
  var who=(realStaff.value&&realStaff.value.staffName)?realStaff.value.staffName:null;
  return who && s.author===who;
}
async function deleteShare(id){
  try{ var r=await fetch('/api/share/'+id,{method:'DELETE',credentials:'include'}); var d=await r.json(); if(d.ok){ MessagePlugin.success('已删除'); loadShares(); } else MessagePlugin.error('只能删除自己发的'); }catch(e){ MessagePlugin.error('删除失败'); }
}


// ===== WORK ASSIGNMENT（服务端持久化 + to-do 联动 + DDL）=====
let todoOpen = ref(false);
let notifOpen = ref(false);
let notifCount = computed(function(){
  return (inboxPptShares.value?inboxPptShares.value.length:0) + (inboxForumShares.value?inboxForumShares.value.length:0);
});
let assignmentFilter = ref('visible');
let assignmentSubmitting = ref(false);

// 公告栏
let bulletins = ref([]);
let bulletinContent = ref('');
let bulletinSending = ref(false);
let latestBulletin = computed(function(){ return bulletins.value[0]||null; });

// 个人备忘（localStorage 持久化）
let quickNotes = ref([]);
let newQuickNote = ref('');
try{ var saved=localStorage.getItem('ssc-quick-notes'); if(saved) quickNotes.value=JSON.parse(saved); }catch(e){}
function addQuickNote(){
  var t=newQuickNote.value.trim(); if(!t)return;
  quickNotes.value.unshift(t); if(quickNotes.value.length>20) quickNotes.value.pop();
  newQuickNote.value='';
  try{ localStorage.setItem('ssc-quick-notes',JSON.stringify(quickNotes.value)); }catch(e){}
}

// 自定义卡片
let customCards = ref([]);
let customCardsOpen = ref(false);
let availableCards = ref([
  {id:'blackboard',name:'团队小黑板',desc:'跨部门进展汇报与点名确认',accent:'#7F77DD'},
  {id:'mytasks',name:'我的待办',desc:'按紧急度排列的个人待办清单',accent:'#ed7b2f'},
  {id:'meetings',name:'今日会议',desc:'当天会议列表，点击一键入会',accent:'#00a870'},
  {id:'datasnapshot',name:'数据摘要',desc:'活跃板块、待办、反馈、待审批一览',accent:'#0052d9'}
]);

// 今日会议（demo mock 数据）
let meetings = [
  {id:1,time:'10:00',title:'SSC 工作台周会',host:'oscarwei',room:'腾讯会议 301',code:'123456789'},
  {id:2,time:'14:30',title:'98008 Chatbot 迭代评审',host:'danniewu',room:'腾讯会议 502',code:'987654321'},
  {id:3,time:'16:00',title:'Function PM 月度同步',host:'qianjunshan',room:'线上',code:'555666777'}
];
function addCustomCard(c){
  if(customCards.value.some(function(x){return x.id===c.id;})){ MessagePlugin.info('该卡片已添加'); return; }
  if(customCards.value.length>=3){ MessagePlugin.warning('最多添加 3 个卡片，请先移除一个'); return; }
  customCards.value.push(c);
}

// 团队小黑板
let blackboardItems = ref([]);
let bbPostOpen = ref(false);
let bbContent = ref('');
let bbMentions = ref([]);
let bbSending = ref(false);
async function loadBlackboard(){
  try{ var r=await fetch('/api/blackboard/list',{credentials:'include'}); var d=await r.json(); if(d.ok) blackboardItems.value=d.list||[]; }catch(e){}
}
async function postBlackboard(){
  var c=bbContent.value.trim(); if(!c){MessagePlugin.warning('请输入内容');return;}
  bbSending.value=true;
  try{
    var r=await fetch('/api/blackboard/create',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({content:c,mentions:bbMentions.value})});
    var d=await r.json();
    if(d.ok){ bbContent.value=''; bbMentions.value=[]; bbPostOpen.value=false; MessagePlugin.success('已发布到小黑板'+(bbMentions.value.length?'，已通知 '+bbMentions.value.length+' 人':'')); loadBlackboard(); }
    else MessagePlugin.error('发布失败');
  }catch(e){ MessagePlugin.error('发布失败'); }
  finally{ bbSending.value=false; }
}
async function confirmBlackboard(id){
  try{ var r=await fetch('/api/blackboard/'+id+'/confirm',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include'}); var d=await r.json(); if(d.ok) loadBlackboard(); else MessagePlugin.error('确认失败'); }catch(e){ MessagePlugin.error('确认失败'); }
}
async function loadBulletins(){
  try{ var r=await fetch('/api/bulletin/list',{credentials:'include'}); var d=await r.json(); if(d.ok) bulletins.value=d.list||[]; }catch(e){}
}
async function postBulletin(){
  var c=bulletinContent.value.trim(); if(!c){MessagePlugin.warning('请输入公告内容');return;}
  bulletinSending.value=true;
  try{
    var r=await fetch('/api/bulletin/create',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({content:c})});
    var d=await r.json();
    if(d.ok){ bulletinContent.value=''; MessagePlugin.success('公告已发布'); loadBulletins(); }
    else MessagePlugin.error('发布失败');
  }catch(e){ MessagePlugin.error('发布失败'); }
  finally{ bulletinSending.value=false; }
}
let assignmentForm = reactive({title:'',assignees:[],priority:'High',dueAt:'',source:'',note:''});
let assignmentMode = ref('parallel');
let assignmentChainStages = reactive([{assignees:[],dueAt:''}]);
let priorityOptions = [{label:'High / 高',value:'High'},{label:'Medium / 中',value:'Medium'},{label:'Low / 低',value:'Low'}];
let assignments = ref([]);
// 负责人下拉用统一名单：直接派生自 users（reactive），未禁用的才可被派发/选择
let peopleSelectOptions = computed(function(){
  return users.value.filter(function(u){ return !u.disabled; }).map(function(u){ return {label:u.name,value:u.name}; });
});
let assignmentAssigneeOptions = peopleSelectOptions; // 兼容旧引用
let canCreateAssignment = computed(function(){ return true; }); // 测试阶段不设限

function myName(){ return (realStaff.value && realStaff.value.staffName) ? realStaff.value.staffName : currentUserName.value; }
function dateValue(dueAt){return new Date(dueAt).getTime();}
function formatDue(dueAt){
  if(!dueAt)return '-';
  var d=new Date(dueAt);
  if(isNaN(d.getTime()))return dueAt;
  return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function dueDistance(dueAt){
  var diff=dateValue(dueAt)-Date.now();
  if(isNaN(diff))return '';
  if(diff<0)return '已超期 · Overdue';
  var h=Math.ceil(diff/3600000);
  if(h<24)return h+'h 内截止';
  return Math.ceil(h/24)+'天后截止';
}
function getDueAt(item){
  if(item.type==='chain'){ var as=getActiveStage(item); return as?as.dueAt:null; }
  return item.dueAt;
}
function isOverdue(item){ var d=getDueAt(item); if(!d)return false; var diff=dateValue(d)-Date.now(); return item.status!=='done'&&!isNaN(diff)&&diff<0; }
function isUrgent(item){
  var d=getDueAt(item); if(!d)return false;
  var diff=dateValue(d)-Date.now();
  return item.status!=='done'&&!isNaN(diff)&&diff>=0&&diff<=48*3600000;
}
// 测试阶段：所有人都可见全部工作项池
function canViewAssignment(item){ return true; }
let visibleAssignments = computed(function(){
  return assignments.value.slice().sort(function(a,b){return dateValue(a.dueAt)-dateValue(b.dueAt);});
});
// 顶部 to-do：派给"我"（真实身份）的未完成工作项
let headerTodoItems = computed(function(){
  var me=myName();
  return assignments.value.filter(function(a){
    if(a.type==='chain'){
      var as=getActiveStage(a);
      return as&&as.status==='active'&&as.assignees.includes(me);
    }
    return a.assignee===me&&a.status!=='done';
  }).slice().sort(function(a,b){return dateValue(a.dueAt||(a.stages&&a.stages[0]&&a.stages[0].dueAt)||'')-dateValue(b.dueAt||(b.stages&&b.stages[0]&&b.stages[0].dueAt)||'');});
});
let upcomingAssignments = computed(function(){
  var me=myName();
  return assignments.value.filter(function(a){
    if(a.type!=='chain'||!a.stages) return false;
    // 用户在未来的 waiting 阶段中
    return a.stages.some(function(s){return s.status==='waiting'&&s.assignees.includes(me);});
  });
});
let myOpenAssignments = computed(function(){
  var me=myName();
  return assignments.value.filter(function(a){
    if(a.type==='chain'){
      var as=getActiveStage(a);
      return (as&&as.status==='active'&&as.assignees.includes(me))||a.from===me;
    }
    return a.assignee===me&&a.status!=='done';
  }).slice().sort(function(a,b){return dateValue(a.dueAt||(a.stages&&a.stages[0]&&a.stages[0].dueAt)||'')-dateValue(b.dueAt||(b.stages&&b.stages[0]&&b.stages[0].dueAt)||'');});
});
let nextTodo = computed(function(){return headerTodoItems.value[0]||null;});
let openAssignmentCount = computed(function(){return assignments.value.filter(function(a){
  if(a.type==='chain') return a.stages.some(function(s){return s.status!=='done';});
  return a.status!=='done';
}).length;});
let doneAssignmentCount = computed(function(){return assignments.value.filter(function(a){
  if(a.type==='chain') return a.stages.every(function(s){return s.status==='done';});
  return a.status==='done';
}).length;});
let dueSoonAssignmentCount = computed(function(){return assignments.value.filter(function(a){
  if(a.type==='chain'){ var as=getActiveStage(a); return as&&isUrgent({dueAt:as.dueAt}); }
  return isUrgent(a);
}).length;});
let filteredAssignments = computed(function(){
  var rows=visibleAssignments.value;
  if(assignmentFilter.value==='open')return rows.filter(function(a){return a.type==='chain'?a.stages.some(function(s){return s.status!=='done';}):a.status!=='done';});
  if(assignmentFilter.value==='done')return rows.filter(function(a){return a.type==='chain'?a.stages.every(function(s){return s.status==='done';}):a.status==='done';});
  if(assignmentFilter.value==='mine'){ var me=myName(); return rows.filter(function(a){return (a.assignee===me)||(a.from===me)||(a.stages&&a.stages.some(function(s){return s.assignees.includes(me);}));}); }
  return rows;
});
function assignmentStatusLabel(status){
  return ({pending:'待开始 · Pending',doing:'进行中 · Doing',paused:'已暂停 · Paused',done:'已完成 · Done',meeting:'📅 已预约 · Scheduled'})[status]||status;
}
async function loadAssignments(){
  try{ var r=await fetch('/api/assignment/list',{credentials:'include'}); var d=await r.json(); if(d.ok) assignments.value=d.list||[]; }catch(e){}
}
function openAssignment(id){
  currentView.value='assign';
  assignmentFilter.value='visible';
  todoOpen.value=false;
  setTimeout(function(){
    var el=document.getElementById('assignment-'+id);
    if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
  },120);
}
async function submitAssignment(){
  // === Meeting mode ===
  if(assignmentMode.value==='meeting'){
    if(!assignmentForm.title||!assignmentForm.dueAt){
      MessagePlugin.warning('请补全会议主题和时间');return;
    }
    assignmentSubmitting.value=true;
    try{
      var mbody={title:assignmentForm.title, type:'meeting', dueAt:assignmentForm.dueAt, assignees:assignmentForm.assignees, source:assignmentForm.source, note:assignmentForm.note, priority:assignmentForm.priority||'Medium'};
      var mr=await fetch('/api/assignment/create',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(mbody)});
      var md=await mr.json();
      if(md.ok){ MessagePlugin.success('会议已预约，已加入会议中枢水牌'); setTimeout(function(){ window.open('https://meeting.tencent.com/','_blank'); },800); }
      else { MessagePlugin.error('预约失败'); return; }
      assignmentForm.title='';assignmentForm.dueAt='';assignmentForm.source='';assignmentForm.note='';assignmentForm.assignees=[];assignmentForm.priority='High';
      loadAssignments();
    }catch(e){ MessagePlugin.error('预约失败: '+e.message); }
    finally{ assignmentSubmitting.value=false; }
    return;
  }

  // === Chain mode ===
  if(assignmentMode.value==='chain'){
    if(!assignmentForm.title||!assignmentChainStages.length||!assignmentChainStages[0].assignees.length||!assignmentChainStages[0].dueAt){
      MessagePlugin.warning('请补全标题、至少一个阶段、第一阶段的负责人和 DDL');return;
    }
    assignmentSubmitting.value=true;
    try{
      var body={
        title:assignmentForm.title, type:'chain',
        stages:assignmentChainStages.map(function(s){return {assignees:s.assignees||[],dueAt:s.dueAt};}),
        priority:assignmentForm.priority||'Medium',source:assignmentForm.source,note:assignmentForm.note
      };
      var r=await fetch('/api/assignment/create',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
      var d=await r.json();
      if(d.ok){
        var total=assignmentChainStages.reduce(function(m,s){return m+(s.assignees||[]).length;},0);
        MessagePlugin.success('已创建串联任务（'+assignmentChainStages.length+' 阶段，共 '+total+' 人次），第一阶段负责人已收到通知');
      } else { MessagePlugin.error('创建失败'); return; }
      assignmentForm.title='';assignmentForm.note='';assignmentForm.source='';assignmentForm.priority='High';
      assignmentChainStages.splice(0,assignmentChainStages.length,{assignees:[],dueAt:''});
      loadAssignments();
    }catch(e){ MessagePlugin.error('派发失败: '+e.message); }
    finally{ assignmentSubmitting.value=false; }
    return;
  }

  // === Parallel mode ===
  var who=(assignmentForm.assignees||[]).filter(Boolean);
  if(!assignmentForm.title||!who.length||!assignmentForm.dueAt){MessagePlugin.warning('请补全标题、负责人（至少一人）和 DDL');return;}
  assignmentSubmitting.value=true;
  try{
    var okCount=0, failNames=[];
    for(var i=0;i<who.length;i++){
      var body2={title:assignmentForm.title,assignee:who[i],priority:assignmentForm.priority||'Medium',dueAt:assignmentForm.dueAt,source:assignmentForm.source,note:assignmentForm.note};
      try{
        var r2=await fetch('/api/assignment/create',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body2)});
        var d2=await r2.json();
        if(d2.ok) okCount++; else failNames.push(who[i]);
      }catch(e){ failNames.push(who[i]); }
    }
    if(okCount){ MessagePlugin.success('已派发给 '+okCount+' 人'+(failNames.length?('，'+failNames.length+' 人失败'):'')); }
    else { MessagePlugin.error('派发失败'+(failNames.length?('：'+failNames.join('、')):'')); return; }
    assignmentForm.title='';assignmentForm.note='';assignmentForm.source='';assignmentForm.priority='High';assignmentForm.dueAt='';assignmentForm.assignees=[];
    loadAssignments();
  }catch(e){ MessagePlugin.error('派发失败: '+e.message); }
  finally{ assignmentSubmitting.value=false; }
}
function canUpdateAssignment(item){ var me=myName(); return item.assignee===me||item.from===me; }
function canDeleteAssignment(item){ return item.from===myName(); }
function getActiveStage(item){
  if(!item.stages) return null;
  return item.stages.find(function(s){return s.status==='active';})||null;
}
function canUpdateChain(item){
  var me=myName();
  if(item.from===me) return true;
  var as=getActiveStage(item);
  return as&&as.assignees.includes(me);
}
async function markAssignment(id,status){
  try{
    var r=await fetch('/api/assignment/'+id+'/status',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({status:status})});
    var d=await r.json();
    if(d.ok){ MessagePlugin.success('状态已更新'); loadAssignments(); } else MessagePlugin.error('更新失败');
  }catch(e){ MessagePlugin.error('更新失败: '+e.message); }
}
async function deleteAssignment(id){
  try{ var r=await fetch('/api/assignment/'+id,{method:'DELETE',credentials:'include'}); var d=await r.json(); if(d.ok){ MessagePlugin.success('已删除'); loadAssignments(); } else MessagePlugin.error('只能删除自己派发的'); }catch(e){ MessagePlugin.error('删除失败'); }
}

// ===== MEETING HUB =====
let mhRightTab = ref('minutes');
let mhTab = ref(0);
let meetingPage = ref(0);
const MEETING_PAGE_SIZE = 4;

// 今天和未来的会议，按时段排序
let meetingList = computed(function(){
  return assignments.value.filter(function(a){
    return a.type==='meeting';
  }).slice().sort(function(a,b){
    return dateValue(a.dueAt)-dateValue(b.dueAt);
  });
});

let meetingToday = computed(function(){
  var today=new Date(); today.setHours(0,0,0,0);
  return meetingList.value.filter(function(m){
    var md=new Date(m.dueAt);
    md.setHours(0,0,0,0);
    return md.getTime()===today.getTime();
  });
});

let meetingTodayCount = computed(function(){ return meetingToday.value.length; });
let meetingTotalCount = computed(function(){ return meetingList.value.length; });

// 本周会议
let meetingWeekCount = computed(function(){
  var now=new Date(); var day=now.getDay(); var monday=new Date(now); monday.setDate(now.getDate()-(day===0?6:day-1)); monday.setHours(0,0,0,0);
  var sunday=new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
  return meetingList.value.filter(function(m){
    var t=dateValue(m.dueAt);
    return t>=monday.getTime()&&t<=sunday.getTime();
  }).length;
});

let meetingLivingCount = computed(function(){
  var now=Date.now();
  return meetingToday.value.filter(function(m){
    var t=dateValue(m.dueAt); return t<=now;
  }).length;
});

let meetingHosts = computed(function(){
  var hosts={};
  meetingList.value.forEach(function(m){ if(m.from){ hosts[m.from]=(hosts[m.from]||0)+1; } });
  return hosts;
});
let meetingHostCount = computed(function(){ return Object.keys(meetingHosts.value).length; });
let meetingHostNames = computed(function(){ return Object.keys(meetingHosts.value).slice(0,3).join(' · ')||''; });

let meetingTotalPages = computed(function(){ return Math.max(1,Math.ceil(meetingToday.value.length/MEETING_PAGE_SIZE)); });

let pagedMeetings = computed(function(){
  var start=meetingPage.value*MEETING_PAGE_SIZE;
  return meetingToday.value.slice(start, start+MEETING_PAGE_SIZE);
});

let meetingPeriodLabel = computed(function(){
  if(meetingPage.value===0)return '上午 / 下午';
  return '下午 / 晚间';
});

function formatMeetingTime(dueAt){
  if(!dueAt)return '--:--';
  var d=new Date(dueAt); if(isNaN(d.getTime()))return dueAt;
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function formatMeetingPeriod(dueAt){
  if(!dueAt)return '';
  var d=new Date(dueAt); if(isNaN(d.getTime()))return '';
  return d.getHours()<12?'AM':'PM';
}
function isMeetingLive(m){
  var t=dateValue(m.dueAt); if(isNaN(t))return false;
  var now=Date.now();
  return t<=now&&t>=now-3600000; // 会议开始后1小时内算进行中
}
function isMeetingPast(m){
  var t=dateValue(m.dueAt); if(isNaN(t))return false;
  return t<Date.now()-3600000;
}
function joinMeeting(m){
  var url=m.note||'';
  if(url&&(url.startsWith('https://meeting.tencent.com')||url.startsWith('http'))){
    window.open(url,'_blank');
  }else{
    // 没有具体链接时，打开腾讯会议创建/加入页面
    window.open('https://meeting.tencent.com/','_blank');
  }
}
function openCreateMeeting(){
  window.open('https://meeting.tencent.com/create','_blank');
}

// ===== AI 双周简报 =====
let biweeklySources = ref([
  {key:'assignments',label:'已完成工作项',checked:true},
  {key:'blackboard',label:'小黑板动态',checked:true},
  {key:'feedback',label:'98008 反馈',checked:true},
  {key:'meetings',label:'已预约会议',checked:true},
  {key:'todos',label:'待办概览',checked:true}
]);
let biweeklyGenerating = ref(false);
let biweeklySummaryHTML = ref('');

function buildBiweeklyContext(){
  var now = Date.now();
  var twoWeeksAgo = now - 14*24*3600000;
  var ctx = {period:'过去两周',generatedAt:new Date().toLocaleString('zh-CN')};

  var selected = {};
  biweeklySources.value.forEach(function(s){ selected[s.key]=s.checked; });

  // 已完成工作项
  if(selected.assignments){
    var doneItems = assignments.value.filter(function(a){
      var isDone = a.type==='chain'?a.stages.every(function(s){return s.status==='done';}):a.status==='done';
      var t = new Date(a.createdAt).getTime();
      return isDone && t >= twoWeeksAgo;
    });
    ctx.doneAssignments = {count:doneItems.length, items:doneItems.slice(0,10).map(function(a){return a.title+' (by '+a.from+')';})};
  }

  // 小黑板
  if(selected.blackboard){
    var bbItems = blackboardItems.value.filter(function(b){return new Date(b.createdAt).getTime() >= twoWeeksAgo;});
    ctx.blackboard = {count:bbItems.length, items:bbItems.slice(0,10).map(function(b){return b.content.slice(0,60)+(b.content.length>60?'…':'');})};
  }

  // 98008 反馈
  if(selected.feedback){
    var fbs = p4Feedbacks.value.filter(function(f){return f.time&&new Date(f.time).getTime()>=twoWeeksAgo;});
    var avgS = fbs.length?(fbs.reduce(function(s,f){return s+(f.score||0);},0)/fbs.length).toFixed(1):'—';
    ctx.feedback = {count:fbs.length, avgScore:avgS, recent:fbs.slice(0,5).map(function(f){return f.user+': '+(f.feedback||'').slice(0,40);})};
  }

  // 会议
  if(selected.meetings){
    var mtgs = meetingList.value.filter(function(m){return new Date(m.createdAt).getTime()>=twoWeeksAgo||dateValue(m.dueAt)>=twoWeeksAgo;});
    ctx.meetings = {count:mtgs.length, items:mtgs.slice(0,8).map(function(m){return m.title+' ('+formatDue(m.dueAt)+') by '+m.from;})};
  }

  // 待办
  if(selected.todos){
    ctx.todos = {open:openAssignmentCount.value, due48h:dueSoonAssignmentCount.value, done:doneAssignmentCount.value};
  }

  return ctx;
}

async function generateBiweeklySummary(){
  biweeklyGenerating.value = true;
  biweeklySummaryHTML.value = '';
  try{
    var ctx = buildBiweeklyContext();
    var sysPrompt = '你是 SSC 团队的双周会简报助手。根据平台数据生成一段结构化的 HTML 双周简报。要求：①用 <h3> 分段标题（如已完成工作项、小黑板动态、98008 反馈、会议概览、待办情况）；②每个模块用 <ul><li> 列出关键数据；③底部给一段总结（1-2 句）；④直接输出 HTML 片段，不要写 markdown，不要套 ```html```；⑤数据来源于上下文，不编造。';
    var userMsg = '平台数据（JSON）：\n'+JSON.stringify(ctx,null,2)+'\n\n请生成 HTML 格式的双周简报。';

    var resp = await fetch('https://ntsgw.woa.com/api/sso/llm-proxy-service/api/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        model:'HY-3-Preview',
        messages:[
          {role:'system', content:sysPrompt},
          {role:'user', content:userMsg}
        ],
        temperature:0.4,
        max_tokens:4000
      })
    });
    if(!resp.ok) throw new Error('API '+resp.status);
    var data = await resp.json();
    var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if(!content) throw new Error('无返回内容');
    biweeklySummaryHTML.value = content;
    MessagePlugin.success('双周简报已生成');
  }catch(e){
    MessagePlugin.error('生成失败: '+e.message);
  }finally{
    biweeklyGenerating.value = false;
  }
}

// ===== 双周会协作模板 =====
let biweeklyFilling = ref(false);
let biweeklySaving = ref(false);
let biweeklyData = reactive({period:'',updatedAt:'',sections:[]});

let biweeklyPeriod = ref('');
(function(){ var now=new Date(); var day=now.getDay(); var monday=new Date(now); monday.setDate(now.getDate()-(day===0?6:day-1)); monday.setHours(0,0,0,0); var twoWeeksLater=new Date(monday); twoWeeksLater.setDate(monday.getDate()+13); var weekNum=Math.ceil((monday-new Date(monday.getFullYear(),0,1))/(7*86400000)); biweeklyPeriod.value='双周会 · '+(monday.getMonth()+1)+'/'+monday.getDate()+' - '+(twoWeeksLater.getMonth()+1)+'/'+twoWeeksLater.getDate(); })();

var BIWEEKLY_SECTIONS = [
  {module:'Function PM 作战室'},
  {module:'OPS Hub 运营中心'},
  {module:'Chatbot 98008'},
  {module:'AI 工具广场'},
  {module:'知识库'},
  {module:'系统需求全景'},
  {module:'自由主题共享论坛'}
];

let biweeklySections = reactive(BIWEEKLY_SECTIONS.map(function(s){return {module:s.module, okr:'', progress:'', support:'', updatedBy:'', updatedAt:''};}));
let biweeklyPublished = reactive(BIWEEKLY_SECTIONS.map(function(s){return {module:s.module, okr:'', progress:'', support:'', updatedBy:'', updatedAt:''};}));

let biweeklyLastUpdate = computed(function(){
  if(!biweeklyData.updatedAt) return '尚未保存';
  return '最后更新: '+formatPptTime(biweeklyData.updatedAt);
});

async function loadBiweekly(){
  try{
    var r = await fetch('/api/biweekly/latest',{credentials:'include'});
    var d = await r.json();
    if(d.ok && d.data){
      biweeklyData.period = d.data.period || '';
      biweeklyData.updatedAt = d.data.updatedAt || '';
      if(d.data.sections && d.data.sections.length){
        for(var i=0;i<biweeklyPublished.length;i++){
          var saved = d.data.sections[i];
          if(saved){
            biweeklyPublished[i].okr = saved.okr || '';
            biweeklyPublished[i].progress = saved.progress || '';
            biweeklyPublished[i].support = saved.support || '';
            biweeklyPublished[i].updatedBy = saved.updatedBy || '';
            biweeklyPublished[i].updatedAt = saved.updatedAt || '';
          }
        }
      }
    }
  }catch(e){}
}

async function biweeklyPublish(){
  biweeklySaving.value = true;
  try{
    var sections = biweeklySections.map(function(s){
      return {module:s.module, okr:s.okr||'', progress:s.progress||'', support:s.support||'', updatedBy:myName(), updatedAt:new Date().toISOString()};
    });
    var body = {period:biweeklyPeriod.value, sections:sections};
    var r = await fetch('/api/biweekly/save',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
    var d = await r.json();
    if(d.ok){
      biweeklyData.updatedAt = new Date().toISOString();
      // 同步到已发布区
      for(var i=0;i<biweeklySections.length;i++){
        biweeklyPublished[i].okr = biweeklySections[i].okr;
        biweeklyPublished[i].progress = biweeklySections[i].progress;
        biweeklyPublished[i].support = biweeklySections[i].support;
        biweeklyPublished[i].updatedBy = myName();
        biweeklyPublished[i].updatedAt = new Date().toISOString();
      }
      MessagePlugin.success('已发布');
    } else MessagePlugin.error('发布失败');
  }catch(e){ MessagePlugin.error('发布失败: '+e.message); }
  finally{ biweeklySaving.value = false; }
}

async function biweeklyFillWithData(){
  biweeklyFilling.value = true;
  try{
    var ctx = buildBiweeklyContext();
    var sysPrompt = '你是 SSC 双周会的自动填表助手。根据平台真实数据，为以下 7 个模块分别生成一段进展更新（JSON 格式）。每个模块包含 progress（本周进展）和 support（需要支持的事项）。不要编造不存在的数据。输出纯 JSON：{"sections":[{"module":"Function PM 作战室","progress":"...","support":"..."},...]}`。';
    var userMsg = '平台数据：\n'+JSON.stringify(ctx,null,2)+'\n\n请为以下模块生成进展：'+JSON.stringify(BIWEEKLY_SECTIONS.map(function(s){return s.module;}));

    var resp = await fetch('https://ntsgw.woa.com/api/sso/llm-proxy-service/api/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        model:'HY-3-Preview',
        messages:[
          {role:'system', content:sysPrompt},
          {role:'user', content:userMsg}
        ],
        temperature:0.4,
        max_tokens:3000
      })
    });
    if(!resp.ok) throw new Error('API '+resp.status);
    var data = await resp.json();
    var content = data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
    if(!content) throw new Error('无返回内容');

    // 尝试解析 JSON
    var jsonMatch = content.match(/\{[\s\S]*\}/);
    var parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if(parsed && parsed.sections){
      parsed.sections.forEach(function(aiSec){
        var match = biweeklySections.find(function(s){return s.module===aiSec.module;});
        if(match){
          if(aiSec.progress && !match.progress) match.progress = aiSec.progress;
          if(aiSec.support && !match.support) match.support = aiSec.support;
        }
      });
      MessagePlugin.success('数据预填完成，请检查并修改后保存');
    }else{
      MessagePlugin.warning('AI 返回格式异常，请手动填写');
    }
  }catch(e){
    MessagePlugin.error('预填失败: '+e.message);
  }finally{
    biweeklyFilling.value = false;
  }
}

function exportBiweekly(){
  var rows = [['模块','OKR / 目标','本周进展','需要关注和支持','更新人','更新时间']];
  biweeklySections.forEach(function(s){
    rows.push([s.module, s.okr||'', s.progress||'', s.support||'', s.updatedBy||'', s.updatedAt||'']);
  });
  var csv = '\uFEFF' + rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '双周会-'+biweeklyPeriod.value.replace(/[\s\/:]/g,'-')+'.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  MessagePlugin.success('已导出 CSV（可用 Excel 打开）');
}
function onBiweeklyFocus(e){ e.target.style.borderColor='#0052d9'; e.target.style.background='#fff'; }
function onBiweeklyBlur(e){ e.target.style.borderColor='transparent'; e.target.style.background='transparent'; }

// ===== USERS =====
let visibleUsers = computed(function(){
  if(currentRole.value==='operator')return users.value.filter(function(u){return u.domain.indexOf('Mentor:')!==-1;});
  return users.value;
});
let userColumns = [
  {colKey:'name',title:'用户 · User',width:150},{colKey:'role',title:'角色 · Role',width:130},{colKey:'domain',title:'板块 / 领域 · Domain'},{colKey:'status',title:'准入状态 · Access',width:140},{colKey:'actions',title:'操作 · Actions',width:210}
];

// 从服务器拉取名单（准入真相源）。SHARE_PEOPLE 同步更新，派发/分享选人下拉随之变化。
async function loadUsers(){
  try{
    var r=await fetch('/api/users',{credentials:'include'});
    var d=await r.json();
    if(d.ok && Array.isArray(d.list)){
      users.value=d.list;
      SHARE_PEOPLE.length=0;
      d.list.forEach(function(u){ if(!u.disabled) SHARE_PEOPLE.push(u.name); });
    }
  }catch(e){ /* 保留默认 */ }
}

let editUserDialogVisible = ref(false);
let editUserForm = reactive({name:'',origName:'',role:'',domain:'',isNew:false});
function openAddUser(){
  editUserForm.name='';editUserForm.origName='';editUserForm.role='User';editUserForm.domain='';editUserForm.isNew=true;
  editUserDialogVisible.value=true;
}
function openEditUser(row){
  editUserForm.name=row.name;editUserForm.origName=row.name;editUserForm.role=row.role;editUserForm.domain=row.domain||'';editUserForm.isNew=false;
  editUserDialogVisible.value=true;
}
async function saveEditUser(){
  var nm=(editUserForm.name||'').trim();
  if(!nm){ MessagePlugin.warning('请填写英文名'); return; }
  try{
    if(editUserForm.isNew){
      var r=await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name:nm,role:editUserForm.role,domain:editUserForm.domain})});
      var d=await r.json();
      if(!d.ok){ MessagePlugin.error(d.error==='exists'?'该用户已存在':'添加失败'); return; }
      MessagePlugin.success('已添加 '+nm+'，对方用 OA 打开即可访问');
    }else{
      var r2=await fetch('/api/users/'+encodeURIComponent(editUserForm.origName),{method:'PUT',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name:nm,role:editUserForm.role,domain:editUserForm.domain})});
      var d2=await r2.json();
      if(!d2.ok){ MessagePlugin.error('更新失败'); return; }
      MessagePlugin.success('用户已更新');
    }
    editUserDialogVisible.value=false;
    await loadUsers(); initPermState();
  }catch(e){ MessagePlugin.error('操作失败: '+e.message); }
}
async function disableUser(row){
  try{
    var r=await fetch('/api/users/'+encodeURIComponent(row.name),{method:'PUT',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({disabled:!row.disabled})});
    var d=await r.json();
    if(d.ok){ MessagePlugin.success((row.disabled?'已恢复 ':'已禁用 ')+row.name); await loadUsers(); }
    else MessagePlugin.error('操作失败');
  }catch(e){ MessagePlugin.error('操作失败: '+e.message); }
}
async function removeUser(row){
  try{
    var r=await fetch('/api/users/'+encodeURIComponent(row.name),{method:'DELETE',credentials:'include'});
    var d=await r.json();
    if(d.ok){ MessagePlugin.success('已移除 '+row.name+'，对方将无法再访问'); await loadUsers(); }
    else MessagePlugin.error('移除失败');
  }catch(e){ MessagePlugin.error('移除失败: '+e.message); }
}

// ===== MATRIX =====
let permissionOptions = [
  {value:'off',short:'-',title:'无权限 / No Access'},
  {value:'view',short:'V',title:'仅浏览 / View Only'},
  {value:'operate',short:'O',title:'可操作但不可编辑 / Operate Only'},
  {value:'manage',short:'M',title:'可操作并可编辑 / Operate + Edit'}
];
let matrixFormalRows = computed(function(){
  return users.value.map(function(u,i){return{name:u.name,role:u.role,domain:u.domain,idx:i};}).filter(function(u){return u.role==='System Admin'||u.role==='Operator';});
});
let matrixInternRows = computed(function(){
  return users.value.map(function(u,i){return{name:u.name,role:u.role,domain:u.domain,idx:i};}).filter(function(u){return u.role==='User';});
});
let activeMatrixRows = computed(function(){
  if(currentRole.value==='operator')return matrixInternRows.value;
  return matrixTab.value==='intern'?matrixInternRows.value:matrixFormalRows.value;
});
let matrixScopeTitle = computed(function(){
  if(currentRole.value==='operator')return '实习生权限 · Intern Access';
  return matrixTab.value==='intern'?'实习生权限 · Intern Access':'正式人员权限 · Formal Staff Access';
});
function canEditPerm(row){
  if(row.role==='System Admin')return false;
  if(currentRole.value==='admin')return true;
  return currentRole.value==='operator'&&row.role==='User';
}
function permButtonClass(row,p,opt){
  var cls=[];
  if(getPermValue(row.idx,p.id)===opt.value)cls.push('active-'+opt.value);
  if(!canEditPerm(row))cls.push('locked');
  return cls;
}

// ===== LOGS =====
let logColumns = [
  {colKey:'time',title:'时间 · Time',width:150},{colKey:'user',title:'操作人 · Operator',width:130},{colKey:'type',title:'类型 · Type',width:120},{colKey:'panel',title:'板块 · Panel',width:120},{colKey:'detail',title:'详情 · Detail',ellipsis:true}
];

// ===== CHAT BOT =====
let chatMessages = ref([]);
let chatUserMessages = ref([]);
let chatInputVisible = ref(false);
let chatInputText = ref('');
let botData = {};

function initChat(){
  chatMessages.value=[];
  chatUserMessages.value=[];
  chatInputVisible.value=false;
  chatMessages.value.push({text:'你好，我是 SSC 权限申请助手 / Access Request Bot。<br><br>请选择你想申请的板块 / Choose a panel:',
    choices:panels.value.filter(function(p){return p.id!==1;}).map(function(p){
      var label='P'+p.id+' · '+panelName(p)+' / '+panelNameEn(p);
      return{label:label,action:function(){selectPanel(p.id,label);}};
    })
  });
}
function selectPanel(id,label){
  botData.panel=id;botData.panelLabel=label;
  chatUserMessages.value.push(label);
  chatMessages.value.push({text:'你选择了 / Selected <b>'+label+'</b>。<br><br>需要什么权限级别 / Which access level?',
    choices:[
      {label:'V · 仅浏览 / View Only',action:function(){selectLevel('view','仅浏览 / View Only');}},
      {label:'O · 可操作不可编辑 / Operate Only',action:function(){selectLevel('operate','可操作 / Operate Only');}},
      {label:'M · 可操作+编辑 / Operate + Edit',action:function(){selectLevel('manage','操作+编辑 / Manage');}}
    ]
  });
}
function selectLevel(level,label){
  botData.level=level;
  chatUserMessages.value.push(label);
  chatMessages.value.push({text:'权限级别 / Access level: <b>'+label+'</b><br><br>请简短说明申请原因 / Briefly explain why:'});
  chatInputVisible.value=true;
}
function chatSendReason(){
  var reason=chatInputText.value.trim();
  if(!reason)return;
  botData.reason=reason;
  chatUserMessages.value.push(reason);
  chatInputVisible.value=false;
  var levelLabel=permissionLabel(botData.level);
  chatMessages.value.push({text:'确认信息 / Confirm:<br><br>PANEL <b>'+botData.panelLabel+'</b><br>LEVEL <b>'+levelLabel+'</b><br>REASON '+reason,
    choices:[
      {label:'确认提交 · Submit',cls:'primary',action:confirmChatSubmit},
      {label:'重新填写 · Restart',cls:'warn',action:initChat}
    ]
  });
  chatInputText.value='';
}
function confirmChatSubmit(){
  var username=currentRole.value==='admin'?'qianjunshan':(currentRole.value==='operator'?'danniewu':'oscarwei');
  var panel=getPanelById(botData.panel)||{label:'Custom Panel',labelEn:'Custom Panel'};
  var requestId=Date.now();
  approvals.value.push({id:requestId,applicant:username,panelId:botData.panel,panel:'P'+botData.panel+' · '+panelName(panel),level:botData.level,reason:botData.reason,time:'just now',status:'pending'});
  myRequests.value.unshift({id:requestId,applicant:username,panelId:botData.panel,panel:'P'+botData.panel+' · '+panelName(panel),level:permissionLabel(botData.level),reason:botData.reason,time:'just now',status:'pending'});
  chatMessages.value.push({text:'<b>申请已提交 / Submitted</b><br><br>已推送至 System Admin 审批队列 / Sent to approval queue.'});
  setTimeout(initChat,1500);
}

// ===== APPROVAL =====
let pendingCount = computed(function(){return approvals.value.filter(function(a){return a.status==='pending';}).length;});
let visibleMyRequests = computed(function(){
  return myRequests.value.filter(function(r){return !r.applicant||r.applicant===currentUserName.value;});
});
function parsePanelIdFromLabel(label){
  var m=String(label||'').match(/P(\d+)/);
  return m?parseInt(m[1],10):null;
}
function approve(id){
  var a=approvals.value.find(function(x){return x.id===id;});
  if(!a)return;
  a.status='approved';
  var panelId=a.panelId||parsePanelIdFromLabel(a.panel);
  var ui=users.value.findIndex(function(u){return u.name===a.applicant;});
  if(ui>=0&&panelId){
    if(!permState[ui])permState[ui]={};
    permState[ui][panelId]=a.level;
    logs.value.unshift({time:'刚刚',user:currentUserName.value,type:'权限审批',panel:'P'+panelId,detail:'通过 '+a.applicant+'：'+permissionLabel(a.level)});
  }
  var mine=myRequests.value.find(function(r){return r.id===id;});
  if(mine)mine.status='approved';
  MessagePlugin.success('已通过并写入权限矩阵 / Approved and synced');
}
function reject(id){
  var a=approvals.value.find(function(x){return x.id===id;});
  if(!a)return;
  a.status='rejected';
  var mine=myRequests.value.find(function(r){return r.id===id;});
  if(mine)mine.status='rejected';
  logs.value.unshift({time:'刚刚',user:currentUserName.value,type:'权限审批',panel:a.panel,detail:'拒绝 '+a.applicant+'：'+permissionLabel(a.level)});
  MessagePlugin.success('已拒绝 / Rejected');
}

// ===== LOGIN =====
let currentRole = ref('admin');
let currentUserName = ref('qianjunshan');
let currentView = ref('dashboard');
let showLogin = ref(false);
let loginError = ref('');
let formalUsers = computed(function(){return users.value.filter(function(u){return u.domain.indexOf('Mentor:')===-1;});});
let internUsers = computed(function(){return users.value.filter(function(u){return u.domain.indexOf('Mentor:')!==-1;});});
let isManager = computed(function(){return currentRole.value==='admin'||currentRole.value==='operator';});
let isUser = computed(function(){return currentRole.value==='user';});

function loginAs(name){
  loginError.value='';
  var u=users.value.find(function(x){return x.name===name;});
  if(u&&u.disabled){loginError.value='管理员已禁用您的登录权限 / Login disabled<br>请联系 System Administrator: <b>qianjunshan</b>';return;}
  if(!u)return;
  currentUserName.value=u.name;
  currentRole.value=u.role==='System Admin'?'admin':u.role==='Operator'?'operator':'user';
  todoOpen.value=false;
  if(currentView.value==='apply'&&currentRole.value!=='admin')initChat();
  showLogin.value=false;
}
function openLogin(){showLogin.value=true;}

// ===== NAVIGATION =====
function onMenuChange(val){
  if(val==='add-panel'){addGlobalPanel();return;}
  var views=['dashboard','users','matrix','logs','apply','p1-quality','p1-knowledge','p2','p4','p10','assign','aitools','meeting-hub'];
  if(views.indexOf(val)!==-1){
    currentView.value=val;
    if(val==='p4')startP4SlaTimer();
    if(val==='apply'&&currentRole.value!=='admin')initChat();
  }
}
function addGlobalPanel(){
  if(currentRole.value==='user')return;
  var name=prompt('请输入新板块名称 / New panel name:','新增运营模块');
  if(!name)return;
  var id=nextPanelId++;
  panels.value.push({id:id,label:name,labelEn:'Custom Operation Module',status:'ok',custom:true});
  users.value.forEach(function(u,i){
    if(!permState[i])permState[i]={};
    permState[i][id]=u.role==='System Admin'?'manage':'off';
  });
  MessagePlugin.success('已新增板块 / Panel added');
}

// KPI — AI 动态选择（初始先用硬编码，AI 返回后覆盖）
let aiKpiRefreshing = ref(false);
let kpiItems = ref([
  {value:'147',label:'本周需求总量 · Weekly Requests',trend:'↑12%',trendCls:'up'},
  {value:'7',label:'超期 / 阻塞 · Overdue / Blocked',trend:'↓22%',trendCls:'down'},
  {value:'94.3%',label:'SLA 达标率 · SLA Hit Rate',trend:'↑3%',trendCls:'up'},
  {value:'6',label:'跨板块协同 · Cross-panel Sync',trend:'—',trendCls:'neutral'},
]);
async function refreshAIDrivenKPIs(){
  if(aiKpiRefreshing.value) return;
  aiKpiRefreshing.value = true;
  try {
    var ctx = buildAIInsightContext();
    var resp = await fetch('https://ntsgw.woa.com/api/sso/llm-proxy-service/api/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({
        model:'HY-3-Preview',
        messages:[
          {role:'system', content:'你是 SSC 平台的数据分析师。基于平台实时状态 JSON，选出 4 个最值得关注的 KPI。每个 KPI 包含 label/value/trend/trendCls(up/down/neutral)。全部数据来源于 JSON、不编造。输出纯 JSON 数组：如 [{"label":"...","value":"...","trend":"...","trendCls":"..."},...]。不输出任何其他内容。'},
          {role:'user', content:'平台状态：\n'+JSON.stringify(ctx,null,2)+'\n\n输出 4 个 KPI 的 JSON 数组。'}
        ],
        temperature:0.3,
        max_tokens:400
      })
    });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    var data = await resp.json();
    var content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    var jsonMatch = content.match(/\[[\s\S]*\]/);
    if(jsonMatch){
      var kpis = JSON.parse(jsonMatch[0]);
      if(Array.isArray(kpis) && kpis.length>=2){
        kpiItems.value = kpis.filter(function(k){return k.label && k.value;}).slice(0,4);
      }
    }
  } catch(e){ /* AI 失败 → 保留现有 fallback */ }
  finally { aiKpiRefreshing.value = false; }
}
let panelOkCount = computed(function(){return panels.value.filter(function(p){return p.status==='ok';}).length;});
let activePanel = ref(0);
let openPanelIds = reactive({});

// 快捷入口配置（1 个设置按钮 → 控制 3 个入口
let qaSettingsOpen = ref(false);
let qaConfig = reactive([{view:'p4',label:'Chatbot 98008'},{view:'aitools',label:'AI 工具广场'},{view:'p10',label:'工作项分配'}]);
let qaOptions = [{view:'p4',label:'Chatbot 98008'},{view:'aitools',label:'AI 工具广场'},{view:'p10',label:'工作项分配'},{view:'p1',label:'P1 质量管理'},{view:'p2',label:'权限治理'},{view:'p9',label:'论坛'},{view:'dashboard',label:'全局总览'}];
function goToView(v){ currentView.value = v; }
function setQaConfig(idx,e){ qaConfig[idx].view = e.target.value; qaConfig[idx].label = e.target.selectedOptions[0].text; }

// ===== 真实身份识别（太湖网关注入 X-Staff-Name / X-Staff-Id） =====
let realStaff = ref(null);
async function getStaffInfo(){
  try{
    var resp = await fetch(window.location.href, { method: 'HEAD' });
    var staffName = resp.headers.get('X-Staff-Name');
    if(!staffName) return null;
    return {
      staffName: staffName,
      staffId: resp.headers.get('X-Staff-Id'),
      avatarUrl: 'https://r.hrc.woa.com/photo/150/' + staffName + '.png?default_when_absent=true'
    };
  }catch(e){ return null; }
}
async function initRealIdentity(){
  realStaff.value = await getStaffInfo();
  // 身份确认后再拉一次「我的作品」「收件箱」（init 时身份可能还没就绪）
  if(realStaff.value && realStaff.value.staffName){
    if(typeof loadMyPpts==='function') loadMyPpts();
    if(typeof loadInbox==='function') loadInbox();
    if(typeof loadCustomTemplates==='function') loadCustomTemplates();
    if(typeof loadAssignments==='function') loadAssignments();
    if(typeof loadBulletins==='function') loadBulletins();
    if(typeof loadBlackboard==='function') loadBlackboard();
  }
}

// 每 30 秒自动刷新收件箱和工作项
setInterval(function(){
  if(typeof loadInbox==='function') loadInbox();
  if(typeof loadAssignments==='function') loadAssignments();
}, 30000);

// ===== 准入鉴权（名单驱动）=====
// 应用层准入：后端按真实 OA 身份比对 users 名单。本地无网关头 → dev 放行。
let accessChecked = ref(false);   // 判定是否完成（完成前不渲染主体，避免闪）
let accessAllowed = ref(true);    // 是否准入
let accessName = ref(null);       // 被拦截者的英文名（提示用）
async function checkAccess(){
  try{
    var r=await fetch('/api/access',{credentials:'include'});
    var d=await r.json();
    accessName.value = d.staffName || null;
    accessAllowed.value = !!d.allowed;
    // 准入者：用真实角色覆盖默认（admin/operator/user），让菜单/权限按名单生效
    if(d.allowed && d.role){
      currentRole.value = d.role==='System Admin'?'admin':d.role==='Operator'?'operator':'user';
      if(d.staffName) currentUserName.value = d.staffName;
    }
  }catch(e){
    // 接口异常时不误伤，放行（避免因网络抖动把所有人挡在外面）
    accessAllowed.value = true;
  }finally{
    accessChecked.value = true;
  }
}

// ===== PPT GENERATOR =====
let aitoolsActiveTab = ref('ppt');
let pptPrompt = ref('');
let pptGenerating = ref(false);
let pptGenerated = ref(false);
let pptHtml = ref('');

// ===== PPT 模板库 =====
let pptTemplates = ref(window.SSC_PPT_TEMPLATES || []);
let customTemplates = ref([]);
let allTemplates = computed(function(){
  var builtin = pptTemplates.value.map(function(t){return {id:t.id,name:t.name,en:t.en,accent:t.accent,bg:t.bg,thumb:t.thumb,isCustom:false};});
  var custom = customTemplates.value.map(function(t){return {id:t.id,name:t.name,en:t.en||'Custom',accent:t.accent||'#0052d9',bg:t.bg||'#f0f0f0',isCustom:true};});
  return builtin.concat(custom);
});

// 模板缩略图缓存
let tplThumbCache = {};
function buildTplThumbHtml(tplObj){
  if(tplThumbCache[tplObj.id]) return tplThumbCache[tplObj.id];
  try {
    var t = (window.SSC_PPT_TEMPLATES||[]).find(function(x){return x.id===tplObj.id;});
    if(!t) return '';
    var fullHtml = t.build();
    // 提取 CSS + 第一页 slide 内容
    var cssM = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
    var css = cssM ? cssM[1].replace(/position:fixed/g,'position:absolute') : '';
    // slide active 的内容：到下一个 <div class="slide" 或到 deck 结束
    var sIdx = fullHtml.indexOf('<div class="slide active');
    var sStart = fullHtml.indexOf('>', sIdx) + 1;
    // 从 sStart 开始，找到对应的 </div>
    var depth = 1, pos = sStart;
    while(depth > 0 && pos < fullHtml.length){
      var op = fullHtml.indexOf('<div', pos);
      var cl = fullHtml.indexOf('</div>', pos);
      if(cl < 0) break;
      if(op >= 0 && op < cl){ depth++; pos = op + 4; }
      else { depth--; pos = cl + 6; }
    }
    var slideHTML = fullHtml.substring(sStart, pos - 6);
    // 构建缩略图 HTML（无脚本、无交互、纯预览）
    var thumb = '<div style="width:1280px;height:720px;overflow:hidden;pointer-events:none">'
      + '<style>' + css + '.slide{pointer-events:none !important;}</style>'
      + '<div class="slide active" style="position:absolute;inset:0;opacity:1;pointer-events:none">' + slideHTML + '</div></div>';
    tplThumbCache[tplObj.id] = thumb;
    return thumb;
  } catch(e){ return ''; }
}
async function loadCustomTemplates(){
  try{var r=await fetch('/api/custom-templates');var d=await r.json();if(d.ok)customTemplates.value=d.list;}catch(e){}
}
function loadTemplate(tplObj){
  if(tplObj.isCustom){
    // 自定义模板：直接用保存的 html
    var ct = customTemplates.value.find(function(x){return x.id===tplObj.id;});
    if(!ct){ MessagePlugin.error('模板未找到'); return; }
    pptHtml.value = ct.html;
    pptGenerated.value = true; pptGenerating.value = false;
    MessagePlugin.success('已载入自定义模板「'+ct.name+'」');
  } else {
    // 内置模板：调用 build()
    var t = (window.SSC_PPT_TEMPLATES||[]).find(function(x){return x.id===tplObj.id;});
    if(!t){ MessagePlugin.error('模板未找到'); return; }
    try {
      pptHtml.value = t.build();
      pptGenerated.value = true; pptGenerating.value = false;
      MessagePlugin.success('已载入模板「'+t.name+'」');
    } catch(e){ MessagePlugin.error('模板载入失败: '+e.message); }
  }
  setTimeout(function(){ var box=document.querySelector('.ppt-preview-box'); if(box) box.scrollIntoView({behavior:'smooth',block:'start'}); }, 120);
}
async function addCustomTemplate(){
  if(!pptGenerated.value || !pptHtml.value){ MessagePlugin.warning('请先生成或载入一个模板内容，再保存为自定义模板'); return; }
  var name = prompt('请输入模板名称：','我的模板');
  if(!name || !name.trim()) return;
  name = name.trim();
  var en = prompt('英文名称（可选，留空跳过）：', 'My Template');
  try {
    var r = await fetch('/api/custom-templates', {method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:name, en:en||'Custom', accent:'#0052d9', bg:'#f5f5f7', html: pptHtml.value})
    });
    var d = await r.json();
    if(d.ok){ MessagePlugin.success('模板「'+name+'」已保存'); loadCustomTemplates(); }
    else { MessagePlugin.error('保存失败: '+ (d.error||'未知错误')); }
  } catch(e){ MessagePlugin.error('保存失败: '+e.message); }
}
async function deleteCustomTpl(id){
  if(!confirm('确认删除此自定义模板？')) return;
  try { await fetch('/api/custom-templates/'+id, {method:'DELETE'}); loadCustomTemplates(); MessagePlugin.success('已删除'); }
  catch(e){ MessagePlugin.error('删除失败'); }
}
let pptIframe = ref(null);
let pptFileInput = ref(null);
let pptImportedName = ref('');

// ===== 导入任意 HTML 文件 =====
function triggerPptImport(){ if(pptFileInput.value) pptFileInput.value.click(); }
function onPptImport(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    let html = String(ev.target.result || '');
    // 若上传的是 HTML 片段（无 <html>），包一层基本结构，保证 iframe 能渲染
    if(!/<html[\s>]/i.test(html)){
      html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>';
    }
    pptHtml.value = html;
    pptGenerated.value = true;
    pptGenerating.value = false;
    pptImportedName.value = file.name;
    pptShareUrl.value = '';
  };
  reader.onerror = function(){
    pptHtml.value = '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#e34d59"><h2>读取失败</h2><p>无法读取该文件，请确认是 HTML 文本文件。</p></body></html>';
    pptGenerated.value = true;
  };
  reader.readAsText(file, 'UTF-8');
  // 清空，允许再次选同一文件
  e.target.value = '';
}

const PPT_SYSTEM_PROMPT = `You are an expert HTML slide deck generator. Create a self-contained, responsive HTML presentation with the following built-in capabilities:

REQUIREMENTS:
1. Structure: use a container div.deck with multiple div.slide elements inside
2. Each slide fills the viewport (100vw × 100vh) with clean, professional design
3. Slide navigation: left/right arrow buttons at bottom-right, keyboard ← → support, slide counter, progress bar
4. EDIT MODE: add a toggle button that makes all text elements contenteditable for in-place editing
5. MOVE MODE: add a toggle button that lets users drag-reposition text elements (mousedown/mousemove/mouseup)
6. IMAGE INSERT: add a button to insert images from local files, with move/resize/delete toolbar on each image
7. SAVE: add a button that downloads the current HTML as a file
8. UNDO: add undo functionality that reverts to previous edit state
9. SLIDE SORTER: add a button that opens an overlay grid showing all slides as thumbnails for drag-reorder

DESIGN RULES:
- Modern, professional color palette. Prefer distinctive choices: deep navy, warm terracotta, muted sage, or rich plum tones. Avoid generic purple-on-white gradients.
- Typography: use Google Fonts — prefer distinctive display faces (Playfair Display, DM Serif Display, Cormorant Garamond) paired with clean body fonts (Inter, Source Sans 3). Never use Arial or system fonts.
- Clean flat design with subtle borders and rounded corners
- One well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions
- Backgrounds: layer CSS gradients, geometric patterns, or contextual effects rather than defaulting to solid white
- Max 8-10 slides. One idea per slide, large type, generous negative space
- Each slide has a clear title and organized content
- Use grids and cards for data presentation where appropriate
- Include prefers-reduced-motion support for all animations
- Style must feel custom-crafted, not templated. Every presentation should have a distinct character.

OUTPUT ONLY the complete HTML file. No markdown, no explanation — just <!DOCTYPE html> through </html>.`;

function buildPPTPrompt(userInput){
  return PPT_SYSTEM_PROMPT + '\n\nUSER REQUEST:\n' + userInput;
}

async function generatePPT(){
  if(!pptPrompt.value.trim() || pptGenerating.value) return;
  pptGenerating.value = true;
  pptGenerated.value = false;
  pptHtml.value = '';
  try {
    const resp = await fetch('https://ntsgw.woa.com/api/sso/llm-proxy-service/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        model: 'HY-3-Preview',
        messages: [
          { role: 'system', content: PPT_SYSTEM_PROMPT },
          { role: 'user', content: pptPrompt.value.trim() }
        ],
        temperature: 0.7,
        max_tokens: 8192
      })
    });
    if(!resp.ok){ const err = await resp.json().catch(function(){ return {}; }); throw new Error(err.error?.message || 'API '+resp.status); }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const htmlMatch = content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
    pptHtml.value = htmlMatch ? htmlMatch[0] : content;
    pptGenerated.value = true;
  } catch(e){
    pptHtml.value = '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#e34d59"><h2>生成失败</h2><p>'+e.message+'</p><p style="color:#888">请检查网络连接后重试 · Retry after checking network</p></body></html>';
    pptGenerated.value = true;
  } finally {
    pptGenerating.value = false;
  }
}

function pptRegenerate(){ pptGenerated.value = false; pptHtml.value = ''; generatePPT(); }
function pptDownloadHTML(){
  if(!pptHtml.value) return;
  pptHtml.value = captureEditedHtml();
  const blob = new Blob([pptHtml.value], { type: 'text/html;charset=UTF-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ai-generated-slides.html';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function pptDownloadPPTX(){
  if(!pptHtml.value) return;
  try {
    const iframe = pptIframe.value;
    if(!iframe || !iframe.contentDocument){ MessagePlugin.error('无法读取内容'); return; }
    const doc = iframe.contentDocument;

    // 从 DOM 智能提取结构化内容（保留格式层级）
    function extractStructuredSlides(root){
      // 尝试按 .slide / section / .deck 分页
      var slideEls = root.querySelectorAll('.slide, section.slide, [data-slide], .swiper-slide');
      if(!slideEls.length) slideEls = root.querySelectorAll('section');
      if(!slideEls.length){
        // 无分页结构 → 按 h1/h2 分割
        var allNodes = Array.from(root.body ? root.body.children : root.children);
        var pages = []; var cur = [];
        allNodes.forEach(function(el){
          if(/^H[12]$/.test(el.tagName) && cur.length){ pages.push(cur); cur=[]; }
          cur.push(el);
        });
        if(cur.length) pages.push(cur);
        if(!pages.length) pages = [allNodes];
        slideEls = pages.map(function(els){
          var div = document.createElement('div');
          els.forEach(function(e){ div.appendChild(e.cloneNode(true)); });
          return div;
        });
      }

      var result = [];
      Array.from(slideEls).forEach(function(slide, idx){
        var page = { title:'', items:[] };
        // 提取标题
        var h = slide.querySelector('h1,h2,.title,[class*="title"]');
        page.title = h ? h.textContent.trim() : ('Page '+(idx+1));

        // 遍历子元素提取带格式的文本块
        var els = slide.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,blockquote,figcaption,div>strong,div>b');
        els.forEach(function(el){
          var txt = el.textContent.trim();
          if(!txt || txt === page.title) return;
          var tag = el.tagName;
          var item = { text:txt, fontSize:14, bold:false, italic:false, indent:0, bullet:false, color:'333333' };
          if(/^H[12]$/.test(tag)){ item.fontSize=22; item.bold=true; item.color='0052d9'; }
          else if(/^H[34]$/.test(tag)){ item.fontSize=18; item.bold=true; item.color='1d2733'; }
          else if(/^H[56]$/.test(tag)){ item.fontSize=16; item.bold=true; }
          else if(tag==='LI'){ item.bullet=true; item.indent=0.4; }
          else if(tag==='BLOCKQUOTE'){ item.italic=true; item.color='666666'; item.indent=0.3; }
          // 检测行内格式
          if(el.querySelector('strong,b')) item.bold=true;
          if(el.querySelector('em,i')) item.italic=true;
          if(el.querySelector('code')) item.color='d4380d';
          page.items.push(item);
        });
        if(page.items.length || page.title) result.push(page);
      });
      return result;
    }

    // ===== 位置感知导出：读取真实渲染坐标 + 样式 =====
    var pages = extractStructuredSlides(doc);
    if(!pages.length){ MessagePlugin.warning('未检测到可导出内容'); return; }

    // iframe 可视区域尺寸（用于坐标归一化）
    var iframeW = iframe.clientWidth || 960;
    var iframeH = iframe.clientHeight || 600;
    // PPTX LAYOUT_WIDE 是 13.33 x 7.5 英寸
    var pptW = 13.33, pptH = 7.5;
    var scaleX = pptW / iframeW, scaleY = pptH / iframeH;

    function rgbToHex(rgb){
      if(!rgb || rgb==='transparent' || rgb==='rgba(0, 0, 0, 0)') return '';
      var m = rgb.match(/(\d+)/g);
      if(!m || m.length<3) return '';
      return m.slice(0,3).map(function(v){return ('0'+parseInt(v).toString(16)).slice(-2);}).join('');
    }
    function pxToPt(px){ return Math.round(parseFloat(px) * 0.75) || 14; }

    var pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'SSC AI Tool';
    pptx.title = pptImportedName.value || 'AI Generated Presentation';

    // 确定分页元素（同 extractStructuredSlides 的 slideEls 逻辑）
    var slideEls = doc.querySelectorAll('.slide, section.slide, [data-slide], .swiper-slide');
    if(!slideEls.length) slideEls = doc.querySelectorAll('section');
    var usePositionMode = slideEls.length > 0; // 有明确分页结构才用位置模式

    if(usePositionMode){
      // 位置感知模式：每个 slide 读子元素的真实坐标
      Array.from(slideEls).forEach(function(slideEl){
        var s = pptx.addSlide();
        var slideRect = slideEl.getBoundingClientRect();
        var slideW = slideRect.width || iframeW;
        var slideH = slideRect.height || iframeH;
        var sX = pptW / slideW, sY = pptH / slideH;

        // 读 slide 背景色
        var slideBg = rgbToHex(iframe.contentWindow.getComputedStyle(slideEl).backgroundColor);
        if(slideBg && slideBg !== '000000' && slideBg !== 'ffffff') {
          s.background = { fill: slideBg };
        }

        // 遍历所有可见文本元素
        var textEls = slideEl.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,span,a,b,strong,em,td,th,blockquote,figcaption,label,div');
        var processed = new Set(); // 避免父子重复
        textEls.forEach(function(el){
          // 跳过包含子文本块的容器（防重复）
          if(el.querySelector('h1,h2,h3,h4,h5,h6,p,li') && el.tagName!=='LI') return;
          var txt = el.textContent.trim();
          if(!txt || txt.length > 500) return; // 跳过空/超长（可能是容器）
          // 去重：如果文字完全被父元素覆盖就跳
          if(processed.has(txt+el.getBoundingClientRect().top.toFixed(0))) return;
          processed.add(txt+el.getBoundingClientRect().top.toFixed(0));

          var rect = el.getBoundingClientRect();
          var style = iframe.contentWindow.getComputedStyle(el);
          if(style.display==='none' || style.visibility==='hidden' || parseFloat(style.opacity)<0.1) return;

          // 相对于 slide 的位置
          var relX = rect.left - slideRect.left;
          var relY = rect.top - slideRect.top;

          var opts = {
            x: Math.max(0, relX * sX),
            y: Math.max(0, relY * sY),
            w: Math.min(pptW, Math.max(1, rect.width * sX)),
            h: Math.max(0.3, rect.height * sY),
            fontSize: pxToPt(style.fontSize),
            bold: parseInt(style.fontWeight)>=600,
            italic: style.fontStyle==='italic',
            color: rgbToHex(style.color) || '333333',
            fontFace: 'PingFang SC',
            valign: 'middle',
            margin: 0,
            wrap: true
          };

          // 元素背景色 → 文本框填充
          var elBg = rgbToHex(style.backgroundColor);
          if(elBg && elBg !== slideBg && elBg !== '000000'){
            opts.fill = { color: elBg };
          }

          try { s.addText(txt, opts); } catch(e){}
        });
      });
    } else {
      // fallback：无位置结构，用老的结构化模式（按标签层级）
      pages.forEach(function(page){
        var s = pptx.addSlide();
        s.addText(page.title, { x:0.6, y:0.3, w:9, h:0.8, fontSize:26, bold:true, color:'0052d9', fontFace:'PingFang SC', valign:'bottom' });
        s.addShape(pptx.shapes.RECTANGLE, { x:0.6, y:1.15, w:9, h:0.02, fill:{color:'0052d9'} });
        var y = 1.4;
        page.items.forEach(function(item){
          if(y > 6.8) return;
          s.addText(item.text, {
            x: 0.6+(item.indent||0), y:y, w:9-(item.indent||0), h:0.5,
            fontSize:item.fontSize, bold:item.bold, italic:item.italic, color:item.color,
            fontFace:'PingFang SC', valign:'top', margin:0, bullet:item.bullet?{type:'bullet'}:false
          });
          y += (item.fontSize>=18?0.6:0.45);
        });
      });
    }

    pptx.writeFile({ fileName: (pptImportedName.value||'presentation').replace(/\.[^.]+$/,'')+'.pptx' });
  } catch(e){
    alert('PPTX 导出失败 · Export failed: '+e.message);
  }
}
// iframe 载入后：① 隐藏生成 HTML 自带的 SAVE 按钮 ② 在右上角注入统一的「完成并保存」浮动按钮
function onPptIframeLoad(){
  // 所有操作键在外部 editor-bar；这里做两件事：隐藏冗余按钮 + 注入编辑能力
  try {
    const iframe = pptIframe.value;
    if(!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;

    // ① 隐藏 iframe 内自带的"保存/下载HTML"按钮
    const btns = doc.querySelectorAll('button, a, [role="button"]');
    btns.forEach(function(b){
      const t = (b.textContent||'').trim().toLowerCase();
      if(/^(save|保存|下载\s*html|download\s*html|💾)/.test(t) || t==='save' || t==='保存'){
        b.style.display = 'none';
      }
    });

    // ② 对导入的外部 HTML：如果没有自带 contenteditable，注入可编辑能力
    //    检测：如果 body 里没有任何 contenteditable 元素，把所有段落/标题/列表设为可编辑
    var editables = doc.querySelectorAll('[contenteditable="true"]');
    if(!editables.length){
      // 给主要内容块加 contenteditable
      var targets = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, div.slide, section, article, .content, .text, blockquote, figcaption, span:not(:empty)');
      if(targets.length < 3){
        // 如果精确匹配太少，直接让 body 可编辑
        doc.body.contentEditable = 'true';
        doc.body.style.outline = 'none';
      } else {
        targets.forEach(function(el){
          // 跳过包含子块元素的容器（避免嵌套 contenteditable）
          if(el.querySelector && el.querySelector('p,h1,h2,h3,h4,h5,h6,li,td')) return;
          el.contentEditable = 'true';
          el.style.outline = 'none';
        });
      }
      // 注入一段提示样式：聚焦时轻微高亮
      var style = doc.createElement('style');
      style.textContent = '[contenteditable]:focus{outline:2px solid rgba(0,82,217,.3)!important;border-radius:4px}';
      doc.head.appendChild(style);
    }
  } catch(e){ /* 跨域或未就绪，忽略 */ }
}

// 清除当前 PPT（关闭编辑器，回到空状态，便于开下一个）
function pptClear(){
  pptHtml.value = '';
  pptGenerated.value = false;
  pptGenerating.value = false;
  pptImportedName.value = '';
  pptShareUrl.value = '';
  MessagePlugin.info('已关闭当前演示文稿');
}

// 从 iframe 取回“编辑后”的完整 HTML（srcdoc 同源可读 DOM）
function captureEditedHtml(){
  try {
    const iframe = pptIframe.value;
    if(iframe && iframe.contentDocument && iframe.contentDocument.documentElement){
      const doc = iframe.contentDocument;
      // 移除我们之前注入的浮动按钮（如有残留），避免被存进 HTML
      const inj = doc.getElementById('__ssc_commit_btn');
      if(inj) inj.remove();
      const doctype = '<!DOCTYPE html>\n';
      const html = doctype + doc.documentElement.outerHTML;
      return html;
    }
  } catch(e){ /* 跨域或未就绪 → 退回原始 */ }
  return pptHtml.value;
}

// 尝试关闭 iframe 内的编辑模式（不同生成模板按钮文案不一，尽量匹配）
function exitIframeEditMode(){
  try {
    const iframe = pptIframe.value;
    if(!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;
    // 关闭所有 contenteditable
    doc.querySelectorAll('[contenteditable="true"]').forEach(function(el){ el.setAttribute('contenteditable','false'); });
    // 若页面有“编辑模式”开关且处于开启态，点一下关掉
    const toggles = doc.querySelectorAll('button,[role="button"]');
    toggles.forEach(function(b){
      const t=(b.textContent||'').trim().toLowerCase();
      const on = b.classList.contains('active')||b.getAttribute('aria-pressed')==='true';
      if(on && /(edit|编辑|move|移动)/.test(t)){ try{ b.click(); }catch(e){} }
    });
  } catch(e){}
}

// 「完成并保存」：固化编辑 → 退出编辑模式 → 正向反馈
let pptSyncing = ref(false);
function pptCommitEdits(){
  const edited = captureEditedHtml();
  if(edited){ pptHtml.value = edited; }
  exitIframeEditMode();
  // 重新注入浮动按钮（captureEditedHtml 时被移除了）
  setTimeout(onPptIframeLoad, 60);
  MessagePlugin.success('✅ 已完成并保存，编辑已固化');
}
// 暴露给 iframe 内浮动按钮调用
if(typeof window!=='undefined') window.__sscCommit = pptCommitEdits;

// ===== PPT 分享（存容器磁盘，全员共享，部署不丢） =====
let pptSharing = ref(false);
let pptShareUrl = ref('');
let sharedPpts = ref([]);

async function pptShare(){
  if(!pptHtml.value || pptSharing.value) return;
  pptHtml.value = captureEditedHtml();
  pptSharing.value = true;
  try {
    var resp = await fetch('/api/ppt/save', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({ html: pptHtml.value, title: pptPrompt.value.slice(0,40)||'AI 演示文稿', prompt: pptPrompt.value })
    });
    var data = await resp.json();
    if(!data.ok){ MessagePlugin.error('分享失败: '+(data.message||data.error)); return; }
    pptShareUrl.value = window.location.origin + '/share/ppt/' + data.id;
    MessagePlugin.success('分享链接已生成');
    loadSharedPpts();
  } catch(e){
    MessagePlugin.error('分享失败: '+e.message);
  } finally {
    pptSharing.value = false;
  }
}
function copyShareUrl(){
  if(!pptShareUrl.value) return;
  navigator.clipboard.writeText(pptShareUrl.value).then(function(){ MessagePlugin.success('已复制到剪贴板'); });
}
async function loadSharedPpts(){
  try {
    var resp = await fetch('/api/ppt', { credentials:'include' });
    var data = await resp.json();
    if(data.ok) sharedPpts.value = data.list || [];
  } catch(e){ /* ignore */ }
}
function openSharedPpt(id){ window.open('/share/ppt/'+id, '_blank'); }
function copyPptLink(id){
  var url = window.location.origin + '/share/ppt/' + id;
  navigator.clipboard.writeText(url).then(function(){ MessagePlugin.success('链接已复制'); });
}
function canDeletePpt(d){
  var who = (realStaff.value && realStaff.value.staffName) ? realStaff.value.staffName : null;
  return who && d.author === who;
}
async function deleteSharedPpt(id){
  try {
    var resp = await fetch('/api/ppt/'+id, { method:'DELETE', credentials:'include' });
    var data = await resp.json();
    if(data.ok){ MessagePlugin.success('已删除'); loadSharedPpts(); }
    else MessagePlugin.error(data.error==='not_owner'?'只能删除自己创建的':'删除失败');
  } catch(e){ MessagePlugin.error('删除失败: '+e.message); }
}
function formatPptTime(iso){
  if(!iso) return '';
  try { var d=new Date(iso); return d.getMonth()+1+'月'+d.getDate()+'日 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  catch(e){ return iso; }
}

// ===== 我的作品（按真实 OA 身份归档，永久保存，手动存）=====
let myPpts = ref([]);
// 最近会议纪要：从已保存作品中筛选会议相关摘要
let recentMeetingNotes = computed(function(){
  return myPpts.value.filter(function(p){
    return p.type==='summary'&&((p.title||'').indexOf('会议')>=0||(p.title||'').indexOf('Meeting')>=0);
  }).slice(0,5);
});
function openMeetingNote(note){ openMyPpt(note); }
let pptSavingMine = ref(false);
async function pptSaveMine(){
  if(!pptHtml.value || pptSavingMine.value) return;
  if(!realStaff.value || !realStaff.value.staffName){
    MessagePlugin.warning('未识别到 OA 身份，「我的作品」仅在 hr claw 线上生效');
    return;
  }
  pptHtml.value = captureEditedHtml();
  pptSavingMine.value = true;
  try {
    var resp = await fetch('/api/ppt/save', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({ html: pptHtml.value, title: (pptImportedName.value||pptPrompt.value.slice(0,40)||'AI 演示文稿'), prompt: pptPrompt.value, kind:'mine' })
    });
    var data = await resp.json();
    if(!data.ok){ MessagePlugin.error('保存失败: '+(data.message||data.error)); return; }
    MessagePlugin.success('已保存到「我的作品」');
    loadMyPpts();
  } catch(e){ MessagePlugin.error('保存失败: '+e.message); }
  finally { pptSavingMine.value = false; }
}
async function loadMyPpts(){
  try {
    var resp = await fetch('/api/ppt/mine/list', { credentials:'include' });
    var data = await resp.json();
    if(data.ok) myPpts.value = data.list || [];
  } catch(e){ /* ignore */ }
}
async function openMyPpt(item){
  // item 可以是 {id, title, type} 对象（从列表点），也可以是纯 id 字符串（兼容旧调用）
  var id = typeof item==='object' ? item.id : item;
  var itemType = typeof item==='object' ? (item.type||'') : '';
  try {
    var resp = await fetch('/api/ppt/'+id, { credentials:'include' });
    var data = await resp.json();
    if(!data || !data.html){ MessagePlugin.error('作品不存在或已被删除'); return; }

    // 判断类型：summary 载入摘要编辑器，ppt 载入 PPT iframe
    var isSummary = (data.type==='summary') || itemType==='summary' || (data.title||'').includes('Summary');

    if(isSummary){
      // 切到智能摘要 tab，把 HTML body 内容提取出来载入 contenteditable
      aitoolsActiveTab.value = 'summary';
      var bodyMatch = data.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      sumResultHTML.value = bodyMatch ? bodyMatch[1] : data.html;
      sumFileName.value = (data.title||'').replace(' · Summary','');
      nextTick(function(){ if(sumEditor.value) sumEditor.value.innerHTML = sumResultHTML.value; });
      MessagePlugin.success('已载入到智能摘要编辑器');
    } else {
      // PPT：切到 PPT tab，载入 iframe
      aitoolsActiveTab.value = 'ppt';
      pptHtml.value = data.html;
      pptGenerated.value = true;
      pptGenerating.value = false;
      pptImportedName.value = data.title || '';
      pptShareUrl.value = '';
      MessagePlugin.success('已载入到 PPT 编辑器');
    }
  } catch(e){ MessagePlugin.error('载入失败: '+e.message); }
}
async function deleteMyPpt(id){
  try {
    var resp = await fetch('/api/ppt/'+id, { method:'DELETE', credentials:'include' });
    var data = await resp.json();
    if(data.ok){ MessagePlugin.success('已删除'); loadMyPpts(); }
    else MessagePlugin.error('删除失败');
  } catch(e){ MessagePlugin.error('删除失败: '+e.message); }
}

// ===== 智能摘要 · AI Summary（上传/粘贴 → HY-3 → 可编辑 → 导 docx / 分享 / 保存）=====
let sumFileInput = ref(null);
let sumEditor = ref(null);
let sumFileName = ref('');
let sumFileSize = ref('');
let sumExtractedText = ref('');
let sumTextLen = ref(0);
let sumPaste = ref('');
let sumStyle = ref('normal');
let sumLength = ref('normal');
let sumGenerating = ref(false);
let sumResultHTML = ref('');
let sumSavingMine = ref(false);
let hasSumInput = computed(function(){ return !!(sumExtractedText.value.trim() || sumPaste.value.trim()); });
let sumWordCount = computed(function(){
  if(!sumResultHTML.value) return 0;
  var tmp = document.createElement('div'); tmp.innerHTML = sumResultHTML.value;
  return (tmp.textContent || '').replace(/\s+/g,'').length;
});

function fmtSize(n){ if(n<1024)return n+' B'; if(n<1024*1024)return (n/1024).toFixed(1)+' KB'; return (n/1024/1024).toFixed(1)+' MB'; }
function triggerSumImport(){ if(sumFileInput.value) sumFileInput.value.click(); }

async function onSumFileSelected(e){
  var file = e.target.files && e.target.files[0];
  if(!file) return;
  sumFileName.value = file.name;
  sumFileSize.value = fmtSize(file.size);
  sumExtractedText.value = '';
  sumTextLen.value = 0;
  try {
    var name = file.name.toLowerCase();
    var text = '';
    if(name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.markdown')){
      text = await file.text();
    } else if(name.endsWith('.pdf')){
      text = await extractPdfText(file);
    } else if(name.endsWith('.docx')){
      text = await extractDocxText(file);
    } else if(name.endsWith('.pptx')){
      text = await extractPptxText(file);
    } else if(name.endsWith('.doc') || name.endsWith('.ppt')){
      MessagePlugin.warning('.doc/.ppt 老格式浏览器无法解析，请在 Office 里另存为 .docx/.pptx 后再上传');
      sumFileName.value = ''; sumFileSize.value = '';
      e.target.value = '';
      return;
    } else {
      MessagePlugin.warning('暂不支持该格式');
      sumFileName.value = ''; sumFileSize.value = '';
      e.target.value = '';
      return;
    }
    sumExtractedText.value = (text || '').trim();
    sumTextLen.value = sumExtractedText.value.length;
    if(!sumTextLen.value){ MessagePlugin.warning('未提取到文本（可能是扫描版 PDF / 加密文件 / 空内容）'); }
    else { MessagePlugin.success('已读取 '+sumTextLen.value+' 字'); }
  } catch(err){
    MessagePlugin.error('文件解析失败: '+(err.message||err));
    sumFileName.value = ''; sumFileSize.value = '';
  } finally {
    e.target.value = '';
  }
}

async function extractPdfText(file){
  if(!window.pdfjsLib) throw new Error('PDF 解析库未就绪');
  var ab = await file.arrayBuffer();
  var pdf = await pdfjsLib.getDocument({data:ab}).promise;
  var parts = [];
  for(var i=1; i<=pdf.numPages; i++){
    var page = await pdf.getPage(i);
    var content = await page.getTextContent();
    parts.push(content.items.map(function(it){return it.str;}).join(' '));
  }
  return parts.join('\n\n');
}

async function extractDocxText(file){
  if(!window.mammoth) throw new Error('docx 解析库未就绪');
  var ab = await file.arrayBuffer();
  var r = await mammoth.extractRawText({arrayBuffer: ab});
  return r.value || '';
}

async function extractPptxText(file){
  if(!window.JSZip) throw new Error('zip 解析库未就绪');
  var zip = await JSZip.loadAsync(file);
  var slideFiles = Object.keys(zip.files).filter(function(n){ return /^ppt\/slides\/slide\d+\.xml$/.test(n); })
    .sort(function(a,b){ var ai=parseInt(a.match(/slide(\d+)/)[1]), bi=parseInt(b.match(/slide(\d+)/)[1]); return ai-bi; });
  var parts = [];
  for(var i=0;i<slideFiles.length;i++){
    var xml = await zip.files[slideFiles[i]].async('string');
    // 简单抓所有 <a:t>...</a:t> 文本节点
    var texts = []; var re=/<a:t[^>]*>([^<]*)<\/a:t>/g; var m;
    while((m=re.exec(xml))!==null){ if(m[1]) texts.push(m[1]); }
    parts.push('【第 '+(i+1)+' 页】\n'+texts.join(' '));
  }
  return parts.join('\n\n');
}

async function generateSummary(){
  if(!hasSumInput.value || sumGenerating.value) return;
  sumGenerating.value = true;
  sumResultHTML.value = '';
  try {
    var source = '';
    if(sumExtractedText.value) source += '【文件来源：'+sumFileName.value+'】\n'+sumExtractedText.value+'\n\n';
    if(sumPaste.value.trim()) source += (source?'【粘贴补充】\n':'') + sumPaste.value.trim();
    // 截断保护：HY-3 上下文有限，超过 30000 字符做截断
    if(source.length > 30000){ source = source.slice(0, 30000) + '\n\n…（内容过长已截断，仅摘要前 3 万字符）'; }

    var lengthHint = ({
      brief:  '约 100 字，抓住最核心 1-2 个观点。',
      normal: '约 300 字，含 3-5 条关键要点。',
      long:   '约 600 字以上，含背景一段、关键要点列表（5-8条）、潜在风险或建议。'
    })[sumLength.value] || '约 300 字。';
    var styleHint = ({
      normal:  '风格：通用清晰中文摘要。'+lengthHint,
      detail:  '风格：详细解读，结构化输出（背景 / 关键要点列表 / 风险或建议）。'+lengthHint,
      meeting: '风格：会议纪要，按「议题 → 关键决议 → 待办事项（带负责人占位）→ 下次跟进」结构输出。'+lengthHint
    })[sumStyle.value] || ('风格：通用中文摘要。'+lengthHint);

    var sysPrompt = '你是专业的内容摘要助手。'+styleHint+'\n要求：①忠实于原文，不臆造数据；②直接输出 HTML 片段，使用 <h2><h3><p><ul><li><strong> 标签即可（不要写 <html>/<head>/<body>，不要写 markdown，不要套 ```html```）；③首行用 <h2> 输出文档标题（基于内容提炼）；④如果原文是英文，摘要也用中文（除非用户明确要英文）。';

    var resp = await fetch('https://ntsgw.woa.com/api/sso/llm-proxy-service/api/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({
        model:'HY-3-Preview',
        messages:[
          {role:'system', content:sysPrompt},
          {role:'user', content:source}
        ],
        temperature:0.3,
        max_tokens:4000
      })
    });
    if(!resp.ok){ var err=await resp.json().catch(function(){return{};}); throw new Error(err.error?.message || 'HTTP '+resp.status); }
    var data = await resp.json();
    var html = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    // 清掉代码块包装
    html = html.replace(/^```(?:html)?\s*/i,'').replace(/```\s*$/,'').trim();
    if(!/^</.test(html)){ html = '<p>'+escapeHTML(html).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>'; }
    sumResultHTML.value = html;
  } catch(e){
    sumResultHTML.value = '<h2 style="color:#e34d59">生成失败</h2><p>'+escapeHTML(e.message||String(e))+'</p><p>请检查网络或重试。</p>';
  } finally {
    sumGenerating.value = false;
  }
}

// 手动 undo 栈（浏览器 execCommand undo 对列表/标题等格式变更有时不生效）
let sumUndoStack = [];
let sumRedoStack = [];
function sumSaveState(){
  if(!sumEditor.value) return;
  sumUndoStack.push(sumEditor.value.innerHTML);
  if(sumUndoStack.length>50) sumUndoStack.shift();
  sumRedoStack = [];
}
function sumUndo(){
  if(!sumEditor.value || !sumUndoStack.length) return;
  sumRedoStack.push(sumEditor.value.innerHTML);
  sumEditor.value.innerHTML = sumUndoStack.pop();
  sumResultHTML.value = sumEditor.value.innerHTML;
}
function sumRedo(){
  if(!sumEditor.value || !sumRedoStack.length) return;
  sumUndoStack.push(sumEditor.value.innerHTML);
  sumEditor.value.innerHTML = sumRedoStack.pop();
  sumResultHTML.value = sumEditor.value.innerHTML;
}
function onSumEdit(e){
  sumResultHTML.value = e.target.innerHTML;
}
function sumExec(cmd, val){
  if(sumEditor.value) sumEditor.value.focus();
  sumSaveState(); // 先存当前状态到 undo 栈
  try { document.execCommand(cmd, false, val || null); } catch(e){}
  if(sumEditor.value) sumResultHTML.value = sumEditor.value.innerHTML;
}
function sumRegenerate(){ if(!sumGenerating.value) generateSummary(); }

// 把当前编辑器 HTML 转 docx（用 docx 库构造，下载 .docx）
async function sumDownloadDocx(){
  if(!window.docx){ MessagePlugin.error('docx 库未就绪'); return; }
  if(!sumEditor.value){ MessagePlugin.warning('请先生成摘要'); return; }
  var html = sumEditor.value.innerHTML;
  // 简单 HTML → docx 段落转换
  var tmp = document.createElement('div'); tmp.innerHTML = html;
  var D = window.docx;
  var children = [];
  function runsFromInline(node){
    var runs = [];
    node.childNodes.forEach(function(n){
      if(n.nodeType===3){ runs.push(new D.TextRun({text:n.nodeValue})); return; }
      if(n.nodeType!==1) return;
      var tag = n.tagName.toLowerCase();
      var inner = (n.textContent||'');
      var opts = {text:inner};
      if(tag==='strong'||tag==='b') opts.bold=true;
      if(tag==='em'||tag==='i') opts.italics=true;
      if(tag==='u') opts.underline={};
      if(tag==='br'){ runs.push(new D.TextRun({break:1})); return; }
      // 嵌套混合样式：递归一层
      if(n.children && n.children.length){
        n.childNodes.forEach(function(c){
          if(c.nodeType===3) runs.push(new D.TextRun(Object.assign({}, opts, {text:c.nodeValue})));
          else if(c.nodeType===1){
            var ctag=c.tagName.toLowerCase();
            var o2=Object.assign({},opts,{text:c.textContent});
            if(ctag==='strong'||ctag==='b') o2.bold=true;
            if(ctag==='em'||ctag==='i') o2.italics=true;
            if(ctag==='u') o2.underline={};
            runs.push(new D.TextRun(o2));
          }
        });
      } else {
        runs.push(new D.TextRun(opts));
      }
    });
    return runs;
  }
  Array.from(tmp.children).forEach(function(el){
    var tag = el.tagName.toLowerCase();
    if(tag==='h1'){ children.push(new D.Paragraph({children:runsFromInline(el), heading:D.HeadingLevel.HEADING_1})); }
    else if(tag==='h2'){ children.push(new D.Paragraph({children:runsFromInline(el), heading:D.HeadingLevel.HEADING_2})); }
    else if(tag==='h3'){ children.push(new D.Paragraph({children:runsFromInline(el), heading:D.HeadingLevel.HEADING_3})); }
    else if(tag==='ul'||tag==='ol'){
      Array.from(el.querySelectorAll('li')).forEach(function(li){
        children.push(new D.Paragraph({children:runsFromInline(li), bullet:{level:0}}));
      });
    }
    else if(tag==='p'||tag==='div'){
      children.push(new D.Paragraph({children:runsFromInline(el)}));
    }
    else {
      children.push(new D.Paragraph({children:[new D.TextRun({text:el.textContent||''})]}));
    }
  });
  var doc = new D.Document({ sections:[{ properties:{}, children:children }] });
  try {
    var blob = await D.Packer.toBlob(doc);
    var filename = (sumFileName.value ? sumFileName.value.replace(/\.[^.]+$/,'') : '智能摘要') + '_summary.docx';
    if(window.saveAs) saveAs(blob, filename);
    else {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    MessagePlugin.success('已导出 '+filename);
  } catch(e){ MessagePlugin.error('导出失败: '+e.message); }
}

// 把摘要 HTML 包成 PPT 共用的 fullHtml，复用「我的作品」/「共享」/「分享给同事」整套链路
function summaryToFullHtml(){
  var inner = sumEditor.value ? sumEditor.value.innerHTML : sumResultHTML.value;
  var title = (sumFileName.value || '智能摘要') + ' · Summary';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+escapeHTML(title)+'</title><style>body{font-family:"PingFang SC",-apple-system,sans-serif;max-width:760px;margin:40px auto;padding:24px;color:#1d2733;line-height:1.85;font-size:14px}h1{font-size:22px}h2{font-size:18px;color:#0052d9}h3{font-size:16px}ul,ol{margin:8px 0 8px 24px}strong{color:#1d2733}</style></head><body>'+inner+'</body></html>';
}

async function sumSaveMine(){
  if(!sumResultHTML.value || sumSavingMine.value) return;
  if(!realStaff.value || !realStaff.value.staffName){ MessagePlugin.warning('未识别到 OA 身份，「我的作品」仅在 hr claw 线上生效'); return; }
  sumSavingMine.value = true;
  try {
    var resp = await fetch('/api/ppt/save', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ html: summaryToFullHtml(), title: (sumFileName.value||'智能摘要')+' · Summary', prompt: '智能摘要', kind:'mine', type:'summary' })
    });
    var data = await resp.json();
    if(!data.ok){ MessagePlugin.error('保存失败: '+(data.message||data.error)); return; }
    MessagePlugin.success('已保存到「我的作品」（在 AI 工具广场 → PPT 生成器下方）');
    loadMyPpts();
  } catch(e){ MessagePlugin.error('保存失败: '+e.message); }
  finally { sumSavingMine.value = false; }
}

function sumOpenShare(){
  if(!sumResultHTML.value){ MessagePlugin.warning('请先生成摘要'); return; }
  // 复用 PPT 的分享弹窗：先把摘要塞进 pptHtml，再走 openSharePeople 流程
  pptHtml.value = summaryToFullHtml();
  pptGenerated.value = true; pptGenerating.value = false;
  pptImportedName.value = (sumFileName.value||'智能摘要')+' · Summary';
  openSharePeople();
}

// ===== 站内分享给同事（按英文名匹配 + 右上角 to-do 通知）=====
// SHARE_PEOPLE 仅作启动兜底；loadUsers() 会用真实名单覆盖。选人列表实际派生自 users（reactive）。
let SHARE_PEOPLE = ['qianjunshan','annawzhang','danniewu','jiachunngu','melodyxuxu','oscarwei','rrayzhao','tobyliao','vvvliu','emilykhoo','lokyeezou'];
let sharePeopleOpen = ref(false);
let sharePeopleQuery = ref('');
let sharePeopleSel = ref([]);
let sharePeopleSending = ref(false);
let filteredPeople = computed(function(){
  var q = sharePeopleQuery.value.trim().toLowerCase();
  var names = users.value.filter(function(u){ return !u.disabled; }).map(function(u){ return u.name; });
  return names.filter(function(p){ return !q || p.toLowerCase().indexOf(q)>=0; });
});
function avatarStyle(name){
  var palette=['#0963d7','#00a870','#e37318','#834ec2','#d9462a','#0594fa','#eb2f96','#13a8a8','#7c4dff'];
  var idx=0; for(var i=0;i<name.length;i++) idx=(idx+name.charCodeAt(i))%palette.length;
  return 'display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;background:'+palette[idx];
}
function openSharePeople(){
  if(!pptHtml.value){ MessagePlugin.warning('请先生成或导入一个演示文稿'); return; }
  pptHtml.value = captureEditedHtml();
  sharePeopleSel.value = [];
  sharePeopleQuery.value = '';
  sharePeopleOpen.value = true;
}
async function sendShareToPeople(){
  if(!sharePeopleSel.value.length || sharePeopleSending.value) return;
  sharePeopleSending.value = true;
  try {
    var resp = await fetch('/api/ppt/share-to', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ html: pptHtml.value, title: (pptImportedName.value||pptPrompt.value.slice(0,40)||'AI 演示文稿'), to: sharePeopleSel.value })
    });
    var data = await resp.json();
    if(data.ok){ MessagePlugin.success('已分享给 '+data.delivered+' 人，对方待办将收到提醒'); sharePeopleOpen.value=false; }
    else MessagePlugin.error('分享失败: '+(data.message||data.error));
  } catch(e){ MessagePlugin.error('分享失败: '+e.message); }
  finally { sharePeopleSending.value = false; }
}

// 收件箱（收到的分享）
let inboxShares = ref([]);
// PPT 文稿分享(无kind/kind!=='share'&&!=='assignment')→醒目；论坛话题(kind==='share')→温和；工作项(kind==='assignment')由 headerTodoItems 单独渲染
let inboxPptShares = computed(function(){ return inboxShares.value.filter(function(x){ return x.kind!=='share' && x.kind!=='assignment' && x.kind!=='blackboard'; }); });
let inboxForumShares = computed(function(){ return inboxShares.value.filter(function(x){ return x.kind==='share'; }); });
let inboxBlackboard = computed(function(){ return inboxShares.value.filter(function(x){ return x.kind==='blackboard'; }); });
async function loadInbox(){
  try {
    var resp = await fetch('/api/inbox', { credentials:'include' });
    var data = await resp.json();
    if(data.ok) inboxShares.value = data.list || [];
  } catch(e){ /* ignore */ }
}
async function openInboxShare(s){
  // 标记已读 + 载入编辑器
  try { await fetch('/api/inbox/'+s.id+'/read', { method:'POST', credentials:'include' }); } catch(e){}
  try {
    var resp = await fetch('/api/ppt/'+s.pptId, { credentials:'include' });
    var data = await resp.json();
    if(data && data.html){
      currentView.value='aitools'; aitoolsActiveTab.value='ppt';
      pptHtml.value = data.html; pptGenerated.value=true; pptGenerating.value=false;
      pptImportedName.value = data.title||''; pptShareUrl.value='';
      todoOpen.value=false;
      MessagePlugin.success('已打开 '+s.from+' 分享的演示文稿');
    } else { window.open('/share/ppt/'+s.pptId,'_blank'); }
  } catch(e){ window.open('/share/ppt/'+s.pptId,'_blank'); }
  loadInbox();
}
async function openInboxForum(s){
  // 标记已读 + 跳转 P9 论坛
  try { await fetch('/api/inbox/'+s.id+'/read', { method:'POST', credentials:'include' }); } catch(e){}
  currentView.value='p10'; p10ActiveTab.value='recent';
  todoOpen.value=false;
  loadShares();
  loadInbox();
  MessagePlugin.success('已前往论坛查看 '+s.from+' 的分享');
}

// ===== INIT =====
// 先拉名单 + 准入判定（名单驱动准入；判定完成前主体不渲染）
loadUsers();
checkAccess();
initRealIdentity();
loadCustomTemplates();
// 并行拉取真实数据，全部到位后再让 LLM 做 AI 洞察（保证它说的是真数字）
Promise.all([
  loadSharedPpts(),
  loadMyPpts(),
  loadInbox(),
  loadShares(),
  loadAssignments(),
  loadBiweekly()
]).then(function(){ refreshAI(); refreshAIDrivenKPIs(); }).catch(function(){ refreshAI(); });
// 轮询：每 30 秒刷新收件箱 + 工作项，保证 to-do 联动
setInterval(function(){ if(realStaff.value && realStaff.value.staffName){ loadInbox(); loadAssignments(); } }, 30000);
if(currentRole.value!=='admin')currentView.value='dashboard';

const app = createApp({
  setup(){
    return {
      currentRole,currentUserName,currentView,showLogin,loginError,isManager,isUser,realStaff,
      panels,panelName,panelNameEn,viewIdForPanel,panelOkCount,activePanel,statusColor,statusText,panelDetailHTML,panelCardMetrics,openPanelIds,togglePanelDetail,goToView,setQaConfig,
      qaSettingsOpen,qaConfig,qaOptions,
      kpiItems,kpiActiveId,toggleKPIDetail,kpiDetailTitle,kpiChartHTML,aiKpiRefreshing,refreshAIDrivenKPIs,
      aiSummaryHTML,aiRefreshing,refreshAI,formalUsers,internUsers,loginAs,openLogin,onMenuChange,
      p2Ownership,p2ActiveTab,p2TabContentHTML,
      p4ActiveTab,p4FeedbackTab,p4FaqTab,p4TrendTab,p4Metrics,fbForm,submitFeedback,resetFbForm,onFbUpload,
      metricsThisWeek,metricsAvgSat,metricsAvgAccuracy,metricsAvgSpeed,metricsSolvedRate,metricsNPS,metricsDailyChartHTML,csvUploadStatus,csvFileInput,onCsvUpload,
      p4HourlyChartHTML,p4DailyChartHTML,p4DataFreshness,p4DataFreshnessColumns,
      p4Feedbacks,p4FeedbackActions,p4FeedbackKpisHTML,actionsForFeedback,hasFeedbackAction,removeFeedbackAction,p4SatisfactionReasons,p4SatisfactionKpisHTML,p4SatisfactionChartHTML,
      p4AuditRuns,p4AuditColumns,p4Audits,p4AuditTableColumns,p4Faqs,p4FaqTableColumns,
      p4LexSearch,p4LexLevel,p4LexiconDisplay,p4LexTotal,p4LexiconColumns,filterP4Lexicon,
      p4Alerts,p4ActiveAlert,p4AlertTableColumns,p4AlertStatsHTML,p4SlaRiskHTML,p4OpenAlertsSorted,p4OwnerRisk,formatSla,
      p4CustomModules,addP4Module,onP4TabChange,resolveAlert,resolveFaqIssue,addP4Faq,markFeedback,
      p4SyncStatus,p4SyncDetail,p4SyncUser,sync98008Data,on98008FrameLoad,send98008Msg,
      feedbackLastSync,feedbackSyncSource,cacheFeedbacksToServer,loadFeedbackCache,
      show98008Diag,diagMsgLog,diagMsgCount,diagResult,diagIframeStatus,runDiag98008,
      opsTickets,opsManual,opsLastMonth,opsModules,opsExceptions,opsOpenTickets,refreshOpenTickets,
      metricsModuleStats,metricsDeptStats,metricsLowScoreList,metricsLikedList,metricsImproveList,
      aitoolsActiveTab,
      sumFileInput,sumEditor,sumFileName,sumFileSize,sumExtractedText,sumTextLen,sumPaste,sumStyle,sumLength,sumGenerating,sumResultHTML,sumSavingMine,hasSumInput,sumWordCount,
      triggerSumImport,onSumFileSelected,generateSummary,onSumEdit,sumExec,sumUndo,sumRedo,sumRegenerate,sumDownloadDocx,sumSaveMine,sumOpenShare,
      pptPrompt,pptGenerating,pptGenerated,pptHtml,pptIframe,generatePPT,pptRegenerate,pptDownloadHTML,pptDownloadPPTX,onPptIframeLoad,pptClear,pptCommitEdits,
      pptTemplates,loadTemplate,customTemplates,allTemplates,loadCustomTemplates,addCustomTemplate,deleteCustomTpl,buildTplThumbHtml,
      pptFileInput,pptImportedName,triggerPptImport,onPptImport,pptCommitEdits,pptSyncing,captureEditedHtml,
      pptSharing,pptShareUrl,sharedPpts,pptShare,copyShareUrl,loadSharedPpts,openSharedPpt,copyPptLink,canDeletePpt,deleteSharedPpt,formatPptTime,
      myPpts,pptSavingMine,pptSaveMine,loadMyPpts,openMyPpt,deleteMyPpt,
      SHARE_PEOPLE,sharePeopleOpen,sharePeopleQuery,sharePeopleSel,sharePeopleSending,filteredPeople,avatarStyle,openSharePeople,sendShareToPeople,
      inboxShares,inboxPptShares,inboxForumShares,inboxBlackboard,loadInbox,openInboxShare,openInboxForum,
      p10ActiveTab,p10CatOptions,
      shareInput,shareParsing,shareSubmitting,sharePreview,shareForm,shareList,
      parseShareInput,onShareInputChange,onShareInputPaste,submitShare,loadShares,likeShare,postComment,canDeleteShare,deleteShare,
      todoOpen,notifOpen,notifCount,headerTodoItems,upcomingAssignments,nextTodo,myOpenAssignments,assignmentFilter,assignmentMode,assignmentChainStages,assignmentForm,assignmentSubmitting,assignmentAssigneeOptions,peopleSelectOptions,priorityOptions,canCreateAssignment,assignments,visibleAssignments,filteredAssignments,openAssignmentCount,dueSoonAssignmentCount,doneAssignmentCount,formatDue,dueDistance,isUrgent,isOverdue,openAssignment,submitAssignment,markAssignment,canUpdateAssignment,canDeleteAssignment,canUpdateChain,getActiveStage,getDueAt,deleteAssignment,loadAssignments,assignmentStatusLabel,
      bulletins,bulletinContent,bulletinSending,latestBulletin,loadBulletins,postBulletin,
      quickNotes,newQuickNote,addQuickNote,
      customCards,customCardsOpen,availableCards,addCustomCard,
      meetings,
      mhRightTab,mhTab,meetingPage,meetingList,meetingToday,meetingTodayCount,meetingTotalCount,meetingWeekCount,meetingLivingCount,meetingHostCount,meetingHostNames,meetingTotalPages,pagedMeetings,meetingPeriodLabel,formatMeetingTime,formatMeetingPeriod,isMeetingLive,isMeetingPast,joinMeeting,openCreateMeeting,recentMeetingNotes,openMeetingNote,biweeklyFilling,biweeklySaving,biweeklyPeriod,biweeklySections,biweeklyPublished,biweeklyData,biweeklyLastUpdate,biweeklyFillWithData,biweeklyPublish,exportBiweekly,
      blackboardItems,bbPostOpen,bbContent,bbMentions,bbSending,loadBlackboard,postBlackboard,confirmBlackboard,
      accessChecked,accessAllowed,accessName,
      visibleUsers,userColumns,editUserDialogVisible,editUserForm,openAddUser,openEditUser,saveEditUser,disableUser,removeUser,loadUsers,
      matrixTab,matrixHasChanges,matrixFormalRows,matrixInternRows,activeMatrixRows,matrixScopeTitle,permissionOptions,getPermValue,permissionLabel,setPerm,canEditPerm,permButtonClass,saveMatrixChanges,cancelMatrixChanges,
      logs,logColumns,
      approvals,myRequests,visibleMyRequests,pendingCount,approve,reject,
      chatMessages,chatUserMessages,chatInputVisible,chatInputText,chatSendReason,initChat,
    };
  }
});

// 捕获 Vue 组件渲染/setup 抛错，显示到页面而不是白屏
app.config.errorHandler = function(err, instance, info){
  try { __sscShowError('[Vue ' + info + '] ' + (err && (err.stack || err.message || err))); } catch(e){}
  console.error('[Vue errorHandler]', info, err);
};
try {
  app.use(TDesign);
  app.mount('#app');
} catch(e){
  try { __sscShowError('[mount] ' + (e && (e.stack||e.message||e))); } catch(_){}
  throw e;
}
})();
