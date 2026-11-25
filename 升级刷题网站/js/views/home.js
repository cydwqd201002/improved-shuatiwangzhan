/* ==========================================================================
   views/home.js —— 首页：继续上次 / 总览 / 题库列表 / 快捷入口
   ========================================================================== */
window.HZQ = window.HZQ || {};
HZQ.views = HZQ.views || {};

/* 内置题库已移除：顶部旧副标题在运行时换成通用说明，index.html 本身不改。 */
(function () {
  var sub = document.querySelector('.brand small');
  if (sub) sub.textContent = '上传你的题库';
})();

HZQ.views.home = (function () {
  'use strict';
  var M = HZQ.util, U = HZQ.ui, el = M.el;

  function greet() {
    var h = new Date().getHours();
    if (h < 5) return '还没睡？';
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  /* ------------------------------ 功能搜索 ------------------------------ */
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\s\u3000]/g, '').replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
  }
  function isSubsequence(q, text) {
    var i = 0;
    for (var j = 0; j < text.length && i < q.length; j++) if (text.charAt(j) === q.charAt(i)) i++;
    return i === q.length;
  }
  function editDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      var t = prev; prev = cur; cur = t;
    }
    return prev[b.length];
  }
  function bestDistance(q, text) {
    if (!text) return 99;
    if (text.length <= q.length + 3) return editDistance(q, text);
    var best = 99;
    var min = Math.max(1, q.length - 2), max = Math.min(text.length, q.length + 2);
    for (var len = min; len <= max; len++) {
      for (var i = 0; i + len <= text.length && i < 80; i++) {
        best = Math.min(best, editDistance(q, text.substr(i, len)));
        if (best === 0) return 0;
      }
    }
    return best;
  }
  function featureScore(f, q) {
    var title = norm(f.title), desc = norm(f.desc), kw = norm(f.keywords);
    var all = title + desc + kw;
    if (title === q) return 1200;
    if (title.indexOf(q) >= 0) return 1000 - Math.min(title.indexOf(q), 40);
    if (kw.indexOf(q) >= 0) return 850 - Math.min(kw.indexOf(q), 40);
    if (all.indexOf(q) >= 0) return 700 - Math.min(all.indexOf(q), 40);
    if (isSubsequence(q, all)) return 560 + q.length * 4;
    var d = bestDistance(q, title + desc);
    var ratio = 1 - d / Math.max(q.length, 1);
    return ratio >= 0.5 ? 380 + ratio * 180 : 0;
  }
  function searchFeatures(q) {
    var list = featureList();
    var query = norm(q);
    if (!query) return list;
    return list.map(function (f) { return { f: f, s: featureScore(f, query) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (x) { return x.f; });
  }
  function featureList() {
    var settings = HZQ.store.settings();
    var last = HZQ.store.lastSession();
    var canResume = last && last.bankId && HZQ.store.resumable(last.bankId);
    var list = [
      { id: 'continue', title: '继续上次练习', desc: '回到上次停下的题号，保留进度', keywords: '继续 上次 断点 恢复 进度', icon: 'play', group: '学习', action: function () {
        if (canResume) HZQ.app.go('#/quiz/' + last.bankId);
        else M.toast('没有可以继续的练习', 'bad');
      } },
      { id: 'wrong', title: '错题本', desc: '按轮次重练错题，查看错题详情', keywords: '错题 错题本 重练 复习 加强', icon: 'refresh', group: '学习', href: '#/wrong' },
      { id: 'favorites', title: '重点收藏', desc: '查看收藏题目，按钮显示答案和解析', keywords: '收藏 重点 标星 答案 解析', icon: 'star', group: '学习', href: '#/favorites' },
      { id: 'upload', title: '上传题库', desc: '导入 JSON、TXT、Markdown、Word、Excel 或 PDF', keywords: '上传 导入 题库 文件 json txt markdown word excel pdf', icon: 'upload', group: '题库', action: function () { if (HZQ.upload) HZQ.upload.open(); } },
      { id: 'points', title: '积分中心', desc: '查看积分、佩戴称号、用积分解锁酷炫主题', keywords: '积分 称号 主题 兑换 学习 激励 排名', icon: 'trophy', group: '成长', action: function () { if (HZQ.points) HZQ.points.openCenter(); } },
      { id: 'ai', title: 'AI 答疑设置', desc: '填入自己的 API Key，在答题时让 AI 讲解题目', keywords: 'ai 人工智能 api key 答疑 讲解 模型 deepseek openai', icon: 'lightbulb', group: '工具', action: function () { if (HZQ.ai) HZQ.ai.openSettings(); else HZQ.app.go('#/settings'); } },
      { id: 'search', title: '搜题', desc: '关键词、模糊匹配、历史记录、预览', keywords: '搜题 搜索 查找 题目 模糊 补全', icon: 'search', group: '工具', href: '#/search' },
      { id: 'history', title: '成绩记录', desc: '正确率曲线、薄弱知识点和建议', keywords: '成绩 记录 曲线 正确率 建议 历史', icon: 'chart', group: '记录', href: '#/history' },
      { id: 'compare', title: '成绩对比', desc: '上传其他用户成绩 JSON 做对比', keywords: '成绩 对比 其他用户 上传 排名', icon: 'chart', group: '记录', href: '#/history' },
      { id: 'quality', title: '数据体检', desc: '检查题库异常，查看原因和处理建议', keywords: '数据 体检 异常 题库 检查 修复', icon: 'shield', group: '工具', href: '#/quality' },
      { id: 'trial', title: '用户测试', desc: '按场景完成任务并填写体验建议', keywords: '测试 体验 反馈 建议 任务', icon: 'checkCircle', group: '工具', href: '#/trial' },
      { id: 'pomodoro', title: '番茄钟', desc: '开始专注计时，自动安排休息', keywords: '番茄 番茄钟 计时 专注 休息 pomodoro', icon: 'clock', group: '工具', action: function () { HZQ.app.startPomodoro('work'); } },
      { id: 'pomodoro-break', title: '开始番茄钟休息', desc: '进入短暂休息倒计时', keywords: '番茄 休息 放松 计时', icon: 'pause', group: '工具', action: function () { HZQ.app.startPomodoro('break'); } },
      { id: 'theme', title: '切换深色 / 浅色模式', desc: '一键切换当前主题', keywords: '深色 浅色 夜间 主题 模式 护眼', icon: 'moon', group: '外观', action: function () { HZQ.app.toggleTheme(); } },
      { id: 'theme-settings', title: '主题颜色设置', desc: '跟随系统、海盐蓝、森林绿、樱花粉等', keywords: '主题 颜色 风格 皮肤 樱花 森林 海洋', icon: 'settings', group: '外观', href: '#/settings' },
      { id: 'ui', title: '界面自定义', desc: '缩放、透明度、颜色、字体、间距和顺序', keywords: '界面 自定义 缩放 透明度 字体 间距 顺序 布局', icon: 'settings', group: '外观', href: '#/settings' },
      { id: 'audio', title: '背景音乐', desc: '静心音、细雨、森林、夜航等环境音', keywords: '背景 音乐 声音 环境 雨声 森林 放松 歌单', icon: 'bookmark', group: '外观', href: '#/settings' },
      { id: 'language', title: '界面语言', desc: '中文、English、日本語', keywords: '语言 中文 英文 英语 日语 english japanese', icon: 'settings', group: '外观', href: '#/settings' },
      { id: 'comfort', title: '防眩晕模式', desc: '关闭动画和渐变，适合车上或晃动场景', keywords: '防眩晕 眩晕 晃动 车 船 火车 动画', icon: 'shield', group: '外观', action: function () {
        var v = !HZQ.store.settings().antiDizzy;
        HZQ.store.setSetting('antiDizzy', v); HZQ.app.applyUI();
        M.toast(v ? '防眩晕模式已开启' : '防眩晕模式已关闭', 'ok');
      } },
      { id: 'dark-prompt', title: '日落后提醒深色模式', desc: '天黑时主动询问是否切换深色', keywords: '日落 天黑 傍晚 深色 提醒 夜间', icon: 'moon', group: '外观', action: function () {
        var v = !HZQ.store.settings().darkPrompt;
        HZQ.store.setSetting('darkPrompt', v);
        M.toast(v ? '日落后提醒已开启' : '日落后提醒已关闭', 'ok');
      } },
      { id: 'break', title: '连续做题休息提醒', desc: '连续 2 小时提醒休息，考试模式除外', keywords: '休息 提醒 两小时 连续 做题 健康', icon: 'clock', group: '健康', action: function () {
        var v = !HZQ.store.settings().breakReminder;
        HZQ.store.setSetting('breakReminder', v);
        M.toast(v ? '休息提醒已开启' : '休息提醒已关闭', 'ok');
      } },
      { id: 'account', title: '登录 / 注册本地账户', desc: '每个账户保存自己的进度、错题和成绩', keywords: '登录 注册 账户 用户 数据 密码', icon: 'user', group: '设置', action: function () {
        if (HZQ.profile && HZQ.profile.current()) HZQ.app.go('#/settings');
        else if (HZQ.profile) HZQ.profile.dialog('login', function () { location.reload(); });
      } },
      { id: 'export', title: '导出 / 备份数据', desc: '下载 JSON、系统分享或复制备份内容', keywords: '导出 备份 下载 分享 复制 数据', icon: 'download', group: '设置', href: '#/settings' },
      { id: 'clear', title: '清空数据', desc: '按时间、轮次、单条清理错题/收藏/成绩等', keywords: '清空 删除 清理 数据 历史 错题 收藏', icon: 'trash', group: '设置', href: '#/settings' },
      { id: 'settings', title: '设置与备份', desc: '主题、界面、音乐、账户、语言、导出和清理', keywords: '设置 备份 选项 配置', icon: 'settings', group: '设置', href: '#/settings' }
    ];

    // 每个已上传的题库动态加入搜索入口，不再写死 Java / Web。
    HZQ.data.banks.forEach(function (b) {
      list.push({
        id: 'bank-' + b.id, title: b.title,
        desc: b.questionCount + ' 道题 · ' + (b.chapters || []).length + ' 个章节',
        keywords: '题库 练习 ' + b.title + ' ' + (b.desc || ''),
        icon: 'book', group: '题库', href: '#/bank/' + b.id
      });
      list.push({
        id: 'exam-' + b.id, title: '模拟考试 · ' + b.title,
        desc: '随机组卷、打乱顺序、限时交卷', keywords: '考试 模拟 试卷 限时 随机 ' + b.title,
        icon: 'shield', group: '考试', href: '#/bank/' + b.id + '?mode=exam'
      });
      list.push({
        id: 'chapter-' + b.id, title: '章节练习 · ' + b.title,
        desc: '按章节 / 知识点筛选，每章独立进度和正确率', keywords: '章节 知识点 分类 难度 ' + b.title,
        icon: 'layers', group: '学习', href: '#/bank/' + b.id + '?mode=chapter'
      });
      list.push({
        id: 'random-' + b.id, title: '随机练习 · ' + b.title,
        desc: '从「' + b.title + '」随机抽 10 道题', keywords: '随机 练习 十道 ' + b.title,
        icon: 'shuffle', group: '学习', action: function () {
          HZQ.app.start({ bankId: b.id, mode: 'random', limit: 10 });
        }
      });
    });

    return list;
  }

  function featureSearch() {
    var wrap = el('div', { class: 'card pad feature-search' });
    var row = el('div', { class: 'feature-search-row' });
    var icon = el('span', { class: 'feature-search-icon', html: M.icon('search') });
    var input = el('input', {
      class: 'input feature-input', type: 'search',
      placeholder: '搜索功能：番茄钟、考试模式、错题本、深色模式…',
      'aria-label': '搜索功能',
      autocomplete: 'off'
    });
    var allBtn = U.btn('全部功能', {
      small: true, kind: 'ghost', icon: 'grid',
      onClick: function () { input.value = ''; paint(''); open(); input.focus(); }
    });
    row.appendChild(icon);
    row.appendChild(input);
    row.appendChild(allBtn);
    wrap.appendChild(row);
    var panel = el('div', { class: 'feature-results', hidden: 'hidden' });
    wrap.appendChild(panel);

    function open() { panel.removeAttribute('hidden'); }
    function close() { panel.setAttribute('hidden', 'hidden'); }
    function paint(query) {
      panel.innerHTML = '';
      var hits = searchFeatures(query);
      var head = el('div', { class: 'feature-results-head' });
      head.appendChild(el('span', { text: query ? '找到 ' + hits.length + ' 个功能' : '全部功能 · ' + hits.length }));
      head.appendChild(el('span', { class: 'tiny muted', text: '点击即可打开' }));
      panel.appendChild(head);
      if (!hits.length) {
        panel.appendChild(el('div', { class: 'feature-empty', text: '没有找到对应功能，换个说法试试，例如“考试”“休息”“深色”。' }));
        return;
      }
      var list = el('div', { class: 'feature-list' });
      hits.forEach(function (f) {
        var item = el('button', { class: 'feature-item', type: 'button' });
        var ic = el('span', { class: 'feature-ic', html: M.icon(f.icon || 'grid') });
        item.appendChild(ic);
        var body = el('div', { class: 'feature-body' });
        var title = el('div', { class: 'feature-title' });
        title.appendChild(el('span', { text: f.title }));
        if (f.group) title.appendChild(el('span', { class: 'tag line', text: f.group }));
        body.appendChild(title);
        body.appendChild(el('div', { class: 'feature-desc', text: f.desc }));
        item.appendChild(body);
        item.appendChild(el('span', { class: 'feature-go', html: M.icon('right') }));
        item.addEventListener('click', function () {
          close();
          if (f.action) f.action();
          else if (f.href) HZQ.app.go(f.href);
        });
        list.appendChild(item);
      });
      panel.appendChild(list);
    }
    input.addEventListener('focus', function () { paint(input.value); open(); });
    input.addEventListener('click', function () { paint(input.value); open(); });
    input.addEventListener('input', function () { paint(input.value); open(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = panel.querySelector('.feature-item');
        if (first) first.click();
      } else if (e.key === 'Escape') {
        close();
        input.blur();
      }
    });
    paint('');
    return wrap;
  }

  function render() {
    var root = el('div');
    var g = HZQ.store.globalStats();
    var ov = HZQ.data.overview();
    root.appendChild(featureSearch());

    /* ---------- Hero ---------- */
    var hero = el('div', { class: 'hero' });
    var heroIn = el('div', { class: 'in' });
    heroIn.appendChild(el('h1', { text: greet() + '，今天也来刷几道？' }));
    heroIn.appendChild(el('p', {
      text: ov.banks
        ? ov.banks + ' 个题库 · ' + ov.questions + ' 道题 · 全部保存在这台设备上'
        : '还没有题库 · 上传你的第一份题库，就能开始练习'
    }));
    var nums = el('div', { class: 'nums' });
    [['累计作答', g.done], ['总正确率', g.done ? M.pct(g.accuracy) : '—'],
     ['错题本', g.wrongCount], ['练习次数', g.sessions]].forEach(function (p) {
      var d = el('div');
      d.appendChild(el('div', { class: 'v', text: String(p[1]) }));
      d.appendChild(el('div', { class: 'l', text: p[0] }));
      nums.appendChild(d);
    });
    heroIn.appendChild(nums);
    hero.appendChild(heroIn);
    root.appendChild(hero);

    if (!HZQ.store.storageUsable()) {
      var warn = el('div', { class: 'feedback na' });
      warn.innerHTML = M.icon('alert') + '<div class="fb-body">当前浏览器禁用了本地存储，进度不会被保存（不影响本次答题）。</div>';
      warn.style.marginTop = '0';
      warn.style.marginBottom = '14px';
      root.appendChild(warn);
    }

    /* ---------- 继续上次 ---------- */
    var resume = null;
    HZQ.data.banks.forEach(function (b) {
      var snap = HZQ.store.resumable(b.id);
      if (!snap) return;
      if (!resume || snap.id > resume.snap.id) resume = { bank: b, snap: snap };
    });
    if (resume) {
      var st = null;
      try {
        var s = HZQ.engine.restore(resume.snap);
        if (s) { HZQ.engine.pause(s); st = HZQ.engine.stats(s); }
      } catch (e) { st = null; }
      if (st) {
        var card = el('button', { class: 'resume', onclick: function () { HZQ.app.go('#/quiz/' + resume.bank.id); } });
        card.appendChild(U.ring(st.answered / Math.max(1, st.total), 46, Math.round(st.answered / Math.max(1, st.total) * 100) + '%'));
        var txt = el('div', { class: 'txt' });
        txt.appendChild(el('div', { class: 't1', text: '继续上次：' + (resume.snap.bankTitle || resume.bank.title) + ' · ' + resume.snap.modeName }));
        txt.appendChild(el('div', {
          class: 't2',
          text: '停在第 ' + (resume.snap.index + 1) + ' 题 · 已答 ' + st.answered + '/' + st.total + ' 题 · ' + M.agoText(resume.snap.startedAt || Date.now())
        }));
        card.appendChild(txt);
        var go = el('span', { class: 'tag pri' });
        go.innerHTML = M.icon('play') + '<span>接着做</span>';
        card.appendChild(go);
        root.appendChild(card);
      }
    }

    /* ---------- 积分成长 ---------- */
    if (HZQ.points) root.appendChild(HZQ.points.banner());

    /* ---------- 题库列表 ---------- */
    root.appendChild(U.secTitle('我的题库'));
    if (HZQ.upload) root.appendChild(HZQ.upload.card());
    var list = el('div');
    HZQ.data.banks.forEach(function (b) {
      list.appendChild(bankCard(b));
    });
    if (!HZQ.data.banks.length) {
      list.appendChild(el('p', {
        class: 'tiny muted',
        style: 'text-align:center;padding:18px 8px 4px;line-height:1.9',
        html: '还没有题库。点击上面的「选择文件」上传，或先 <a href="#" data-upload-sample>下载示例题库</a> 看看格式。'
      }));
      var sample = list.querySelector('[data-upload-sample]');
      if (sample) sample.addEventListener('click', function (e) {
        e.preventDefault();
        if (HZQ.upload) HZQ.upload.downloadSample();
      });
    }
    root.appendChild(list);

    /* ---------- 快捷入口 ---------- */
    root.appendChild(U.secTitle('我的'));
    var qg = el('div', { class: 'quickgrid' });
    var latest = HZQ.store.history()[0];
    var allClear = latest && latest.total > 0 && latest.wrong === 0 && latest.blank === 0 && g.wrongCount === 0;
    var issueCount = HZQ.views.quality ? HZQ.views.quality.count() : ov.issues;
    var pts = HZQ.points ? HZQ.points.summary() : null;
    var quickDefs = [
      {
        key: 'wrong', icon: g.wrongCount ? 'refresh' : 'checkCircle', cls: g.wrongCount ? 'bad' : 'ok',
        title: '错题本',
        sub: g.wrongCount ? (g.wrongCount + ' 道待攻克') : (allClear ? '上一轮全对，保持住' : '还没有错题'),
        onClick: function () { HZQ.app.go('#/wrong'); }
      },
      { key: 'favorites', icon: 'star', cls: 'star', title: '重点收藏', sub: g.favCount + ' 道已标记', onClick: function () { HZQ.app.go('#/favorites'); } },
      {
        key: 'points', icon: 'trophy', cls: 'star', title: '积分中心',
        sub: pts ? (pts.points + ' 积分 · ' + pts.title.name) : '称号 / 主题 / 积分',
        onClick: function () { if (HZQ.points) HZQ.points.openCenter(); }
      },
      { key: 'history', icon: 'chart', cls: 'ok', title: '成绩记录', sub: g.sessions + ' 次练习', onClick: function () { HZQ.app.go('#/history'); } },
      {
        key: 'ai', icon: 'lightbulb', cls: 'ok', title: 'AI 答疑',
        sub: HZQ.ai && HZQ.ai.hasKey() ? '已配置 · 答题时可问' : '填入自己的 API Key',
        onClick: function () { if (HZQ.ai) HZQ.ai.openSettings(); }
      },
      { key: 'search', icon: 'search', cls: '', title: '搜题', sub: '关键词 / 模糊匹配', onClick: function () { HZQ.app.openSearch(); } },
      {
        key: 'quality', icon: issueCount ? 'shield' : 'checkCircle', cls: issueCount ? '' : 'ok',
        title: '数据体检', sub: issueCount ? (issueCount + ' 道题异常') : '题库检查通过',
        onClick: function () { HZQ.app.go('#/quality'); }
      },
      { key: 'settings', icon: 'settings', cls: '', title: '设置与备份', sub: '主题 / 导出 / 清空', onClick: function () { HZQ.app.go('#/settings'); } }
    ];
    var order = HZQ.store.settings().uiQuickOrder || [];
    quickDefs.sort(function (a, b) {
      var ia = order.indexOf(a.key), ib = order.indexOf(b.key);
      if (ia < 0) ia = 999;
      if (ib < 0) ib = 999;
      return ia - ib;
    });
    quickDefs.forEach(function (d) {
      qg.appendChild(quick(d.icon, d.cls, d.title, d.sub, d.onClick));
    });
    root.appendChild(qg);

    root.appendChild(el('p', {
      class: 'tiny muted',
      style: 'margin-top:26px;text-align:center;line-height:1.9',
      html: '题库和练习进度都只保存在你自己的浏览器里，不上传任何服务器。<br>支持 JSON、TXT、Markdown、Word、Excel、PDF 等格式。'
    }));

    return root;
  }

  function quick(icon, cls, title, sub, onClick) {
    var b = el('button', { class: 'quick', onclick: onClick });
    b.appendChild(el('span', { class: 'ic ' + (cls || ''), html: M.icon(icon) }));
    var t = el('div');
    t.appendChild(el('div', { class: 't', text: title }));
    t.appendChild(el('div', { class: 's', text: sub }));
    b.appendChild(t);
    return b;
  }

  function bankCard(b) {
    var p = HZQ.store.bankProgress(b.id);
    var card = el('button', { class: 'tile', style: 'margin-bottom:10px', onclick: function () { HZQ.app.go('#/bank/' + b.id); } });
    var inner = el('div', { class: 'bankcard' });

    var body = el('div', { class: 'body' });
    var name = el('div', { class: 'name' });
    name.appendChild(el('span', { text: b.title }));
    if (b.questionCount > b.scorableCount) {
      name.appendChild(el('span', { class: 'tag warn', text: (b.questionCount - b.scorableCount) + ' 题不计分' }));
    }
    body.appendChild(name);
    body.appendChild(el('div', { class: 'desc', text: b.desc }));

    var meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'tag', text: b.questionCount + ' 道题' }));
    meta.appendChild(el('span', { class: 'tag', text: (b.chapters || []).length + ' 个章节' }));
    var tc = b.typeCount || {};
    if (tc.single) meta.appendChild(el('span', { class: 'tag line', text: '单选 ' + tc.single }));
    if (tc.multiple) meta.appendChild(el('span', { class: 'tag line', text: '多选 ' + tc.multiple }));
    if (tc.judge) meta.appendChild(el('span', { class: 'tag line', text: '判断 ' + tc.judge }));
    body.appendChild(meta);

    var prog = el('div', { class: 'prog' });
    var cap = el('div', { class: 'cap' });
    cap.appendChild(el('span', { html: '已答 <b>' + p.done + '</b> / ' + p.total }));
    cap.appendChild(el('span', { text: p.done ? ('正确率 ' + M.pct(p.accuracy)) : '还没开始' }));
    prog.appendChild(cap);
    var bar = el('div', { class: 'bar' + (p.done && p.accuracy >= 0.8 ? ' ok' : '') });
    bar.appendChild(el('i', { style: 'width:' + (p.ratio * 100).toFixed(1) + '%' }));
    prog.appendChild(bar);
    body.appendChild(prog);

    var acts = el('div', { class: 'row-2', style: 'margin-top:12px' });
    var wrongN = b.questions.filter(function (q) { return HZQ.store.isWrong(q.id); }).length;
    if (wrongN) {
      var wb = U.btn('错题重练 ' + wrongN, { small: true, kind: 'ghost', icon: 'refresh', onClick: function (e) {
        e.stopPropagation();
        HZQ.app.start({ bankId: b.id, mode: 'wrong' });
      } });
      acts.appendChild(wb);
    }
    if (p.done) {
      acts.appendChild(U.btn(p.done >= p.total ? '再刷一遍' : '继续练习', { small: true, kind: 'primary', icon: 'play', onClick: function (e) {
        e.stopPropagation();
        HZQ.app.go('#/bank/' + b.id);
      } }));
    }
    if (b.user && HZQ.upload) {
      acts.appendChild(U.btn('删除', { small: true, kind: 'ghost', icon: 'trash', onClick: function (e) {
        e.stopPropagation();
        HZQ.upload.remove(b.id);
      } }));
    }
    body.appendChild(acts);

    inner.appendChild(body);
    inner.appendChild(U.ring(p.ratio, 64, p.done ? M.pct(p.ratio) : '0%'));
    card.appendChild(inner);
    return card;
  }

  return { render: render };
})();

/* ==========================================================================
   题库上传 / 导入
   --------------------------------------------------------------------------
   支持：JSON、TXT / Markdown、CSV、Word(.docx)、Excel(.xlsx)、PDF。
   - TXT / Markdown / Word / PDF 走同一套“按题号 + 选项 + 答案”的容错解析；
   - CSV / Excel 优先识别表头（序号、题干、A-D、答案、解析、章节）；
   - JSON 支持本应用原生的 banks / questions 结构。
   所有题库只保存在浏览器 localStorage，不上传服务器。
   ========================================================================== */
HZQ.upload = (function () {
  'use strict';

  var M = HZQ.util, U = HZQ.ui, el = M.el;
  var ACCEPT = '.json,.txt,.md,.markdown,.csv,.docx,.xlsx,.pdf';
  var MAX_SIZE = 20 * 1024 * 1024;
  var fileInput = null;
  var pdfLoading = null;

  var TYPE_LABEL = { single: '单选题', multiple: '多选题', judge: '判断题' };

  /* ------------------------------ 通用工具 ------------------------------ */
  function extOf(name) {
    var m = /\.([^.]+)$/.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }
  function baseName(name) {
    return String(name || '未命名题库').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, ' ').trim() || '未命名题库';
  }
  function normalizeText(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ');
  }
  function trimBlock(s) {
    return normalizeText(s).replace(/[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '').trim();
  }
  function oneLine(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/\s+/g, ' ').trim();
  }
  function letter(i) { return String.fromCharCode(65 + i); }
  function typeFromText(s) {
    s = String(s || '');
    if (/多\s*选|多项\s*选择|multiple/i.test(s)) return 'multiple';
    if (/判\s*断|对\s*错|true\s*\/\s*false|judge/i.test(s)) return 'judge';
    if (/单\s*选|单项\s*选择|single/i.test(s)) return 'single';
    return '';
  }
  function labelOfType(t) { return TYPE_LABEL[t] || '单选题'; }
  function isTrueWord(s) { return /^(对|正确|是|真|√|✓|t|true|yes|y)$/i.test(String(s || '').trim()); }
  function isFalseWord(s) { return /^(错|错误|否|假|×|✗|x|f|false|no|n)$/i.test(String(s || '').trim()); }
  function judgeKeyOf(s) {
    var t = String(s || '').replace(/[。．.\s]/g, '');
    if (isTrueWord(t)) return 'A';
    if (isFalseWord(t)) return 'B';
    return '';
  }
  function isJudgeOptions(opts) {
    if (!opts || opts.length !== 2) return false;
    var a = oneLine(opts[0].text), b = oneLine(opts[1].text);
    return (isTrueWord(a) && isFalseWord(b)) || (isTrueWord(b) && isFalseWord(a));
  }
  function looksLikeAnswer(s) {
    s = String(s || '').trim();
    if (!s) return false;
    if (judgeKeyOf(s)) return true;
    if (/^[A-Ha-h](?:\s*[、,，\/;；\s]*[A-Ha-h])*$/.test(s)) return true;
    if (/^[A-Ha-h]{2,6}$/.test(s)) return true;
    if (/^[1-9]$/.test(s)) return true;
    return false;
  }

  /* ------------------------------ 选项 / 答案 ------------------------------ */
  function splitOptionText(s) {
    s = String(s || '').trim();
    if (!s) return null;
    var m = /^([A-Ha-h])\s*[.、．)）:：]\s*(.*)$/.exec(s);
    if (m) return { key: m[1].toUpperCase(), text: m[2].trim() };
    return null;
  }

  /** 从一行里拆出 A. … B. … 这种连续选项 */
  function splitOptionLine(line) {
    var s = String(line || '').replace(/^\s*[-*+]\s*/, '').trim();
    if (!s) return null;
    var re = /(^|[\s　])([A-Ha-h])\s*[.、．)）:：]\s*/g;
    var ms = [], m;
    while ((m = re.exec(s))) {
      ms.push({
        key: m[2].toUpperCase(),
        start: m.index + (m[1] ? m[1].length : 0),
        end: re.lastIndex
      });
    }
    if (!ms.length || ms[0].start > 2) return null;
    var out = [];
    for (var i = 0; i < ms.length; i++) {
      // 跳过文本里“e.g.”这种看起来像选项的片段：只接受和上一个选项相邻的字母
      if (out.length && ms[i].key.charCodeAt(0) !== out[out.length - 1].key.charCodeAt(0) + 1) continue;
      var text = s.slice(ms[i].end, i + 1 < ms.length ? ms[i + 1].start : s.length).trim();
      out.push({ key: ms[i].key, text: text });
    }
    return out.length ? out : null;
  }

  function normalizeOptions(raw, rawQuestion) {
    var list = [];
    if (Array.isArray(raw)) {
      raw.forEach(function (o, i) {
        if (o === null || o === undefined) return;
        if (typeof o === 'string') {
          var parsed = splitOptionText(o);
          if (parsed) list.push(parsed);
          else if (o.trim()) list.push({ key: letter(i), text: o.trim() });
        } else if (typeof o === 'object') {
          var text = o.text !== undefined ? o.text : (o.value !== undefined ? o.value : (o.content !== undefined ? o.content : o.title));
          if (text === undefined || text === null) return;
          list.push({ key: String(o.key || o.label || o.letter || letter(i)).toUpperCase(), text: String(text).trim() });
        }
      });
    } else if (raw && typeof raw === 'object') {
      Object.keys(raw).forEach(function (k) {
        var v = raw[k];
        if (v === null || v === undefined) return;
        if (typeof v === 'object') v = v.text !== undefined ? v.text : (v.value !== undefined ? v.value : '');
        if (String(v).trim() || /^[A-Ha-h]$/.test(k)) {
          list.push({ key: String(k).toUpperCase(), text: String(v).trim() });
        }
      });
    } else if (rawQuestion) {
      // 兼容 options: 缺省，但题目对象上有 A / B / C / D 字段
      Object.keys(rawQuestion).forEach(function (k) {
        if (/^[A-Ha-h]$/.test(k) && String(rawQuestion[k] || '').trim()) {
          list.push({ key: k.toUpperCase(), text: String(rawQuestion[k]).trim() });
        }
      });
    }

    // 保留带字母但内容为空的选项：原始题库里确实有这种数据，丢掉会让答案对不上。
    list = list.filter(function (o) {
      return o && (o.text !== '' || /^[A-H]$/i.test(String(o.key || '')));
    }).map(function (o) {
      var text = oneLine(o.text);
      var parsed = splitOptionText(text);
      if (parsed) {
        text = parsed.text;
        if (!o.key || !/^[A-H]$/i.test(String(o.key))) o.key = parsed.key;
      }
      return { key: String(o.key || '').toUpperCase(), text: text };
    });

    var used = {};
    list.forEach(function (o) {
      if (!/^[A-H]$/.test(o.key) || used[o.key]) o.key = '';
      if (o.key) used[o.key] = 1;
    });
    list.forEach(function (o) {
      if (o.key) return;
      for (var i = 0; i < 20; i++) {
        var k = letter(i);
        if (!used[k]) { used[k] = 1; o.key = k; break; }
      }
    });

    list.sort(function (a, b) { return a.key.localeCompare(b.key); });
    return list;
  }

  function parseAnswer(raw, options, type) {
    if (raw === null || raw === undefined || raw === '') return [];
    if (raw === true) return ['A'];
    if (raw === false) return ['B'];
    if (Array.isArray(raw)) {
      var merged = [];
      raw.forEach(function (x) {
        parseAnswer(x, options, type).forEach(function (k) {
          if (merged.indexOf(k) < 0) merged.push(k);
        });
      });
      return merged.sort();
    }
    if (typeof raw === 'number') {
      if (raw >= 1 && raw <= options.length) return [options[raw - 1].key];
      return [];
    }

    var s = oneLine(raw);
    if (!s) return [];

    // 答案直接写了选项原文
    var exact = options.filter(function (o) { return oneLine(o.text) === s; });
    if (exact.length) return [exact[0].key];

    if (type === 'judge' || isJudgeOptions(options) || !options.length) {
      var jk = judgeKeyOf(s);
      if (jk) return [jk];
    }

    var up = s.toUpperCase();
    if (/^[A-H](?:\s*[、,，\/;；\s]*[A-H])*$/.test(up)) {
      return up.match(/[A-H]/g).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort();
    }
    if (/^[A-H]{2,6}$/.test(up)) return up.split('').sort();
    if (!/[A-Z]{3,}/.test(up)) {
      var fm = up.match(/[A-H]/);
      if (fm) return [fm[0]];
    }
    if (/^[1-9]$/.test(s) && options.length) {
      var idx = Number(s) - 1;
      return options[idx] ? [options[idx].key] : [];
    }
    return [];
  }

  function answerRawText(raw) {
    if (raw === null || raw === undefined) return '';
    if (Array.isArray(raw)) return raw.join('、');
    if (raw === true) return '正确';
    if (raw === false) return '错误';
    return oneLine(raw);
  }

  /** 把来源各异的题目对象统一成内部结构 */
  function finalizeQuestion(raw, ctx) {
    ctx = ctx || {};
    raw = raw || {};
    var stem = trimBlock(raw.stem !== undefined ? raw.stem : (raw.question !== undefined ? raw.question : (raw.content !== undefined ? raw.content : raw.title)));
    var options = normalizeOptions(raw.options !== undefined ? raw.options : raw.choices, raw);
    var typeText = raw.typeLabel || raw.type || '';
    var type = typeFromText(typeText);
    var answerRaw = raw.answerRaw !== undefined ? raw.answerRaw
      : (raw.answer !== undefined ? raw.answer
        : (raw.correctAnswer !== undefined ? raw.correctAnswer
          : (raw.correct !== undefined ? raw.correct
            : (raw.key !== undefined ? raw.key : raw.answers))));

    if (!options.length && (type === 'judge' || judgeKeyOf(answerRaw))) {
      options = [{ key: 'A', text: '正确' }, { key: 'B', text: '错误' }];
      type = 'judge';
    }
    if (!type && isJudgeOptions(options)) type = 'judge';

    var answer = parseAnswer(answerRaw, options, type);
    if (!type) type = answer.length > 1 ? 'multiple' : 'single';

    var flags = [];
    if (!stem) flags.push({ code: 'no-stem' });
    if (!options.length) flags.push({ code: 'no-options' });
    else if (options.length < 2) flags.push({ code: 'too-few-options' });
    if (!answer.length) flags.push({ code: 'missing-answer' });
    else {
      var keys = {};
      options.forEach(function (o) { keys[o.key] = 1; });
      var bad = answer.filter(function (k) { return !keys[k]; });
      if (bad.length) flags.push({ code: 'answer-not-in-options', detail: bad.join('') });
    }
    if (type === 'multiple' && answer.length === 1) flags.push({ code: 'multiple-single-answer' });
    if (type === 'single' && answer.length > 1) flags.push({ code: 'single-multi-answer' });

    var fatal = ['no-stem', 'no-options', 'too-few-options', 'missing-answer', 'answer-not-in-options'];
    var scorable = !flags.some(function (f) { return fatal.indexOf(f.code) >= 0; });

    return {
      no: Number(raw.no) || ctx.no || 0,
      stem: stem,
      options: options,
      answer: answer,
      answerRaw: answerRawText(answerRaw),
      explanation: trimBlock(raw.explanation !== undefined ? raw.explanation
        : (raw.analysis !== undefined ? raw.analysis
          : (raw.analyze !== undefined ? raw.analyze : raw.remark))),
      type: type,
      typeLabel: labelOfType(type),
      chapterTitle: oneLine(raw.chapterTitle || raw.chapter || raw.category || raw.section || ctx.chapterTitle || ''),
      flags: flags,
      scorable: scorable
    };
  }

  /* ------------------------------ 文本 / Markdown ------------------------------ */
  var RE_ANSWER = /^\s*(?:\*\*)?\s*[【\[]?\s*(?:正确|参考)?答案\s*[】\]]?\s*(?:\*\*)?\s*[：:]?\s*(.*)$/i;
  var RE_ANSWER_EN = /^\s*(?:\*\*)?\s*(?:correct\s*)?answer\s*[】\]]?\s*(?:\*\*)?\s*[：:]\s*(.*)$/i;
  var RE_EXPLAIN = /^\s*(?:\*\*)?\s*[【\[]?\s*(?:答案)?(?:解析|分析|说明)\s*[】\]]?\s*(?:\*\*)?\s*[：:]?\s*(.*)$/i;
  var RE_EXPLAIN_EN = /^\s*(?:\*\*)?\s*(?:explanation|analysis)\s*[：:]\s*(.*)$/i;

  function questionStart(line) {
    var m;
    line = String(line || '').replace(/^\s+/, '');
    if ((m = /^###\s*(\d{1,4})\s*[.、．)）]\s*(.*)$/.exec(line))) return { no: m[1], rest: m[2] };
    if ((m = /^第\s*(\d{1,4})\s*题\s*[.、．:：]?\s*(.*)$/.exec(line))) return { no: m[1], rest: m[2] };
    if ((m = /^[（(]\s*(\d{1,4})\s*[)）]\s*[.、．]?\s*(.*)$/.exec(line))) return { no: m[1], rest: m[2] };
    if ((m = /^【\s*(\d{1,4})\s*】\s*(.*)$/.exec(line))) return { no: m[1], rest: m[2] };
    if ((m = /^(\d{1,4})\s*[.、．)）:：]\s*(.*)$/.exec(line))) return { no: m[1], rest: m[2] };
    return null;
  }

  function stripTypeMarker(text) {
    return String(text || '')
      .replace(/^\s*[【\[（(]?\s*(单选题|多选题|判断题|单项选择题|多项选择题|单项选择|多项选择|单选|多选|判断)\s*[】\]）)]?\s*[.、．:：-]?\s*/, '')
      .trim();
  }
  function typeFromPrefix(text) {
    var m = /^\s*[【\[（(]?\s*(单选题|多选题|判断题|单项选择题|多项选择题|单项选择|多项选择|单选|多选|判断)\s*[】\]）)]?/.exec(String(text || ''));
    if (!m) return '';
    var t = m[1];
    if (/多\s*选|多项/.test(t)) return 'multiple';
    if (/判\s*断/.test(t)) return 'judge';
    if (/单\s*选|单项/.test(t)) return 'single';
    return '';
  }

  function parseText(text, meta) {
    var src = normalizeText(text);
    var lines = src.split('\n');
    var bank = {
      title: meta.title || '',
      desc: '',
      chapters: [],
      questions: [],
      warnings: []
    };
    var chapterTitles = [];
    var currentChapter = '';
    var q = null;
    var section = '';
    var inCode = false;

    function ensureChapter(title) {
      title = oneLine(title);
      if (!title) return;
      if (chapterTitles.indexOf(title) < 0) chapterTitles.push(title);
      currentChapter = title;
    }

    function flush() {
      if (!q) return;
      var fq = finalizeQuestion(q, { chapterTitle: q.chapterTitle || currentChapter, no: q.no });
      if (fq.stem || fq.options.length) bank.questions.push(fq);
      q = null;
      section = '';
    }

    function startQuestion(no, rest) {
      flush();
      var type = typeFromPrefix(rest);
      var stem = type ? stripTypeMarker(rest) : rest;
      q = {
        no: Number(no) || (bank.questions.length + 1),
        stem: stem || '',
        options: [],
        answerRaw: '',
        explanation: '',
        chapterTitle: currentChapter,
        typeLabel: type ? labelOfType(type) : ''
      };
      section = 'stem';
    }

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i];
      var line = rawLine.replace(/\s+$/, '');
      var trim = line.trim();

      if (/^```/.test(trim)) {
        inCode = !inCode;
        if (q) q[section === 'explain' ? 'explanation' : 'stem'] += (q[section === 'explain' ? 'explanation' : 'stem'] ? '\n' : '') + line;
        continue;
      }
      if (inCode) {
        if (q) {
          var key = section === 'explain' ? 'explanation' : 'stem';
          q[key] += (q[key] ? '\n' : '') + line;
        }
        continue;
      }

      // 题库标题（一级标题）
      var h1 = /^#\s+(.+?)\s*$/.exec(trim);
      if (h1) {
        if (!bank.title) bank.title = oneLine(h1[1]);
        continue;
      }

      // 题目标题（### 1. 单选题）优先于章节标题
      var qs = questionStart(line);
      if (qs) {
        startQuestion(qs.no, qs.rest);
        continue;
      }

      // 章节标题（## / ### 非题号）
      var h2 = /^#{2,3}\s+(.+?)\s*$/.exec(trim);
      if (h2) {
        flush();
        ensureChapter(h2[1]);
        continue;
      }

      var am = RE_ANSWER.exec(trim) || RE_ANSWER_EN.exec(trim);
      if (am && q) {
        q.answerRaw = oneLine(am[1]);
        section = 'answer';
        continue;
      }
      var em = RE_EXPLAIN.exec(trim) || RE_EXPLAIN_EN.exec(trim);
      if (em && q) {
        q.explanation = oneLine(em[1]);
        section = 'explain';
        continue;
      }

      var opts = splitOptionLine(line);
      if (opts && q && (section === 'stem' || section === 'options' || section === 'answer' || !section)) {
        opts.forEach(function (o) { q.options.push(o); });
        section = 'options';
        continue;
      }

      if (/^(-{3,}|={3,}|\*{3,})$/.test(trim)) {
        if (q && (q.answerRaw || q.options.length)) flush();
        continue;
      }

      if (!q) {
        // 文件头说明（> 共 120 题……）当副标题/描述
        if (/^>\s*/.test(trim)) {
          bank.subtitle = trim.replace(/^>\s*/, '');
          continue;
        }
        // 没有 # 标题时，用第一行较短的陈述文字当标题（问句通常不是标题）
        if (trim && !bank.title && bank.questions.length === 0 && !/[：:]/.test(trim) && !/[？?。！!]$/.test(trim) && trim.length <= 60) {
          bank.title = oneLine(trim);
        }
        continue;
      }

      if (!trim) {
        if (section === 'stem' && q.stem) q.stem += '\n';
        else if (section === 'explain' && q.explanation) q.explanation += '\n';
        continue;
      }

      if (section === 'options' && q.options.length) {
        var last = q.options[q.options.length - 1];
        last.text = (last.text ? last.text + ' ' : '') + trim;
        continue;
      }
      if (section === 'answer') {
        if (!q.answerRaw) q.answerRaw = trim;
        else q.explanation = (q.explanation ? q.explanation + '\n' : '') + trim;
        section = q.answerRaw ? 'explain' : 'answer';
        continue;
      }
      if (section === 'explain') {
        q.explanation = (q.explanation ? q.explanation + '\n' : '') + trim;
        continue;
      }
      q.stem = (q.stem ? q.stem + '\n' : '') + trim;
    }
    flush();

    if (!bank.questions.length) {
      bank.questions = parseLooseBlocks(lines, currentChapter);
    }

    if (!bank.title) bank.title = meta.title || '未命名题库';
    if (!bank.desc) bank.desc = bank.subtitle || ('从「' + meta.fileName + '」导入，共 ' + bank.questions.length + ' 题。');

    if (chapterTitles.length) {
      bank.chapters = chapterTitles.map(function (t, i) { return { title: t, order: i + 1 }; });
    }
    return finishDraft(bank, meta);
  }

  /** 没有题号时：按空行切块，每块当成一道题 */
  function parseLooseBlocks(lines, chapterTitle) {
    var blocks = [], cur = [];
    lines.forEach(function (line) {
      if (!line.trim()) {
        if (cur.length) { blocks.push(cur); cur = []; }
      } else {
        cur.push(line);
      }
    });
    if (cur.length) blocks.push(cur);

    var out = [];
    var chapter = chapterTitle || '';
    blocks.forEach(function (block) {
      var head = block[0].trim();
      var h = /^#{2,3}\s+(.+?)\s*$/.exec(head);
      if (h) {
        chapter = oneLine(h[1]);
        block = block.slice(1);
        if (!block.length) return;
      }
      if (/^#\s+/.test(head)) block = block.slice(1);
      if (!block.length) return;

      var hasAnswer = block.some(function (l) {
        var t = l.trim();
        return RE_ANSWER.test(t) || RE_ANSWER_EN.test(t);
      });
      var hasOption = block.some(function (l) { return !!splitOptionLine(l); });
      if (!hasAnswer && !hasOption) return;

      var q = { stem: '', options: [], answerRaw: '', explanation: '', chapterTitle: chapter, typeLabel: '' };
      var section = 'stem';
      var inCode = false;
      block.forEach(function (line) {
        var trim = line.trim();
        if (/^```/.test(trim)) {
          inCode = !inCode;
          q[section === 'explain' ? 'explanation' : 'stem'] += (q[section === 'explain' ? 'explanation' : 'stem'] ? '\n' : '') + line;
          return;
        }
        if (inCode) {
          var k = section === 'explain' ? 'explanation' : 'stem';
          q[k] += (q[k] ? '\n' : '') + line;
          return;
        }
        var am = RE_ANSWER.exec(trim) || RE_ANSWER_EN.exec(trim);
        if (am) { q.answerRaw = oneLine(am[1]); section = 'answer'; return; }
        var em = RE_EXPLAIN.exec(trim) || RE_EXPLAIN_EN.exec(trim);
        if (em) { q.explanation = oneLine(em[1]); section = 'explain'; return; }
        var opts = splitOptionLine(line);
        if (opts) { opts.forEach(function (o) { q.options.push(o); }); section = 'options'; return; }
        if (!trim) return;
        if (section === 'options' && q.options.length) {
          q.options[q.options.length - 1].text = (q.options[q.options.length - 1].text + ' ' + trim).trim();
        } else if (section === 'answer') {
          if (!q.answerRaw) q.answerRaw = trim;
          else { q.explanation = (q.explanation ? q.explanation + '\n' : '') + trim; section = 'explain'; }
        } else if (section === 'explain') {
          q.explanation = (q.explanation ? q.explanation + '\n' : '') + trim;
        } else {
          q.stem = (q.stem ? q.stem + '\n' : '') + trim;
        }
      });
      var fq = finalizeQuestion(q, { chapterTitle: chapter, no: out.length + 1 });
      if (fq.stem || fq.options.length) out.push(fq);
    });
    return out;
  }

  /* ------------------------------ JSON ------------------------------ */
  function parseJSONValue(obj, meta) {
    var rawBanks = [];
    if (Array.isArray(obj)) {
      if (obj.length && (Array.isArray(obj[0].questions) || Array.isArray(obj[0].banks))) rawBanks = obj;
      else rawBanks = [{ title: meta.title, questions: obj }];
    } else if (obj && Array.isArray(obj.banks)) {
      rawBanks = obj.banks;
    } else if (obj && Array.isArray(obj.questions)) {
      rawBanks = [obj];
    } else if (obj && Array.isArray(obj.items)) {
      rawBanks = [{ title: obj.title || meta.title, desc: obj.desc || obj.description, questions: obj.items }];
    } else if (obj && Array.isArray(obj.data)) {
      rawBanks = [{ title: obj.title || meta.title, desc: obj.desc || obj.description, questions: obj.data }];
    } else {
      throw new Error('JSON 里没有找到 questions / banks 数组');
    }

    return rawBanks.map(function (b, bi) {
      b = b || {};
      var draft = {
        title: b.title || b.name || meta.title,
        desc: b.desc || b.description || '',
        chapters: Array.isArray(b.chapters) ? b.chapters : [],
        questions: []
      };
      var chapterMap = {};
      draft.chapters.forEach(function (c) {
        if (c && typeof c === 'object' && c.id) chapterMap[String(c.id)] = oneLine(c.title || c.name);
      });
      var qs = Array.isArray(b.questions) ? b.questions : (Array.isArray(b.items) ? b.items : []);
      qs.forEach(function (raw, qi) {
        if (!raw || typeof raw !== 'object') return;
        var chTitle = raw.chapterTitle || raw.chapter || raw.category || raw.section || '';
        if (!chTitle && raw.chapterId) chTitle = chapterMap[String(raw.chapterId)] || '';
        var q = finalizeQuestion(raw, { no: qi + 1, chapterTitle: chTitle });
        if (q.stem || q.options.length) draft.questions.push(q);
      });
      return finishDraft(draft, meta);
    }).filter(function (d) { return d.questions.length; });
  }

  /* ------------------------------ CSV / 表格 ------------------------------ */
  function parseCSV(text) {
    text = normalizeText(text);
    var sample = text.split('\n').slice(0, 6).join('\n');
    var tabs = (sample.match(/\t/g) || []).length;
    var comma = (sample.match(/,/g) || []).length;
    var semi = (sample.match(/;/g) || []).length;
    var delim = '\t';
    if (tabs === 0 && (comma > 0 || semi > 0)) delim = semi > comma ? ';' : ',';

    var rows = [], row = [], cell = '', inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') { cell += '"'; i++; }
          else inQuotes = false;
        } else cell += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delim) {
        row.push(cell); cell = '';
      } else if (ch === '\n') {
        row.push(cell); rows.push(row); row = []; cell = '';
      } else if (ch !== '\r') {
        cell += ch;
      }
    }
    row.push(cell);
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows.map(function (r) { return r.map(function (c) { return c.trim(); }); });
  }

  function headerKey(s) {
    return oneLine(s).toLowerCase().replace(/[\s\u3000_\-（）()【】\[\]:：]/g, '');
  }
  function optionHeaderKey(s) {
    var n = headerKey(s);
    var m = /^(?:选项|option)?([a-h])$/.exec(n);
    return m ? m[1].toUpperCase() : '';
  }

  function buildHeaderMap(row) {
    var map = { optionCols: [] };
    row.forEach(function (h, i) {
      var n = headerKey(h);
      if (!n) return;
      if (/^(题干|题目|问题|试题|题目内容|question|stem|content|title)$/.test(n)) map.stem = i;
      else if (/^(答案|正确答案|参考答案|answer|correctanswer|key)$/.test(n)) map.answer = i;
      else if (/^(解析|答案解析|解释|说明|analysis|explanation|remark)$/.test(n)) map.explanation = i;
      else if (/^(题型|题目类型|类型|type)$/.test(n)) map.type = i;
      else if (/^(章节|分类|知识分类|chapter|category|section)$/.test(n)) map.chapter = i;
      else if (/^(序号|编号|no|index|number)$/.test(n)) map.no = i;
      else if (/^(选项|options|全部选项|choices)$/.test(n)) map.options = i;
      else {
        var ok = optionHeaderKey(h);
        if (ok) map.optionCols.push({ index: i, key: ok });
      }
    });
    return map.stem !== undefined ? map : null;
  }

  function splitCombinedOptions(s) {
    s = String(s || '').trim();
    if (!s) return [];
    var direct = splitOptionLine(s);
    if (direct) return direct;
    var parts = s.split(/\n|\||；|;/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length < 2) {
      // 用连续空格分隔的“A. … B. …”已在 splitOptionLine 处理
      return parts.map(function (x, i) {
        var p = splitOptionText(x);
        return p || { key: letter(i), text: x };
      });
    }
    return parts.map(function (x, i) {
      var p = splitOptionText(x);
      return p || { key: letter(i), text: x };
    });
  }

  function draftFromRows(rows, meta) {
    rows = (rows || []).filter(function (r) { return r && r.some(function (c) { return String(c || '').trim(); }); });
    if (!rows.length) return null;

    var headerIndex = -1, map = null;
    for (var i = 0; i < Math.min(rows.length, 8); i++) {
      var m = buildHeaderMap(rows[i]);
      if (m) { headerIndex = i; map = m; break; }
    }

    var draft = { title: meta.title, desc: '', chapters: [], questions: [] };

    if (map) {
      for (var r = headerIndex + 1; r < rows.length; r++) {
        var row = rows[r];
        var stem = row[map.stem] || '';
        if (!stem) continue;
        var options = [];
        map.optionCols.sort(function (a, b) { return a.key.localeCompare(b.key); });
        map.optionCols.forEach(function (oc) {
          if (String(row[oc.index] || '').trim()) options.push({ key: oc.key, text: row[oc.index] });
        });
        if (!options.length && map.options !== undefined) {
          options = splitCombinedOptions(row[map.options]);
        }
        var q = finalizeQuestion({
          stem: stem,
          options: options,
          answer: map.answer !== undefined ? row[map.answer] : '',
          explanation: map.explanation !== undefined ? row[map.explanation] : '',
          type: map.type !== undefined ? row[map.type] : '',
          chapterTitle: map.chapter !== undefined ? row[map.chapter] : ''
        }, { no: map.no !== undefined ? row[map.no] : (r - headerIndex) });
        if (q.stem || q.options.length) draft.questions.push(q);
      }
    } else {
      // 无表头：尝试“题干 + 若干选项 + 答案 [+ 解析]”的固定列
      for (var k = 0; k < rows.length; k++) {
        var cells = rows[k];
        if (cells.length < 4) continue;
        var start = /^\d+$/.test(cells[0]) ? 1 : 0;
        if (start >= cells.length - 2) continue;
        var answerIdx = -1;
        for (var c = cells.length - 1; c >= start + 2; c--) {
          if (looksLikeAnswer(cells[c])) { answerIdx = c; break; }
        }
        if (answerIdx < 0) continue;
        var optCells = cells.slice(start + 1, answerIdx);
        if (optCells.length < 2) continue;
        var opts = optCells.map(function (text, oi) {
          var p = splitOptionText(text);
          return p || { key: letter(oi), text: text };
        }).filter(function (o) { return o.text; });
        if (opts.length < 2) continue;
        var q2 = finalizeQuestion({
          stem: cells[start],
          options: opts,
          answer: cells[answerIdx],
          explanation: cells.slice(answerIdx + 1).join(' '),
          chapterTitle: ''
        }, { no: start ? cells[0] : k + 1 });
        if (q2.stem) draft.questions.push(q2);
      }
    }

    if (!draft.questions.length) {
      // 最后兜底：把表格按行拼回文本，走文本解析
      var text = rows.map(function (r) { return r.join('\t'); }).join('\n');
      return parseText(text, meta);
    }
    return finishDraft(draft, meta);
  }

  /* ------------------------------ DOCX / XLSX（ZIP） ------------------------------ */
  function inflateRaw(bytes) {
    return new Promise(function (resolve, reject) {
      if (!window.DecompressionStream) {
        reject(new Error('当前浏览器不支持解压 Office 文档，请升级浏览器，或把文件另存为 TXT / CSV 后重试。'));
        return;
      }
      try {
        var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        new Response(stream).arrayBuffer().then(function (buf) {
          resolve(new Uint8Array(buf));
        }, reject);
      } catch (e) { reject(e); }
    });
  }

  function unzip(buffer) {
    return new Promise(function (resolve, reject) {
      try {
        var view = new DataView(buffer);
        var len = view.byteLength;
        var eocd = -1;
        for (var i = len - 22; i >= Math.max(0, len - 65557); i--) {
          if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error('文件不是有效的 Office 文档（ZIP 结构损坏）');
        var count = view.getUint16(eocd + 10, true);
        var cdOffset = view.getUint32(eocd + 16, true);
        var entries = {};
        var p = cdOffset;
        for (var n = 0; n < count; n++) {
          if (view.getUint32(p, true) !== 0x02014b50) break;
          var method = view.getUint16(p + 10, true);
          var compSize = view.getUint32(p + 20, true);
          var nameLen = view.getUint16(p + 28, true);
          var extraLen = view.getUint16(p + 30, true);
          var commentLen = view.getUint16(p + 32, true);
          var localOff = view.getUint32(p + 42, true);
          var name = new TextDecoder('utf-8').decode(new Uint8Array(buffer, p + 46, nameLen)).replace(/\\/g, '/');
          entries[name] = { method: method, compSize: compSize, localOff: localOff };
          p += 46 + nameLen + extraLen + commentLen;
        }

        function read(name) {
          return new Promise(function (res, rej) {
            try {
              var e = entries[name];
              if (!e) return rej(new Error('文档里没有找到 ' + name));
              var lh = e.localOff;
              if (view.getUint32(lh, true) !== 0x04034b50) throw new Error('ZIP 条目损坏');
              var nl = view.getUint16(lh + 26, true);
              var el = view.getUint16(lh + 28, true);
              var start = lh + 30 + nl + el;
              var comp = new Uint8Array(buffer, start, e.compSize);
              if (e.method === 0) return res(comp);
              if (e.method === 8) return inflateRaw(comp).then(res, rej);
              rej(new Error('不支持的 ZIP 压缩方式：' + e.method));
            } catch (err) { rej(err); }
          });
        }

        resolve({ names: Object.keys(entries), has: function (name) { return !!entries[name]; }, read: read });
      } catch (e) { reject(e); }
    });
  }

  function extractDocx(buffer) {
    return unzip(buffer).then(function (zip) {
      return zip.read('word/document.xml').then(function (bytes) {
        var xml = new TextDecoder('utf-8').decode(bytes);
        var doc = new DOMParser().parseFromString(xml, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length) throw new Error('Word 文档内容解析失败');
        var body = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
        var lines = [];

        function paraText(p) {
          var out = '';
          Array.prototype.forEach.call(p.getElementsByTagName('*'), function (n) {
            var ln = n.localName;
            if (ln === 't') out += n.textContent || '';
            else if (ln === 'tab') out += '\t';
            else if (ln === 'br' || ln === 'cr') out += '\n';
          });
          return out;
        }

        function headingPrefix(p) {
          var ps = p.getElementsByTagName('w:pStyle')[0];
          if (ps) {
            var v = ps.getAttribute('w:val') || ps.getAttribute('val') || '';
            if (/^(Title|Heading1|标题1|标题 1)$/i.test(v)) return '# ';
            if (/^(Heading2|标题2|标题 2)$/i.test(v)) return '## ';
            if (/^(Heading3|标题3|标题 3)$/i.test(v)) return '### ';
          }
          var ol = p.getElementsByTagName('w:outlineLvl')[0];
          if (ol) {
            var lv = ol.getAttribute('w:val') || ol.getAttribute('val') || '';
            if (/^[0-2]$/.test(lv)) return new Array(Number(lv) + 2).join('#') + ' ';
          }
          return '';
        }

        function walk(node) {
          Array.prototype.forEach.call(node.children || [], function (child) {
            var ln = child.localName;
            if (ln === 'p') {
              var text = paraText(child);
              if (text && !/^#{1,3}\s/.test(text)) text = headingPrefix(child) + text;
              lines.push(text);
            } else if (ln === 'tbl') {
              Array.prototype.forEach.call(child.children || [], function (tr) {
                if (tr.localName !== 'tr') return;
                var cells = [];
                Array.prototype.forEach.call(tr.children || [], function (tc) {
                  if (tc.localName !== 'tc') return;
                  var ps = tc.getElementsByTagNameNS('*', 'p');
                  var texts = [];
                  Array.prototype.forEach.call(ps, function (p) { texts.push(paraText(p)); });
                  cells.push(texts.join(' ').trim());
                });
                lines.push(cells.join('\t'));
              });
            } else {
              walk(child);
            }
          });
        }
        walk(body);
        return lines.join('\n');
      });
    });
  }

  function extractXlsx(buffer) {
    return unzip(buffer).then(function (zip) {
      var sharedP = zip.has('xl/sharedStrings.xml')
        ? zip.read('xl/sharedStrings.xml').then(function (bytes) {
          var doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(bytes), 'application/xml');
          var out = [];
          Array.prototype.forEach.call(doc.getElementsByTagName('si'), function (si) {
            var texts = si.getElementsByTagName('t');
            var s = '';
            Array.prototype.forEach.call(texts, function (t) { s += t.textContent || ''; });
            out.push(s);
          });
          return out;
        })
        : Promise.resolve([]);

      var sheetName = 'xl/worksheets/sheet1.xml';
      if (!zip.has(sheetName)) {
        var found = zip.names.filter(function (n) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(n); })[0];
        if (found) sheetName = found;
      }
      if (!zip.has(sheetName)) throw new Error('Excel 文档里没有找到工作表');

      return Promise.all([sharedP, zip.read(sheetName)]).then(function (arr) {
        var shared = arr[0];
        var doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(arr[1]), 'application/xml');
        var rows = [];
        Array.prototype.forEach.call(doc.getElementsByTagName('row'), function (row) {
          var cells = [];
          Array.prototype.forEach.call(row.getElementsByTagName('c'), function (c) {
            var ref = c.getAttribute('r') || '';
            var col = 0;
            var letters = ref.replace(/\d+/g, '').toUpperCase();
            for (var i = 0; i < letters.length; i++) col = col * 26 + (letters.charCodeAt(i) - 64);
            col = Math.max(0, col - 1);
            var t = c.getAttribute('t') || '';
            var v = '';
            if (t === 's') {
              var vi = c.getElementsByTagName('v')[0];
              v = vi ? (shared[Number(vi.textContent)] || '') : '';
            } else if (t === 'inlineStr') {
              var its = c.getElementsByTagName('t');
              Array.prototype.forEach.call(its, function (x) { v += x.textContent || ''; });
            } else if (t === 'b') {
              var bv = c.getElementsByTagName('v')[0];
              v = bv && bv.textContent === '1' ? 'TRUE' : 'FALSE';
            } else {
              var vv = c.getElementsByTagName('v')[0];
              v = vv ? (vv.textContent || '') : '';
            }
            cells[col] = v;
          });
          for (var i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
          rows.push(cells);
        });
        return rows;
      });
    });
  }

  /* ------------------------------ PDF ------------------------------ */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('PDF 解析组件加载失败（需要联网）')); };
      document.head.appendChild(s);
    });
  }
  function ensurePdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfLoading) return pdfLoading;
    pdfLoading = loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(function () {
      if (!window.pdfjsLib) throw new Error('PDF 解析组件加载失败');
      var lib = window.pdfjsLib;
      var workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      // file:// 页面直接 new Worker() 会被浏览器拦截，先把 worker 脚本取回来
      // 变成 blob URL；即使 worker 不可用，pdf.js 也会退回主线程解析。
      return fetch(workerUrl).then(function (r) {
        if (!r.ok) throw new Error('worker ' + r.status);
        return r.text();
      }).then(function (text) {
        lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([text], { type: 'application/javascript' }));
        return lib;
      }).catch(function () {
        lib.GlobalWorkerOptions.workerSrc = workerUrl;
        return lib;
      });
    });
    return pdfLoading;
  }
  function extractPdf(buffer) {
    return ensurePdfJs().then(function (pdfjs) {
      return pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    }).then(function (pdf) {
      var pages = [];
      var chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) {
        (function (pageNo) {
          chain = chain.then(function () {
            return pdf.getPage(pageNo).then(function (page) {
              return page.getTextContent().then(function (content) {
                var lines = [], lastY = null;
                content.items.forEach(function (item) {
                  var y = item.transform ? item.transform[5] : 0;
                  if (lastY === null || Math.abs(y - lastY) > 4) {
                    lines.push('');
                    lastY = y;
                  }
                  lines[lines.length - 1] += (item.str || '') + (item.hasEOL ? '' : ' ');
                });
                pages.push(lines.join('\n').replace(/[ \t]+$/gm, ''));
              });
            });
          });
        })(i);
      }
      return chain.then(function () { return pages.join('\n\n'); });
    });
  }

  /* ------------------------------ 文件读取 / 解析入口 ------------------------------ */
  function decodeBytes(bytes) {
    var text = '';
    try {
      text = new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      text = '';
    }
    // 中文 Windows 下导出的 CSV / TXT 有时是 GBK，UTF-8 解出来会出现大量替换字符。
    if ((!text || /\uFFFD/.test(text)) && window.TextDecoder) {
      try {
        var gbk = new TextDecoder('gb18030').decode(bytes);
        if (gbk && (!text || (gbk.match(/\uFFFD/g) || []).length < (text.match(/\uFFFD/g) || []).length)) return gbk;
      } catch (e2) { /* 浏览器不支持 GB18030 时继续用 UTF-8 */ }
    }
    return text;
  }
  function readText(file) {
    return readBuffer(file).then(function (buffer) {
      return decodeBytes(new Uint8Array(buffer));
    });
  }
  function readBuffer(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('文件读取失败')); };
      r.readAsArrayBuffer(file);
    });
  }
  function withTimeout(promise, ms, message) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error(message)); }, ms);
      promise.then(function (v) { clearTimeout(timer); resolve(v); }, function (e) {
        clearTimeout(timer); reject(e);
      });
    });
  }

  function parseFile(file) {
    var ext = extOf(file.name);
    var meta = { fileName: file.name, title: baseName(file.name) };
    if (file.size > MAX_SIZE) {
      return Promise.reject(new Error('文件超过 20 MB，请拆分后再导入。'));
    }
    if (ext === 'json') {
      return readText(file).then(function (text) {
        var obj;
        try { obj = JSON.parse(text); } catch (e) { throw new Error('JSON 格式有误：' + e.message); }
        return parseJSONValue(obj, meta);
      });
    }
    if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
      return readText(file).then(function (text) { return [parseText(text, meta)]; });
    }
    if (ext === 'csv') {
      return readText(file).then(function (text) { return [draftFromRows(parseCSV(text), meta)]; });
    }
    if (ext === 'docx') {
      return readBuffer(file).then(extractDocx).then(function (text) {
        // Word 表格会以制表符分隔；表格很多时优先按表格列解析。
        var lines = text.split('\n').filter(function (l) { return l.trim(); });
        var tableLines = lines.filter(function (l) { return l.indexOf('\t') >= 0; });
        if (tableLines.length >= 2 && tableLines.length >= lines.length * 0.4) {
          var rows = tableLines.map(function (l) { return l.split('\t'); });
          var tableDraft = draftFromRows(rows, meta);
          if (tableDraft && tableDraft.questions.length) return [tableDraft];
        }
        return [parseText(text, meta)];
      });
    }
    if (ext === 'xlsx') {
      return readBuffer(file).then(extractXlsx).then(function (rows) {
        return [draftFromRows(rows, meta)];
      });
    }
    if (ext === 'pdf') {
      return withTimeout(
        readBuffer(file).then(extractPdf).then(function (text) {
          return [parseText(text, meta)];
        }),
        45000,
        'PDF 解析超时。可以尝试把 PDF 另存为 TXT / DOCX 后再导入。'
      );
    }
    if (ext === 'doc' || ext === 'xls') {
      return Promise.reject(new Error('暂不支持旧版 .' + ext + ' 文件，请在 Word / Excel 中另存为 .docx / .xlsx 后重试。'));
    }
    return Promise.reject(new Error('不支持的文件格式：.' + (ext || '未知') + '。支持 JSON、TXT、MD、CSV、DOCX、XLSX、PDF。'));
  }

  function finishDraft(draft, meta) {
    draft = draft || {};
    draft.questions = (draft.questions || []).filter(function (q) { return q && (q.stem || q.options.length); });
    var titles = [];
    (draft.chapters || []).forEach(function (c) {
      var title = typeof c === 'string' ? c : (c && (c.title || c.name));
      title = oneLine(title);
      if (title && titles.indexOf(title) < 0) titles.push(title);
    });
    draft.questions.forEach(function (q) {
      var title = oneLine(q.chapterTitle);
      if (title && titles.indexOf(title) < 0) titles.push(title);
    });
    if (!titles.length) titles.push('全部题目');
    draft.chapters = titles.map(function (t, i) { return { title: t, order: i + 1 }; });
    draft.questions.forEach(function (q, i) {
      if (!q.chapterTitle || titles.indexOf(q.chapterTitle) < 0) q.chapterTitle = titles[0];
      q.no = i + 1;
    });
    draft.title = oneLine(draft.title) || meta.title || '未命名题库';
    draft.desc = oneLine(draft.desc) || ('从「' + meta.fileName + '」导入，共 ' + draft.questions.length + ' 题。');
    draft.sourceFile = meta.fileName;
    return draft;
  }

  /* ------------------------------ 保存 / 删除 ------------------------------ */
  function uniqueTitle(title, existing) {
    title = oneLine(title) || '未命名题库';
    var names = {};
    (existing || []).forEach(function (b) { names[b.title] = 1; });
    if (!names[title]) return title;
    var n = 2;
    while (names[title + '（' + n + '）']) n++;
    return title + '（' + n + '）';
  }

  function buildBank(draft, titleOverride, taken) {
    var now = Date.now();
    var id = 'ub' + now.toString(36) + Math.random().toString(36).slice(2, 6);
    var chapterMap = {};
    var chapters = (draft.chapters || []).map(function (c, i) {
      var cid = id + '-c' + (i + 1);
      chapterMap[oneLine(c.title)] = cid;
      return { id: cid, title: oneLine(c.title), order: i + 1, questionCount: 0 };
    });
    if (!chapters.length) {
      chapters = [{ id: id + '-c1', title: '全部题目', order: 1, questionCount: 0 }];
      chapterMap['全部题目'] = chapters[0].id;
    }

    var questions = (draft.questions || []).map(function (q, i) {
      var cid = chapterMap[oneLine(q.chapterTitle)] || chapters[0].id;
      var ch = chapters.filter(function (c) { return c.id === cid; })[0];
      if (ch) ch.questionCount++;
      return {
        id: id + '-' + (i + 1),
        bankId: id,
        no: i + 1,
        chapterId: cid,
        type: q.type,
        typeLabel: labelOfType(q.type),
        stem: q.stem,
        options: q.options.map(function (o) { return { key: o.key, text: o.text }; }),
        answer: q.answer.slice(),
        answerRaw: q.answerRaw,
        explanation: q.explanation,
        flags: q.flags.slice(),
        scorable: !!q.scorable
      };
    });

    var typeCount = {};
    questions.forEach(function (q) { typeCount[q.type] = (typeCount[q.type] || 0) + 1; });
    var finalTitle = uniqueTitle(titleOverride || draft.title, taken || HZQ.data.userBanks());

    return {
      id: id,
      title: finalTitle,
      desc: draft.desc || ('共 ' + questions.length + ' 题。'),
      sourceFile: draft.sourceFile,
      user: true,
      createdAt: now,
      chapters: chapters,
      questions: questions,
      questionCount: questions.length,
      scorableCount: questions.filter(function (q) { return q.scorable; }).length,
      typeCount: typeCount
    };
  }

  function remove(bankId) {
    var bank = HZQ.data.bank(bankId);
    if (!bank || !bank.user) return;
    M.confirmBox({
      title: '删除题库？',
      danger: true,
      okText: '删除',
      body: el('div', {}, [
        el('p', { text: '将删除「' + bank.title + '」以及它的 ' + bank.questionCount + ' 道题。' }),
        el('p', { class: 'tiny muted', style: 'margin-top:8px', text: '这个题库的练习进度、错题、收藏和成绩记录也会一起清除；操作不可撤销。' })
      ])
    }).then(function (ok) {
      if (!ok) return;
      try {
        bank.questions.forEach(function (q) {
          HZQ.store.resetProgress(q.id);
          HZQ.store.removeWrong(q.id);
          HZQ.store.removeFav(q.id);
        });
        var histIds = HZQ.store.history().filter(function (h) { return h.bankId === bankId; }).map(function (h) { return h.id; });
        if (histIds.length) HZQ.store.removeHistoryMany(histIds);
        HZQ.store.clearSession(bankId);
        var fixKeys = Object.keys(HZQ.store.qualityFixes() || {}).filter(function (k) {
          return k.indexOf(bankId + '-') === 0 || k.indexOf(bankId + ':') === 0;
        });
        if (fixKeys.length) HZQ.store.removeQualityFixes(fixKeys);
        HZQ.data.saveUserBanks(HZQ.data.userBanks().filter(function (b) { return b.id !== bankId; }));
        M.toast('已删除题库', 'ok');
        HZQ.app.go('#/');
      } catch (e) {
        M.toast(e.message || '删除失败', 'bad');
      }
    });
  }

  /* ------------------------------ 导入界面 ------------------------------ */
  function typeCountsText(draft) {
    var c = {};
    draft.questions.forEach(function (q) { c[q.type] = (c[q.type] || 0) + 1; });
    var parts = [];
    if (c.single) parts.push('单选 ' + c.single);
    if (c.multiple) parts.push('多选 ' + c.multiple);
    if (c.judge) parts.push('判断 ' + c.judge);
    return parts.join(' · ') || '—';
  }

  function preview(file, drafts) {
    var body = el('div');
    body.appendChild(el('div', { class: 'tiny muted', text: '文件：' + file.name + ' · ' + (file.size / 1024).toFixed(1) + ' KB' }));

    var titleInput = null;
    if (drafts.length === 1) {
      var field = el('div', { class: 'field', style: 'margin-top:14px' });
      field.appendChild(el('label', { text: '题库名称' }));
      titleInput = el('input', { class: 'input', value: drafts[0].title, placeholder: '给这个题库起个名字' });
      field.appendChild(titleInput);
      body.appendChild(field);
    }

    var list = el('div', { class: 'import-list' });
    drafts.forEach(function (d, i) {
      var card = el('div', { class: 'card pad import-item' });
      var top = el('div', { class: 'spread' });
      top.appendChild(el('div', { style: 'font-weight:650', text: drafts.length > 1 ? (i + 1) + '. ' + d.title : d.title }));
      top.appendChild(el('span', { class: 'tag pri', text: d.questions.length + ' 题' }));
      card.appendChild(top);
      card.appendChild(el('div', { class: 'tiny muted', style: 'margin-top:4px', text: typeCountsText(d) }));
      var bad = d.questions.filter(function (q) { return !q.scorable; }).length;
      if (bad) {
        card.appendChild(el('div', { class: 'tag warn', style: 'margin-top:8px', text: bad + ' 题缺答案或选项，将标记为不计分' }));
      }
      if ((d.warnings || []).length) {
        card.appendChild(el('div', { class: 'tiny muted', style: 'margin-top:6px', text: d.warnings.join('；') }));
      }
      list.appendChild(card);
    });
    body.appendChild(list);

    body.appendChild(el('p', {
      class: 'tiny muted',
      style: 'margin-top:14px;line-height:1.8',
      html: '导入后保存在当前浏览器，不会上传服务器。<br>如果识别结果不对，可以点「查看格式说明」按示例整理后再试。'
    }));

    var actions = el('div', { class: 'row-2', style: 'margin-top:12px' });
    actions.appendChild(M.el('button', {
      class: 'btn ghost sm', type: 'button', text: '查看格式说明',
      onclick: function () { help(); }
    }));
    body.appendChild(actions);

    M.openSheet({
      title: '确认导入题库',
      wide: true,
      body: body,
      actions: [
        { text: '取消', onClick: function (close) { close(); } },
        { text: '导入 ' + drafts.length + ' 个题库', kind: 'primary', onClick: function (close) {
          try {
            var existing = HZQ.data.userBanks();
            var taken = existing.slice();
            var newBanks = drafts.map(function (d, i) {
              var bank = buildBank(d, drafts.length === 1 && titleInput ? titleInput.value : d.title, taken);
              taken.push(bank);
              return bank;
            });
            HZQ.data.saveUserBanks(existing.concat(newBanks));
            close();
            M.toast('已导入 ' + newBanks.length + ' 个题库', 'ok');
            HZQ.app.go('#/');
          } catch (e) {
            M.toast(e.message || '导入失败', 'bad');
          }
        } }
      ]
    });
  }

  function importFile(file) {
    if (!file) return;
    var close = M.openSheet({
      title: '正在解析题库',
      body: el('div', {}, [
        el('p', { text: '正在读取「' + file.name + '」…' }),
        el('p', { class: 'tiny muted', style: 'margin-top:8px', text: 'Word / Excel / PDF 需要在本机解析，文件较大时可能要等几秒。' })
      ]),
      actions: []
    });

    parseFile(file).then(function (drafts) {
      drafts = (drafts || []).filter(function (d) { return d && d.questions && d.questions.length; });
      if (!drafts.length) {
        throw new Error('没有识别到题目。请检查文件里是否包含题号、选项和答案，或先下载示例题库看看格式。');
      }
      if (close) close();
      preview(file, drafts);
    }).catch(function (e) {
      if (close) close();
      M.openSheet({
        title: '导入失败',
        body: el('div', {}, [
          el('p', { text: e && e.message ? e.message : String(e) }),
          el('p', { class: 'tiny muted', style: 'margin-top:10px', text: '支持的格式：JSON、TXT、Markdown、CSV、Word(.docx)、Excel(.xlsx)、PDF。' }),
          el('p', { class: 'tiny muted', style: 'margin-top:6px', text: '旧版 .doc / .xls 请先另存为 .docx / .xlsx。' })
        ]),
        actions: [
          { text: '查看格式说明', onClick: function (c) { c(); help(); } },
          { text: '知道了', kind: 'primary', onClick: function (c) { c(); } }
        ]
      });
    });
  }

  function open() {
    if (!fileInput) {
      fileInput = el('input', { type: 'file', accept: ACCEPT, style: 'display:none' });
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (f) importFile(f);
      });
      document.body.appendChild(fileInput);
    }
    fileInput.value = '';
    fileInput.click();
  }

  /* ------------------------------ 首页 / 设置页卡片 ------------------------------ */
  function card() {
    var wrap = el('div', { class: 'card pad upload-card' });
    var head = el('div', { class: 'upload-head' });
    head.appendChild(el('span', { class: 'upload-ic', html: M.icon('upload') }));
    var htxt = el('div');
    htxt.appendChild(el('div', { class: 'upload-title', text: '上传你的题库' }));
    htxt.appendChild(el('div', { class: 'tiny muted', text: '把自己的题目导入进来，格式和样式保持原样。' }));
    head.appendChild(htxt);
    wrap.appendChild(head);

    var drop = el('div', { class: 'upload-drop', tabindex: '0', role: 'button' });
    drop.appendChild(el('div', { class: 'upload-drop-main', text: '拖拽文件到这里，或点击选择文件' }));
    drop.appendChild(el('div', { class: 'upload-formats' }, [
      el('span', { class: 'tag line', text: 'JSON' }),
      el('span', { class: 'tag line', text: 'TXT / MD' }),
      el('span', { class: 'tag line', text: 'CSV' }),
      el('span', { class: 'tag line', text: 'Word' }),
      el('span', { class: 'tag line', text: 'Excel' }),
      el('span', { class: 'tag line', text: 'PDF' })
    ]));
    drop.addEventListener('click', open);
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    ['dragenter', 'dragover'].forEach(function (name) {
      drop.addEventListener(name, function (e) { e.preventDefault(); drop.classList.add('on'); });
    });
    ['dragleave', 'dragend'].forEach(function (name) {
      drop.addEventListener(name, function () { drop.classList.remove('on'); });
    });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('on');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) importFile(f);
    });
    wrap.appendChild(drop);

    var acts = el('div', { class: 'row-2', style: 'margin-top:12px' });
    acts.appendChild(U.btn('选择文件', { kind: 'primary', icon: 'upload', onClick: open }));
    acts.appendChild(U.btn('下载示例题库', { icon: 'download', onClick: downloadSample }));
    acts.appendChild(U.btn('格式说明', { kind: 'ghost', icon: 'info', onClick: help }));
    wrap.appendChild(acts);
    return wrap;
  }

  function manageCard() {
    var wrap = el('div');
    wrap.appendChild(card());
    var list = el('div', { class: 'card manage-list', style: 'margin-top:12px' });
    var userBanks = HZQ.data.banks.filter(function (b) { return b.user; });
    if (!userBanks.length) {
      list.appendChild(el('div', { class: 'tiny muted', style: 'padding:16px 18px', text: '还没有上传题库。' }));
      wrap.appendChild(list);
      return wrap;
    }
    userBanks.forEach(function (b) {
      var row = el('div', { class: 'manage-row' });
      var main = el('div', { class: 'grow' });
      main.appendChild(el('div', { style: 'font-weight:600', text: b.title }));
      main.appendChild(el('div', { class: 'tiny muted', text: b.questionCount + ' 题 · ' + (b.chapters || []).length + ' 个章节 · ' + (b.sourceFile || '本地导入') }));
      row.appendChild(main);
      row.appendChild(U.btn('删除', {
        small: true, kind: 'ghost', icon: 'trash',
        onClick: function () { remove(b.id); }
      }));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* ------------------------------ 示例 / 帮助 ------------------------------ */
  var SAMPLE = [
    '# 示例题库',
    '> 共 3 题，演示单选、多选、判断三种题型',
    '',
    '## 第一章 基础',
    '',
    '### 1. 单选题',
    '1 + 1 等于多少？',
    '- A. 1',
    '- B. 2',
    '- C. 3',
    '- D. 4',
    '**答案**：B',
    '**解析**：这是最基础的加法。',
    '',
    '### 2. 多选题',
    '以下哪些是编程语言？',
    '- A. JavaScript',
    '- B. HTML',
    '- C. Python',
    '- D. CSS',
    '**答案**：A、C',
    '**解析**：HTML 和 CSS 是标记 / 样式语言。',
    '',
    '### 3. 判断题',
    '浏览器可以离线运行纯静态网页。',
    '- A. 正确',
    '- B. 错误',
    '**答案**：A',
    '**解析**：纯静态页面不需要服务器即可在本地打开。'
  ].join('\n');

  function downloadSample() {
    var blob = new Blob([SAMPLE], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '题库模板.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    M.toast('示例题库已下载', 'ok');
  }

  function help() {
    var body = el('div');
    body.appendChild(el('p', { class: 'tiny muted', text: '最省事的格式是 TXT / Markdown：每道题有题号、选项、答案即可。Word（.docx）和 PDF 会按同样的规则识别文字。' }));
    body.appendChild(el('div', { class: 'sec-title', style: 'margin-top:16px', text: 'TXT / Markdown / Word / PDF' }));
    body.appendChild(el('pre', { class: 'help-pre', text: [
      '### 1. 单选题',
      '题干可以换行，也支持 ```代码块```。',
      '- A. 选项一',
      '- B. 选项二',
      '**答案**：B',
      '**解析**：可选。',
      '',
      '### 2. 多选题',
      '多选题写到第四章也可以。',
      '- A. 选项一',
      '- B. 选项二',
      '- C. 选项三',
      '答案：A、C',
      '',
      '### 3. 判断题',
      '不写选项也可以，答案写“正确 / 错误”。',
      '答案：正确'
    ].join('\n') }));

    body.appendChild(el('div', { class: 'sec-title', style: 'margin-top:16px', text: 'CSV / Excel 表头' }));
    body.appendChild(el('pre', { class: 'help-pre', text: [
      '序号,题干,A,B,C,D,答案,解析,章节',
      '1,1+1 等于多少？,1,2,3,4,B,基础加法,第一章'
    ].join('\n') }));

    body.appendChild(el('div', { class: 'sec-title', style: 'margin-top:16px', text: 'JSON' }));
    body.appendChild(el('pre', { class: 'help-pre', text: [
      '{',
      '  "title": "我的题库",',
      '  "questions": [',
      '    { "stem": "1+1 等于多少？", "options": ["1", "2", "3", "4"], "answer": "B" }',
      '  ]',
      '}'
    ].join('\n') }));

    body.appendChild(el('p', { class: 'tiny muted', style: 'margin-top:14px;line-height:1.8', text: '提示：PDF 扫描件（图片型 PDF）无法直接提取文字，需要先做 OCR；PDF 文字解析会按需加载在线组件，首次使用需要联网。旧版 .doc / .xls 请另存为 .docx / .xlsx。' }));

    M.openSheet({
      title: '题库格式说明',
      wide: true,
      body: body,
      actions: [
        { text: '下载 TXT 模板', kind: 'primary', onClick: function (close) { downloadSample(); close(); } },
        { text: '关闭', onClick: function (close) { close(); } }
      ]
    });
  }

  return {
    open: open,
    importFile: importFile,
    card: card,
    manageCard: manageCard,
    remove: remove,
    help: help,
    downloadSample: downloadSample,
    parseFile: parseFile
  };
})();

/* ==========================================================================
   每道题底部的名言 / 笑话
   ========================================================================== */
HZQ.encouragement = (function () {
  'use strict';

  var M = HZQ.util, U = HZQ.ui, el = M.el;

  var QUOTES = [
    { text: '不积跬步，无以至千里；不积小流，无以成江海。', by: '荀子' },
    { text: '学而不思则罔，思而不学则殆。', by: '孔子' },
    { text: '知之者不如好之者，好之者不如乐之者。', by: '孔子' },
    { text: '宝剑锋从磨砺出，梅花香自苦寒来。', by: '《警世贤文》' },
    { text: '路虽远，行则将至；事虽难，做则必成。', by: '古语' },
    { text: '读书破万卷，下笔如有神。', by: '杜甫' },
    { text: '天才是百分之一的灵感，加上百分之九十九的汗水。', by: '爱迪生' },
    { text: '成功不是终点，失败也并非末日，重要的是继续前进的勇气。', by: '丘吉尔' },
    { text: '你现在的努力，是为了以后有更多的选择。', by: '佚名' },
    { text: '每天进步一点点，一年后就是全新的自己。', by: '复利思维' },
    { text: '把不会的题弄会，就是今天最大的收获。', by: '刷题人' },
    { text: '别怕慢，怕的是停。', by: '佚名' },
    { text: '所有看似不起波澜的日复一日，会在某一天让你看到坚持的意义。', by: '佚名' },
    { text: '代码不会骗人，你写过的每一行都算数。', by: '程序员' },
    { text: '真正的自律，是在没人看见的时候也认真做完这一题。', by: '佚名' }
  ];

  var JOKES = [
    '程序员最讨厌的两件事：写注释，和别人的代码没有注释。',
    '问：为什么程序员总是分不清万圣节和圣诞节？答：因为 Oct 31 == Dec 25。',
    '我写代码很快，快到我也不知道它为什么能跑。',
    '产品经理：这个需求很简单。程序员：那你来。',
    '调试的时候，最怕的不是报错，而是它突然好了。',
    '同事问我为什么对着屏幕笑，我说：我删了一行代码，程序居然还能跑。',
    '学习就像编译：你以为改对了，编译器说：不，你没有。',
    '考试前：我复习完了。考试后：复习完的是我，不是知识点。',
    '今天也要元气满满地……把 bug 留给明天的自己。',
    '如果生活给你一个 bug，那就先加一行 console.log。',
    '我和学霸的区别：他复习，我复述他复习过。',
    '别担心，地球离了谁都转，但你的代码离了你就真的跑不起来。'
  ];

  var POOL = [];
  var max = Math.max(QUOTES.length, JOKES.length);
  for (var i = 0; i < max; i++) {
    if (QUOTES[i]) POOL.push({ type: 'quote', text: QUOTES[i].text, by: QUOTES[i].by });
    if (JOKES[i]) POOL.push({ type: 'joke', text: JOKES[i], by: '' });
  }

  var offsets = {};

  function hash(s) {
    var h = 2166136261;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function itemFor(qid) {
    var idx = (hash(qid) + (offsets[qid] || 0)) % POOL.length;
    return POOL[idx];
  }

  function next(qid) {
    offsets[qid] = (offsets[qid] || 0) + 1;
    return itemFor(qid);
  }

  function card(q) {
    var wrap = el('div', { class: 'card pad quote-card' });
    var head = el('div', { class: 'quote-head' });
    var tag = el('span', { class: 'tag pri' });
    head.appendChild(tag);
    head.appendChild(el('span', { class: 'grow' }));
    var body = el('div', { class: 'quote-body' });
    var mark = el('span', { class: 'quote-mark' });
    var text = el('div', { class: 'quote-text' });
    var by = el('div', { class: 'quote-by' });
    body.appendChild(mark);
    body.appendChild(text);
    wrap.appendChild(head);
    wrap.appendChild(body);
    wrap.appendChild(by);

    var refresh = U.btn('换一句', {
      small: true, kind: 'ghost', icon: 'refresh',
      onClick: function () { render(next(q.id)); }
    });
    head.appendChild(refresh);

    function render(item) {
      tag.className = 'tag ' + (item.type === 'joke' ? 'star' : 'pri');
      tag.textContent = item.type === 'joke' ? '轻松一下' : '学习加油站';
      mark.textContent = item.type === 'joke' ? '☺' : '“';
      text.textContent = item.text;
      by.textContent = item.by ? ('— ' + item.by) : '';
    }
    render(itemFor(q.id));
    return wrap;
  }

  return { card: card, next: next };
})();

/* ==========================================================================
   个人积分中心 / 称号 / 积分主题
   ========================================================================== */
HZQ.points = (function () {
  'use strict';

  var M = HZQ.util, U = HZQ.ui, el = M.el;

  var TITLES = [
    { id: 'novice', name: '初来乍到', min: 0, icon: 'user', desc: '刚刚开始刷题的新朋友' },
    { id: 'reader', name: '勤学书生', min: 100, icon: 'book', desc: '累计获得 100 积分' },
    { id: 'explorer', name: '题海行者', min: 250, icon: 'layers', desc: '累计获得 250 积分' },
    { id: 'hunter', name: '知识猎手', min: 500, icon: 'target', desc: '累计获得 500 积分' },
    { id: 'scholar', name: '学霸之光', min: 900, icon: 'trophy', desc: '累计获得 900 积分' },
    { id: 'legend', name: '传奇题神', min: 1500, icon: 'fire', desc: '累计获得 1500 积分' }
  ];

  var THEMES = [
    { id: 'mint', name: '薄荷清风', desc: '清爽的薄荷绿', cost: 60, colors: ['#eefcf5', '#059669'] },
    { id: 'aurora', name: '极光', desc: '青绿与蓝紫的极光渐变', cost: 120, colors: ['#eefbf7', '#0f766e'] },
    { id: 'sunset', name: '落日熔金', desc: '温暖的落日橙', cost: 200, colors: ['#fff4ec', '#ea580c'] },
    { id: 'cyber', name: '赛博霓虹', desc: '紫粉与青色的霓虹感', cost: 320, colors: ['#f5f0ff', '#c026d3'] },
    { id: 'galaxy', name: '星河漫游', desc: '蓝紫星河', cost: 500, colors: ['#eff3ff', '#7c3aed'] }
  ];

  function data() { return HZQ.store.pointsData(); }
  function find(arr, id) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function titleById(id) { return find(TITLES, id); }
  function titleFor(earned) {
    var best = TITLES[0];
    TITLES.forEach(function (t) { if (earned >= t.min) best = t; });
    return best;
  }
  function currentTitle(d) {
    var t = titleById(d.title);
    if (t && d.earned >= t.min) {
      // 默认称号会自动跟随累计积分升级；用户手动佩戴后尊重用户选择。
      if (t.id === 'novice') {
        var best = titleFor(d.earned);
        if (best && best.min > 0) return best;
      }
      return t;
    }
    return titleFor(d.earned);
  }
  function nextTitle(d) {
    for (var i = 0; i < TITLES.length; i++) if (TITLES[i].min > d.earned) return TITLES[i];
    return null;
  }
  function themeById(id) { return find(THEMES, id); }
  function isThemeUnlocked(id) {
    if (!themeById(id)) return true;
    return !!data().unlockedThemes[id];
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function daily() {
    var added = HZQ.store.dailyCheck();
    if (added) M.toast('每日签到 +' + added + ' 积分', 'ok');
    return added;
  }
  function summary() {
    var d = data();
    var t = currentTitle(d);
    var n = nextTitle(d);
    return { points: d.points, earned: d.earned, title: t, next: n, lastDaily: d.lastDaily };
  }

  function banner() {
    try { daily(); } catch (e) { /* 忽略存储异常 */ }
    var d = data();
    var t = currentTitle(d);
    var n = nextTitle(d);
    var card = el('div', { class: 'card pad points-banner' });
    var row = el('div', { class: 'points-banner-row' });
    row.appendChild(el('span', { class: 'points-orb', html: M.icon('trophy') }));
    var main = el('div', { class: 'grow' });
    var line = el('div', { class: 'points-banner-title' });
    line.appendChild(el('span', { text: '积分中心' }));
    line.appendChild(el('span', { class: 'tag star', text: t.name }));
    main.appendChild(line);
    main.appendChild(el('div', {
      class: 'tiny muted',
      html: '当前积分 <b class="points-strong">' + d.points + '</b> · 累计获得 ' + d.earned
    }));
    var ratio = n ? (d.earned - t.min) / Math.max(1, n.min - t.min) : 1;
    var bar = el('div', { class: 'bar thin' });
    bar.appendChild(el('i', { style: 'width:' + Math.max(0, Math.min(1, ratio)) * 100 + '%' }));
    main.appendChild(bar);
    main.appendChild(el('div', {
      class: 'tiny muted',
      text: n ? ('再获得 ' + (n.min - d.earned) + ' 积分升级为「' + n.name + '」') : '已解锁全部称号'
    }));
    row.appendChild(main);
    var acts = el('div', { class: 'row-2 points-banner-acts' });
    acts.appendChild(U.btn('查看', { small: true, kind: 'primary', icon: 'trophy', onClick: openCenter }));
    if (d.lastDaily !== today()) {
      acts.appendChild(U.btn('签到 +5', { small: true, icon: 'check', onClick: function () {
        daily();
        HZQ.app.go(location.hash || '#/');
      } }));
    }
    row.appendChild(acts);
    card.appendChild(row);
    return card;
  }

  function openCenter() {
    try { daily(); } catch (e) { /* 忽略存储异常 */ }
    var d = data();
    var t = currentTitle(d);
    var n = nextTitle(d);
    var body = el('div');

    var hero = el('div', { class: 'points-hero' });
    var cell1 = el('div', { class: 'points-cell' });
    cell1.appendChild(el('div', { class: 'points-big', text: String(d.points) }));
    cell1.appendChild(el('div', { class: 'points-label', text: '可用积分' }));
    var cell2 = el('div', { class: 'points-cell' });
    cell2.appendChild(el('div', { class: 'points-big', text: String(d.earned) }));
    cell2.appendChild(el('div', { class: 'points-label', text: '累计获得' }));
    var cell3 = el('div', { class: 'points-cell' });
    cell3.appendChild(el('div', { class: 'points-title-big', text: t.name }));
    cell3.appendChild(el('div', { class: 'points-label', text: '当前称号' }));
    hero.appendChild(cell1);
    hero.appendChild(cell2);
    hero.appendChild(cell3);
    body.appendChild(hero);

    var ratio = n ? (d.earned - t.min) / Math.max(1, n.min - t.min) : 1;
    var prog = el('div', { class: 'points-progress-wrap' });
    var bar = el('div', { class: 'bar thin' });
    bar.appendChild(el('i', { style: 'width:' + Math.max(0, Math.min(1, ratio)) * 100 + '%' }));
    prog.appendChild(bar);
    prog.appendChild(el('div', {
      class: 'tiny muted',
      text: n ? ('距离「' + n.name + '」还差 ' + (n.min - d.earned) + ' 积分') : '全部称号已经解锁'
    }));
    body.appendChild(prog);

    body.appendChild(U.secTitle('我的称号'));
    var titleList = el('div', { class: 'title-list' });
    TITLES.forEach(function (item) {
      var unlocked = d.earned >= item.min;
      var active = item.id === t.id;
      var row = el('div', { class: 'title-row' + (unlocked ? '' : ' locked') });
      row.appendChild(el('span', { class: 'title-ico', html: M.icon(item.icon) }));
      var main = el('div', { class: 'grow' });
      var nm = el('div', { class: 'title-name' });
      nm.appendChild(el('span', { text: item.name }));
      if (active) nm.appendChild(el('span', { class: 'tag ok', text: '佩戴中' }));
      main.appendChild(nm);
      main.appendChild(el('div', { class: 'tiny muted', text: item.desc }));
      row.appendChild(main);
      if (active) {
        // 已佩戴
      } else if (unlocked) {
        row.appendChild(U.btn('佩戴', { small: true, kind: 'primary', icon: 'check', onClick: function () {
          HZQ.store.setTitle(item.id);
          M.toast('已佩戴「' + item.name + '」', 'ok');
          openCenter();
        } }));
      } else {
        row.appendChild(el('span', { class: 'tag', text: '还差 ' + (item.min - d.earned) + ' 积分' }));
      }
      titleList.appendChild(row);
    });
    body.appendChild(titleList);

    body.appendChild(U.secTitle('积分主题'));
    var shop = el('div', { class: 'shop-grid' });
    THEMES.forEach(function (item) {
      var unlocked = isThemeUnlocked(item.id);
      var active = (HZQ.store.settings().theme || '') === item.id;
      var card = el('div', { class: 'shop-item' + (unlocked ? ' unlocked' : '') });
      card.appendChild(el('span', {
        class: 'shop-swatch',
        style: 'background:linear-gradient(135deg,' + item.colors[0] + ' 0 52%,' + item.colors[1] + ' 52% 100%)'
      }));
      var main = el('div', { class: 'grow' });
      main.appendChild(el('div', { class: 'shop-name', text: item.name }));
      main.appendChild(el('div', { class: 'tiny muted', text: item.desc }));
      card.appendChild(main);
      if (active) {
        card.appendChild(el('span', { class: 'tag ok', text: '使用中' }));
      } else if (unlocked) {
        card.appendChild(U.btn('使用', { small: true, kind: 'primary', onClick: function () {
          HZQ.app.setTheme(item.id);
          M.toast('已切换到「' + item.name + '」', 'ok');
          openCenter();
        } }));
      } else {
        card.appendChild(U.btn(item.cost + ' 积分解锁', { small: true, kind: 'primary', icon: 'star', onClick: function () {
          if (d.points < item.cost) {
            M.toast('积分不够，还差 ' + (item.cost - d.points) + ' 积分', 'bad');
            return;
          }
          M.confirmBox({
            title: '解锁主题「' + item.name + '」？',
            body: el('div', {}, [
              el('p', { text: '将消耗 ' + item.cost + ' 积分（当前 ' + d.points + '）。' }),
              el('p', { class: 'tiny muted', style: 'margin-top:6px', text: '解锁后永久可用，可随时在设置里切换。' })
            ]),
            okText: '解锁并应用'
          }).then(function (ok) {
            if (!ok) return;
            if (!HZQ.store.unlockTheme(item.id, item.cost, '解锁主题：' + item.name)) {
              M.toast('积分不够', 'bad');
              return;
            }
            HZQ.app.setTheme(item.id);
            M.toast('已解锁「' + item.name + '」', 'ok');
            openCenter();
          });
        } }));
      }
      shop.appendChild(card);
    });
    body.appendChild(shop);

    body.appendChild(U.secTitle('积分记录'));
    var logs = d.log.slice(0, 12);
    if (!logs.length) {
      body.appendChild(el('div', { class: 'tiny muted', text: '还没有积分记录。答对题目、完成练习和每日签到都会获得积分。' }));
    } else {
      var logBox = el('div', { class: 'points-log' });
      logs.forEach(function (item) {
        var row = el('div', { class: 'points-log-row' });
        var main = el('div', { class: 'grow' });
        main.appendChild(el('div', { class: 'points-log-reason', text: item.reason || '积分变动' }));
        main.appendChild(el('div', { class: 'tiny muted', text: M.dateText(item.at) }));
        row.appendChild(main);
        row.appendChild(el('span', {
          class: 'points-log-amount ' + (item.amount >= 0 ? 'up' : 'down'),
          text: (item.amount >= 0 ? '+' : '') + item.amount
        }));
        logBox.appendChild(row);
      });
      body.appendChild(logBox);
    }

    body.appendChild(el('p', {
      class: 'tiny muted',
      style: 'margin-top:14px;line-height:1.8',
      text: '积分规则：答对一题 +2；完成一轮练习 +5，正确率达到 60% 额外 +3、达到 80% 额外 +5；每日签到 +5。'
    }));

    M.openSheet({
      title: '个人积分中心',
      wide: true,
      body: body,
      actions: [
        { text: '去刷题', kind: 'primary', icon: 'play', onClick: function (close) { close(); HZQ.app.go('#/'); } },
        { text: '关闭', onClick: function (close) { close(); HZQ.app.go(location.hash || '#/'); } }
      ]
    });
  }

  return {
    TITLES: TITLES,
    THEMES: THEMES,
    themeById: themeById,
    isThemeUnlocked: isThemeUnlocked,
    summary: summary,
    banner: banner,
    openCenter: openCenter,
    daily: daily,
    today: today,
    titleFor: titleFor
  };
})();

/* ==========================================================================
   AI 答疑：用户自带 Key，直接请求 OpenAI 兼容接口
   ========================================================================== */
HZQ.ai = (function () {
  'use strict';

  var M = HZQ.util, U = HZQ.ui, el = M.el;

  function storageKey() {
    var user = HZQ.profile && HZQ.profile.current ? HZQ.profile.current() : null;
    return 'hqz.ai.v1' + (user ? ':' + user : ':guest');
  }

  var PRESETS = [
    {
      id: 'deepseek', name: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      hint: 'DeepSeek 的 Key 可在 platform.deepseek.com 创建'
    },
    {
      id: 'openai', name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      hint: 'OpenAI 可能不允许浏览器直连，必要时请使用中转地址'
    },
    {
      id: 'custom', name: '自定义 / 中转',
      endpoint: '', model: '',
      hint: '填写完整的 chat/completions 地址，或只填到 /v1'
    }
  ];

  var SYSTEM = '你是一位耐心、严谨的中文学习辅导老师。请围绕用户给出的题目进行讲解：先直接回答，再解释原因和步骤。不要编造题目中没有的信息；如果题目信息不足，请明确指出来。回答尽量条理清晰，必要时使用短标题和项目符号。';

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return PRESETS[0];
  }

  function normalizeEndpoint(url) {
    var s = String(url || '').trim().replace(/\/+$/, '');
    if (!s) return '';
    if (/\/chat\/completions$/i.test(s)) return s;
    return s + '/chat/completions';
  }

  function config() {
    var preset = PRESETS[0];
    var out = {
      preset: preset.id,
      endpoint: preset.endpoint,
      model: preset.model,
      apiKey: ''
    };
    try {
      var raw = localStorage.getItem(storageKey());
      if (raw) {
        var obj = JSON.parse(raw) || {};
        out.preset = obj.preset || out.preset;
        out.endpoint = obj.endpoint || out.endpoint;
        out.model = obj.model || out.model;
        out.apiKey = obj.apiKey || '';
        var p = presetById(out.preset);
        if (!out.endpoint && p.id !== 'custom') out.endpoint = p.endpoint;
        if (!out.model && p.id !== 'custom') out.model = p.model;
      }
    } catch (e) { /* 配置损坏时使用默认值 */ }
    return out;
  }

  function save(obj) {
    obj = obj || {};
    var old = config();
    var preset = presetById(obj.preset || old.preset);
    var endpoint = normalizeEndpoint(obj.endpoint !== undefined ? obj.endpoint : old.endpoint);
    if (!endpoint && preset.id !== 'custom') endpoint = preset.endpoint;
    var model = String(obj.model !== undefined ? obj.model : old.model || preset.model || '').trim();
    var apiKey = obj.apiKey !== undefined && String(obj.apiKey).length ? String(obj.apiKey).trim() : old.apiKey;
    var cfg = { preset: preset.id, endpoint: endpoint, model: model, apiKey: apiKey };
    try { localStorage.setItem(storageKey(), JSON.stringify(cfg)); } catch (e) { /* 忽略 */ }
    return cfg;
  }

  function clear() {
    try { localStorage.removeItem(storageKey()); } catch (e) { /* 忽略 */ }
  }

  function hasKey() {
    var cfg = config();
    return !!(cfg.apiKey && cfg.endpoint && cfg.model);
  }

  function formatHttpError(status, message) {
    message = String(message || '').trim();
    if (status === 401 || status === 403) return 'API Key 无效或没有权限，请检查设置';
    if (status === 404) return '接口地址不存在，请检查 API 地址';
    if (status === 429) return '请求太频繁或额度不足，请稍后再试';
    if (status >= 500) return 'AI 服务暂时不可用，请稍后再试';
    return '请求失败（HTTP ' + status + '）' + (message ? '：' + message : '');
  }

  function request(cfg, messages, timeoutMs, extra) {
    return new Promise(function (resolve, reject) {
      cfg = cfg || config();
      var endpoint = normalizeEndpoint(cfg.endpoint);
      if (!endpoint) { reject(new Error('请先填写 API 地址')); return; }
      if (!cfg.apiKey) { reject(new Error('请先填写 API Key')); return; }
      if (!cfg.model) { reject(new Error('请先填写模型名称')); return; }

      var controller = null;
      var timer = null;
      try { controller = new AbortController(); } catch (e) { /* 老浏览器 */ }

      var payload = {
        model: cfg.model || 'deepseek-chat',
        messages: messages,
        temperature: 0.4,
        max_tokens: 1200,
        stream: false
      };
      if (extra) Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });

      var opt = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.apiKey
        },
        body: JSON.stringify(payload)
      };
      if (controller) opt.signal = controller.signal;

      if (controller) {
        timer = setTimeout(function () { controller.abort(); }, timeoutMs || 60000);
      }

      fetch(endpoint, opt).then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = JSON.parse(text); } catch (e) { /* 非 JSON 错误页 */ }
          if (!res.ok) {
            var msg = data && data.error && (data.error.message || data.error) || text || '';
            throw new Error(formatHttpError(res.status, msg));
          }
          if (!data || !data.choices || !data.choices[0]) throw new Error('AI 返回格式异常，请检查模型和接口地址');
          var content = data.choices[0].message && data.choices[0].message.content;
          if (Array.isArray(content)) content = content.map(function (x) { return x.text || ''; }).join('');
          if (!content) throw new Error('AI 没有返回内容');
          return content;
        });
      }).then(function (text) {
        if (timer) clearTimeout(timer);
        resolve(text);
      }).catch(function (e) {
        if (timer) clearTimeout(timer);
        if (e && e.name === 'AbortError') reject(new Error('请求超时，请稍后再试'));
        else if (e instanceof TypeError) reject(new Error('网络请求失败：可能是网络问题，或服务商不允许浏览器直连'));
        else reject(e);
      });
    });
  }

  function buildContext(q, picked) {
    var opts = (q.options || []).map(function (o) { return o.key + '. ' + o.text; }).join('\n');
    var lines = [
      '题目：' + q.stem,
      opts ? '选项：\n' + opts : '',
      '正确答案：' + HZQ.grading.answerText(q),
      q.explanation ? '解析：' + q.explanation : '',
      picked && picked.length ? '我的选择：' + HZQ.grading.pickedText(picked) : ''
    ].filter(function (x) { return !!x; });
    return lines.join('\n\n');
  }

  function ask(q, userPrompt, picked) {
    var cfg = config();
    var context = buildContext(q, picked);
    var prompt = String(userPrompt || '').trim() || '请讲解这道题，并告诉我为什么正确答案是它。';
    var messages = [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: context + '\n\n我的问题：' + prompt }
    ];
    return request(cfg, messages, 60000);
  }

  function test(cfg) {
    cfg = cfg || config();
    return request(cfg, [
      { role: 'user', content: '请只回复四个字：连接成功' }
    ], 30000, { max_tokens: 30, temperature: 0 });
  }

  function openSettings() {
    HZQ.app.go('#/settings');
    setTimeout(function () {
      var node = document.getElementById('ai-settings');
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 260);
  }

  function noKeySheet() {
    var body = el('div');
    body.appendChild(el('p', { text: '还没有配置 AI 服务。填入自己的 API Key 后，就可以在答题时让 AI 讲解题目。' }));
    body.appendChild(el('p', { class: 'tiny muted', style: 'margin-top:8px;line-height:1.8', text: 'Key 只保存在当前浏览器，不会上传到本站服务器。推荐使用 DeepSeek，默认接口已经填好。' }));
    M.openSheet({
      title: '还没有配置 AI',
      body: body,
      actions: [
        { text: '取消', onClick: function (close) { close(); } },
        { text: '去设置 API', kind: 'primary', onClick: function (close) { close(); openSettings(); } }
      ]
    });
  }

  function askQuestion(q, session, rec) {
    if (!hasKey()) { noKeySheet(); return; }
    var picked = rec && rec.picked ? rec.picked : [];
    var body = el('div');

    var details = el('details', { class: 'ai-context' });
    details.appendChild(el('summary', { text: '查看题目上下文' }));
    details.appendChild(el('pre', { class: 'ai-context-pre', text: buildContext(q, picked) }));
    body.appendChild(details);

    var field = el('div', { class: 'field', style: 'margin-top:12px' });
    field.appendChild(el('label', { text: '你想问什么？' }));
    var input = el('textarea', { class: 'input', rows: '3', maxlength: '800' });
    var answerText = HZQ.grading.answerText(q);
    input.value = answerText && answerText !== '（原始题库未提供答案）'
      ? '请用通俗的话讲解这道题，并告诉我为什么正确答案是「' + answerText + '」。'
      : '请用通俗的话讲解这道题，并告诉我解题思路。';
    field.appendChild(input);
    body.appendChild(field);

    var row = el('div', { class: 'row-2', style: 'margin-top:10px' });
    var askBtn = U.btn('开始提问', { kind: 'primary', icon: 'lightbulb', onClick: doAsk });
    row.appendChild(askBtn);
    row.appendChild(el('span', { class: 'tiny muted', text: 'AI 回答仅供参考，请结合教材和解析判断。' }));
    body.appendChild(row);

    var status = el('div', { class: 'ai-status tiny muted', style: 'margin-top:10px' });
    body.appendChild(status);
    var answer = el('div', { class: 'ai-answer', hidden: 'hidden' });
    body.appendChild(answer);

    function doAsk() {
      var prompt = input.value.trim();
      if (!prompt) { M.toast('先写下你想问的问题', 'bad'); return; }
      if (!hasKey()) { noKeySheet(); return; }
      askBtn.disabled = true;
      status.className = 'ai-status tiny muted';
      status.textContent = 'AI 正在思考，通常需要几秒…';
      answer.setAttribute('hidden', 'hidden');
      ask(q, prompt, picked).then(function (text) {
        answer.innerHTML = '';
        var head = el('div', { class: 'ai-answer-head' });
        head.appendChild(el('span', { class: 'tag pri', text: 'AI 回答' }));
        head.appendChild(el('span', { class: 'grow' }));
        head.appendChild(U.btn('复制', {
          small: true, kind: 'ghost', icon: 'copy',
          onClick: function () {
            M.copyText(text).then(function () { M.toast('已复制 AI 回答', 'ok'); });
          }
        }));
        answer.appendChild(head);
        answer.appendChild(el('div', { class: 'ai-answer-body', html: M.rich(text) }));
        answer.removeAttribute('hidden');
        status.textContent = '回答完成。可以修改问题后再次提问。';
        askBtn.disabled = false;
      }).catch(function (e) {
        status.className = 'ai-status tiny bad';
        status.innerHTML = M.icon('alert') + '<span>' + M.esc(e && e.message || e) + '</span>';
        var fix = U.btn('检查 API 设置', { small: true, kind: 'ghost', icon: 'settings', onClick: openSettings });
        status.appendChild(fix);
        askBtn.disabled = false;
      });
    }

    M.openSheet({
      title: '问 AI · ' + (q._bank ? q._bank.title : '题目'),
      wide: true,
      body: body,
      actions: [{ text: '关闭', onClick: function (close) { close(); } }]
    });
  }

  return {
    presets: function () { return PRESETS.slice(); },
    presetById: presetById,
    config: config,
    save: save,
    clear: clear,
    hasKey: hasKey,
    normalizeEndpoint: normalizeEndpoint,
    request: request,
    ask: ask,
    test: test,
    askQuestion: askQuestion,
    openSettings: openSettings,
    buildContext: buildContext
  };
})();
