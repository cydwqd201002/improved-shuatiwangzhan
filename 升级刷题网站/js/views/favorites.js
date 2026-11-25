/* ==========================================================================
   views/favorites.js —— 重点收藏：先看题，点按钮才揭示答案和解析
   ========================================================================== */
window.HZQ = window.HZQ || {};
HZQ.views = HZQ.views || {};

HZQ.views.favorites = (function () {
  'use strict';
  var M = HZQ.util, U = HZQ.ui, el = M.el;

  function render() {
    var list = HZQ.store.favList();
    var root = el('div');
    root.appendChild(U.crumb('返回首页', function () { HZQ.app.go('#/'); }));
    root.appendChild(U.pageHead('重点收藏', '答案默认收起来，先自己回忆一遍，再点开核对。', []));

    if (!list.length) {
      root.appendChild(U.empty('star', '还没有收藏题目',
        '答题时点右上角的「收藏」，或者在题目回顾里加入收藏，题目就会出现在这里。',
        U.btn('去刷题', { kind: 'primary', icon: 'play', onClick: function () { HZQ.app.go('#/'); } })));
      return root;
    }

    var stats = el('div', { class: 'stats', style: 'margin-bottom:18px' });
    stats.appendChild(U.statCard(list.length, '收藏题目', 'pri'));
    var banks = {};
    list.forEach(function (it) {
      var q = HZQ.data.question(it.qid);
      if (q) banks[q.bankId] = 1;
    });
    stats.appendChild(U.statCard(Object.keys(banks).length, '涉及题库'));
    stats.appendChild(U.statCard(HZQ.store.wrongList().length, '错题本', 'bad'));
    root.appendChild(stats);

    var qids = list.map(function (it) { return it.qid; }).filter(function (qid) { return !!HZQ.data.question(qid); });
    if (qids.length) root.appendChild(practiceCard(qids));

    list.forEach(function (it) {
      var q = HZQ.data.question(it.qid);
      if (q) root.appendChild(favCard(q, it.info));
    });
    return root;
  }

  function practiceCard(qids) {
    var card = el('div', { class: 'card pad fav-practice' });
    var head = el('div', { class: 'spread' });
    var txt = el('div');
    txt.appendChild(el('div', { class: 'fav-practice-title', text: '把收藏题变成一轮练习' }));
    txt.appendChild(el('div', { class: 'tiny muted', text: '跨题库也可以一起练；提交后立即判题并显示解析。' }));
    head.appendChild(txt);
    head.appendChild(el('span', { class: 'tag star', text: qids.length + ' 题' }));
    card.appendChild(head);

    var row = el('div', { class: 'row-2', style: 'margin-top:12px' });
    row.appendChild(U.btn('开始练习收藏题', {
      kind: 'primary', icon: 'play',
      onClick: function () { startFavPractice(qids, false); }
    }));
    row.appendChild(U.btn('随机顺序', {
      icon: 'shuffle',
      onClick: function () { startFavPractice(qids, true); }
    }));
    card.appendChild(row);
    return card;
  }

  function startFavPractice(qids, shuffle, modeName) {
    var qs = qids.map(function (qid) { return HZQ.data.question(qid); }).filter(Boolean);
    if (!qs.length) { M.toast('没有可练习的收藏题', 'bad'); return; }
    if (shuffle) qs = M.shuffle(qs);

    function doStart() {
      HZQ.app.start({
        bankId: qs[0].bankId,
        mode: 'sequence',
        questionIds: qs.map(function (q) { return q.id; }),
        instant: true,
        bankTitle: '我的收藏',
        modeName: modeName || (shuffle ? '随机收藏练习' : '收藏练习')
      });
    }

    // 收藏练习会借用第一题所在题库的断点槽位；有未完成练习时先提醒，避免静默覆盖。
    if (HZQ.store.resumable(qs[0].bankId)) {
      M.confirmBox({
        title: '这个题库还有未完成的练习',
        body: el('p', { text: '开始收藏练习会覆盖该题库原来的断点进度。要继续吗？' }),
        okText: '继续收藏练习'
      }).then(function (ok) { if (ok) doStart(); });
    } else {
      doStart();
    }
  }

  function favCard(q, info) {
    var bank = HZQ.data.bank(q.bankId) || {};
    var chapter = (bank.chapterById || {})[q.chapterId] || null;
    var card = el('div', { class: 'card pad fav-card' });

    var top = el('div', { class: 'qtop' });
    top.appendChild(el('span', { class: 'no', text: '第 ' + q.no + ' 题' }));
    top.appendChild(U.typeTag(q));
    top.appendChild(el('span', { class: 'tag', text: bank.title || q.bankId }));
    if (chapter) top.appendChild(el('span', { class: 'tag line', text: chapter.title }));
    top.appendChild(el('span', { class: 'grow' }));
    top.appendChild(el('span', { class: 'tag star', text: '收藏于 ' + M.dateText(info.at) }));
    card.appendChild(top);

    card.appendChild(el('div', { class: 'stem', style: 'font-size:15.5px', html: M.rich(q.stem) }));

    var opts = el('div', { style: 'margin-top:13px' });
    q.options.forEach(function (o) {
      var row = el('div', { class: 'opt locked' });
      row.appendChild(el('span', { class: 'k', text: o.key }));
      row.appendChild(el('span', { class: 't', html: M.rich(o.text) }));
      opts.appendChild(row);
    });
    if (!q.options.length) {
      opts.appendChild(el('div', {
        class: 'feedback na',
        html: M.icon('alert') + '<div class="fb-body">' + M.esc(HZQ.grading.anomalyText(q)) + '</div>'
      }));
    }
    card.appendChild(opts);

    var actions = el('div', { class: 'row-2', style: 'margin-top:14px' });
    actions.appendChild(U.btn('做这道题', {
      small: true, kind: 'primary', icon: 'play',
      onClick: function () { startFavPractice([q.id], false, '单题练习'); }
    }));
    if (HZQ.ai) {
      actions.appendChild(U.btn('问 AI', {
        small: true, kind: 'ghost', icon: 'lightbulb',
        onClick: function () { HZQ.ai.askQuestion(q, null, null); }
      }));
    }
    var detail = el('div', { class: 'fav-detail', hidden: 'hidden' });
    var toggle = U.btn('显示答案和解析', {
      icon: 'eye', kind: 'primary', small: true,
      onClick: function () {
        var open = !detail.hasAttribute('hidden');
        if (open) {
          detail.setAttribute('hidden', 'hidden');
          detail.innerHTML = '';
          setBtn(toggle, '显示答案和解析', 'eye');
        } else {
          detail.innerHTML = '';
          detail.appendChild(HZQ.views.review.answerPanel(q, []));
          detail.removeAttribute('hidden');
          setBtn(toggle, '收起答案', 'left');
        }
      }
    });
    actions.appendChild(toggle);
    actions.appendChild(U.btn('取消收藏', {
      small: true, kind: 'ghost', icon: 'star',
      onClick: function () {
        HZQ.store.removeFav(q.id);
        M.toast('已取消收藏', 'ok');
        HZQ.app.go('#/favorites');
      }
    }));
    actions.appendChild(el('span', {
      class: 'tiny muted',
      text: '先自己想一想，再核对答案，记忆会更牢。'
    }));
    card.appendChild(actions);
    card.appendChild(detail);
    return card;
  }

  function setBtn(btn, text, icon) {
    btn.innerHTML = M.icon(icon) + '<span>' + M.esc(text) + '</span>';
  }

  return { render: render };
})();
