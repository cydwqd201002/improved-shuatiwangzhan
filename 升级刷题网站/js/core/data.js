/* ==========================================================================
   data.js —— 题库访问层
   --------------------------------------------------------------------------
   把 window.QUIZ_DATA（内置题库，当前为空）和用户上传的题库合并成一份
   带索引的只读接口。页面里任何地方都只通过这里取题，保证"同一道题在任何
   页面都是同一份数据"。

   用户上传的题库保存在 localStorage（hqz.userBanks.v1），不会上传服务器。
   ========================================================================== */
window.HZQ = window.HZQ || {};

HZQ.data = (function () {
  'use strict';

  var USER_BANKS_KEY = 'hqz.userBanks.v1';

  var raw = window.QUIZ_DATA || { banks: [], issues: [] };
  var baseBanks = raw.banks || [];
  var baseIssues = raw.issues || [];

  var banks = [];
  var issues = [];
  var bankById = {};
  var qById = {};
  var qIndex = {};      // qid -> 在所属题库中的序号（0 基）

  function readUserBanks() {
    try {
      var txt = window.localStorage.getItem(USER_BANKS_KEY);
      var arr = txt ? JSON.parse(txt) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function userBanks() { return readUserBanks(); }

  /** 覆盖保存用户题库；写满 localStorage 时抛出可读错误。 */
  function saveUserBanks(list) {
    list = Array.isArray(list) ? list : [];
    try {
      window.localStorage.setItem(USER_BANKS_KEY, JSON.stringify(list));
    } catch (e) {
      throw new Error('浏览器本地空间不足，无法保存题库。可以删除一些旧题库，或换用更小的文件。');
    }
    refresh();
    return list;
  }

  function difficultyOf(q) {
    var d = q.type === 'judge' ? 1 : (q.type === 'multiple' ? 3 : 2);
    var stem = String(q.stem || '');
    if (stem.length > 60) d++;
    if (stem.length > 120) d++;
    if ((q.answer || []).length > 1) d++;
    if (q.explanation && String(q.explanation).length > 120) d++;
    if (stem.indexOf('```') >= 0) d++;
    return Math.max(1, Math.min(5, d));
  }

  function typeLabelOf(t) {
    return t === 'multiple' ? '多选题' : (t === 'judge' ? '判断题' : '单选题');
  }

  /** 兜底补齐题库字段，保证老数据 / 手写 JSON 也能正常打开。 */
  function normalizeBank(b, index) {
    b = b && typeof b === 'object' ? b : {};
    b.id = String(b.id || ('bank-' + (index + 1)));
    b.title = String(b.title || b.name || '未命名题库');
    b.desc = String(b.desc || b.description || '');
    b.questions = Array.isArray(b.questions) ? b.questions : [];
    b.chapters = Array.isArray(b.chapters) ? b.chapters : [];

    b.chapters = b.chapters.map(function (c, ci) {
      if (typeof c === 'string') c = { id: b.id + '-c' + (ci + 1), title: c };
      c = c || {};
      c.id = String(c.id || (b.id + '-c' + (ci + 1)));
      c.title = String(c.title || c.name || ('第 ' + (ci + 1) + ' 章'));
      c.order = Number(c.order) || (ci + 1);
      return c;
    });

    b.questions = b.questions.map(function (q, qi) {
      q = q && typeof q === 'object' ? q : {};
      q.id = String(q.id || (b.id + '-' + (qi + 1)));
      q.bankId = b.id;
      q.no = Number(q.no) || (qi + 1);
      var typeText = String(q.type || '');
      q.type = q.type === 'multiple' || q.type === 'judge' ? q.type
        : (/多\s*选|multiple/i.test(typeText) ? 'multiple'
          : (/判\s*断|judge/i.test(typeText) ? 'judge' : 'single'));
      q.typeLabel = q.typeLabel || typeLabelOf(q.type);
      q.stem = String(q.stem || q.question || q.title || q.content || '');
      q.options = (Array.isArray(q.options) ? q.options : []).map(function (o, oi) {
        if (typeof o === 'string') return { key: String.fromCharCode(65 + oi), text: o.trim() };
        if (!o || typeof o !== 'object') return null;
        return {
          key: String(o.key || o.label || String.fromCharCode(65 + oi)).toUpperCase(),
          text: String(o.text !== undefined ? o.text : (o.value !== undefined ? o.value : '')).trim()
        };
      }).filter(function (o) { return o && o.text; });
      var ans = q.answer;
      if (ans === true) q.answer = ['A'];
      else if (ans === false) q.answer = ['B'];
      else if (Array.isArray(ans)) q.answer = ans.map(function (k) { return String(k).toUpperCase(); });
      else if (typeof ans === 'string') {
        var up = ans.toUpperCase();
        q.answer = /^[A-H](?:\s*[、,，\/;；\s]*[A-H])*$/.test(up)
          ? (up.match(/[A-H]/g) || []).filter(function (v, i, arr) { return arr.indexOf(v) === i; })
          : (up.match(/^[A-H]{2,6}$/) ? up.split('') : []);
      } else q.answer = ans ? [String(ans).toUpperCase()] : [];
      q.answerRaw = q.answerRaw !== undefined ? q.answerRaw : q.answer.join('、');
      q.explanation = q.explanation === undefined || q.explanation === null ? '' : String(q.explanation);
      q.chapterId = q.chapterId ? String(q.chapterId) : '';
      q.flags = Array.isArray(q.flags) ? q.flags : [];
      q.hidden = !!q.hidden;
      q.scorable = q.scorable === undefined || q.scorable === null
        ? !!(q.stem && q.options.length && q.answer.length) : !!q.scorable;
      return q;
    });

    b.questionCount = b.questions.length;
    b.scorableCount = b.questions.filter(function (q) { return q.scorable; }).length;
    b.typeCount = {};
    b.questions.forEach(function (q) { b.typeCount[q.type] = (b.typeCount[q.type] || 0) + 1; });
    b.subtitle = b.subtitle || (b.questionCount + ' 题');
    b.user = !!b.user;
    return b;
  }

  function build() {
    banks = baseBanks.concat(readUserBanks()).map(normalizeBank);
    issues = baseIssues.slice();
    bankById = {};
    qById = {};
    qIndex = {};

    banks.forEach(function (b) {
      bankById[b.id] = b;
      b.questions.forEach(function (q, i) {
        qById[q.id] = q;
        qIndex[q.id] = i;
        q._bank = b;                 // 反向引用，避免到处传 bank
      });
      b.chapterById = {};
      (b.chapters || []).forEach(function (c) { b.chapterById[c.id] = c; });
    });

    /* ---------- 知识点章节：优先使用题库自己的章节，没有章节时归入综合 ---------- */
    banks.forEach(function (b) {
      var groups = {};
      var order = [];

      if ((b.chapters || []).length) {
        b.chapters.forEach(function (c) {
          groups[c.id] = { id: c.id, title: c.title, order: c.order || order.length + 1, questionIds: [] };
          order.push(groups[c.id]);
        });
      } else {
        groups[b.id + '-all'] = { id: b.id + '-all', title: '全部题目', order: 1, questionIds: [] };
        order.push(groups[b.id + '-all']);
      }

      b.questions.forEach(function (q) {
        q.difficulty = difficultyOf(q);
        var ch = (b.chapterById || {})[q.chapterId];
        if (!ch) {
          // 没有指定章节的题目：只有一个章节时放进去，多章节时归入「未分类」
          if ((b.chapters || []).length === 1) {
            ch = b.chapters[0];
            q.chapterId = ch.id;
          } else if ((b.chapters || []).length > 1) {
            var miscId = b.id + '-misc';
            if (!groups[miscId]) {
              groups[miscId] = { id: miscId, title: '未分类', order: 999, questionIds: [] };
              order.push(groups[miscId]);
            }
            q.chapterId = '';
            q.knowledgeId = miscId;
            q.knowledgeTitle = '未分类';
            groups[miscId].questionIds.push(q.id);
            return;
          } else {
            q.chapterId = b.id + '-all';
            ch = { id: q.chapterId, title: '全部题目' };
          }
        }
        q.knowledgeId = q.chapterId || 'misc';
        q.knowledgeTitle = ch ? ch.title : '全部题目';
        if (!groups[q.knowledgeId]) {
          groups[q.knowledgeId] = { id: q.knowledgeId, title: q.knowledgeTitle, order: 999, questionIds: [] };
          order.push(groups[q.knowledgeId]);
        }
        groups[q.knowledgeId].questionIds.push(q.id);
      });

      b.knowledgeChapters = order.filter(function (g) { return g.questionIds.length; })
        .sort(function (a, b2) { return a.order - b2.order; });
    });

    if (HZQ.data) HZQ.data.banks = banks;
    return banks;
  }

  function refresh() {
    var out = build();
    indexIssues();
    return out;
  }

  var issuesByBank = {};
  var issuesByQuestion = {};
  function indexIssues() {
    issuesByBank = {};
    issuesByQuestion = {};
    issues.forEach(function (it) {
      if (it.bankId) (issuesByBank[it.bankId] = issuesByBank[it.bankId] || []).push(it);
      if (it.questionId) (issuesByQuestion[it.questionId] = issuesByQuestion[it.questionId] || []).push(it);
    });
  }

  function bank(id) { return bankById[id] || null; }
  function question(id) { return qById[id] || null; }
  function indexOf(qid) { return qIndex[qid]; }

  /** 取某题库的题目列表，可按章节过滤；order='random' 时打乱 */
  function questions(bankId, opts) {
    opts = opts || {};
    var b = bank(bankId);
    if (!b) return [];
    var list = b.questions.filter(function (q) { return !q.hidden; });
    if (opts.knowledgeIds && opts.knowledgeIds.length) {
      var kset = {};
      opts.knowledgeIds.forEach(function (k) { kset[k] = 1; });
      list = list.filter(function (q) { return kset[q.knowledgeId]; });
    }
    if (opts.chapterIds && opts.chapterIds.length) {
      var set = {};
      opts.chapterIds.forEach(function (c) { set[c] = 1; });
      list = list.filter(function (q) { return set[q.chapterId]; });
    }
    if (opts.onlyScorable) list = list.filter(function (q) { return q.scorable; });
    if (opts.order === 'random') return HZQ.util.shuffle(list);
    return list.slice();
  }

  /** 全部题目（含被数据体检隐藏的题，供搜题和体检使用） */
  function allQuestions() {
    var out = [];
    banks.forEach(function (b) {
      b.questions.forEach(function (q) { out.push(q); });
    });
    return out;
  }

  function chapterQuestions(bankId, chapterId) {
    return questions(bankId, { chapterIds: [chapterId] });
  }

  function knowledgeChapters(bankId) {
    var b = bank(bankId);
    return b && b.knowledgeChapters ? b.knowledgeChapters.slice() : [];
  }

  function knowledgeQuestions(bankId, knowledgeIds) {
    return questions(bankId, { knowledgeIds: knowledgeIds || [] });
  }

  function sortByDifficulty(list) {
    return (list || []).slice().sort(function (a, b) {
      return (a.difficulty || 0) - (b.difficulty || 0) || (a.no || 0) - (b.no || 0);
    });
  }

  function difficultyLabel(q) {
    var d = q.difficulty || 1;
    return d <= 1 ? '入门' : (d === 2 ? '基础' : (d === 3 ? '进阶' : (d === 4 ? '较难' : '挑战')));
  }

  /** 跨题库搜索题干（也支持按选项文本搜） */
  function search(kw, limit) {
    kw = String(kw || '').trim().toLowerCase();
    if (!kw) return [];
    var out = [];
    for (var i = 0; i < banks.length; i++) {
      var b = banks[i];
      for (var j = 0; j < b.questions.length; j++) {
        var q = b.questions[j];
        if (q.stem.toLowerCase().indexOf(kw) >= 0 ||
            (q.explanation || '').toLowerCase().indexOf(kw) >= 0 ||
            q.options.some(function (o) { return o.text.toLowerCase().indexOf(kw) >= 0; })) {
          out.push({ bank: b, question: q });
          if (limit && out.length >= limit) return out;
        }
      }
    }
    return out;
  }

  function issuesOfBank(bankId) { return issuesByBank[bankId] || []; }
  function issuesOfQuestion(qid) { return issuesByQuestion[qid] || []; }

  /** 全站总览，首页用 */
  function overview() {
    var total = 0, scorable = 0, chapters = 0;
    banks.forEach(function (b) {
      total += b.questions.length;
      scorable += b.questions.filter(function (q) { return q.scorable; }).length;
      chapters += (b.chapters || []).length;
    });
    return { banks: banks.length, questions: total, scorable: scorable, chapters: chapters, issues: issues.length };
  }

  build();
  indexIssues();

  return {
    raw: raw,
    USER_BANKS_KEY: USER_BANKS_KEY,
    userBanks: userBanks,
    saveUserBanks: saveUserBanks,
    refresh: refresh,
    banks: banks,
    issues: issues,
    bank: bank,
    question: question,
    indexOf: indexOf,
    questions: questions,
    allQuestions: allQuestions,
    chapterQuestions: chapterQuestions,
    knowledgeChapters: knowledgeChapters,
    knowledgeQuestions: knowledgeQuestions,
    sortByDifficulty: sortByDifficulty,
    difficultyLabel: difficultyLabel,
    search: search,
    issuesOfBank: issuesOfBank,
    issuesOfQuestion: issuesOfQuestion,
    overview: overview
  };
})();
