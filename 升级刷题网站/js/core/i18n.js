/* ==========================================================================
   i18n.js —— 界面语言（导航 / 页面标题 / 按钮 / 标签 / 系统提示）
   --------------------------------------------------------------------------
   题库题干、选项、答案、解析、评论、AI 回答等“内容”保持原文，不做翻译。
   界面文字通过两层处理：
     1) 组件里的 HZQ.i18n.t(...) 用于导航、页面标题等少量固定文案；
     2) 一个轻量 DOM 翻译器 + MutationObserver，把界面上的中文标签、按钮、
        动态提示翻译成 English / 日本語，同时跳过题目内容区域。
   ========================================================================== */
window.HZQ = window.HZQ || {};

HZQ.i18n = (function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. 语义键（导航、页面标题、深夜提醒、账户）
     ------------------------------------------------------------------------ */
  var DICT = {
    zh: {
      'app.title': '刷题',
      'nav.home': '首页',
      'nav.wrong': '错题本',
      'nav.favorites': '收藏',
      'nav.history': '记录',
      'page.home': '首页',
      'page.bank': '题库',
      'page.quiz': '答题',
      'page.result': '练习结果',
      'page.wrong': '错题本',
      'page.favorites': '重点收藏',
      'page.history': '成绩记录',
      'page.search': '搜题',
      'page.quality': '数据体检',
      'page.settings': '设置与备份',
      'page.trial': '用户测试',
      'theme.title': '要切换到深色模式吗？',
      'theme.body': '你所在的时区已经进入傍晚，深色背景会更适合阅读。',
      'theme.dark': '开启深色',
      'theme.midnight': '午夜紫',
      'theme.light': '保持浅色',
      'theme.settings': '去设置选择颜色',
      'theme.disable': '以后不再提醒',
      'account.login': '登录',
      'account.register': '注册',
      'account.logout': '退出登录'
    },
    en: {
      'app.title': 'Quiz',
      'nav.home': 'Home',
      'nav.wrong': 'Mistakes',
      'nav.favorites': 'Saved',
      'nav.history': 'History',
      'page.home': 'Home',
      'page.bank': 'Banks',
      'page.quiz': 'Quiz',
      'page.result': 'Result',
      'page.wrong': 'Mistake Book',
      'page.favorites': 'Saved Questions',
      'page.history': 'Score History',
      'page.search': 'Search',
      'page.quality': 'Data Check',
      'page.settings': 'Settings & Backup',
      'page.trial': 'User Test',
      'theme.title': 'Switch to dark mode?',
      'theme.body': 'It is getting dark in your time zone. A dark background may be easier to read.',
      'theme.dark': 'Use dark',
      'theme.midnight': 'Midnight',
      'theme.light': 'Stay light',
      'theme.settings': 'Choose a color',
      'theme.disable': 'Do not remind me again',
      'account.login': 'Log in',
      'account.register': 'Register',
      'account.logout': 'Log out'
    },
    ja: {
      'app.title': 'クイズ',
      'nav.home': 'ホーム',
      'nav.wrong': '間違い',
      'nav.favorites': '保存',
      'nav.history': '記録',
      'page.home': 'ホーム',
      'page.bank': '問題集',
      'page.quiz': '回答',
      'page.result': '結果',
      'page.wrong': '間違いノート',
      'page.favorites': '保存した問題',
      'page.history': '成績記録',
      'page.search': '検索',
      'page.quality': 'データ診断',
      'page.settings': '設定とバックアップ',
      'page.trial': 'ユーザーテスト',
      'theme.title': 'ダークモードに切り替えますか？',
      'theme.body': 'お住まいのタイムゾーンは夕方になりました。暗い背景の方が読みやすい場合があります。',
      'theme.dark': 'ダークにする',
      'theme.midnight': 'ミッドナイト',
      'theme.light': 'ライトのまま',
      'theme.settings': '色を選ぶ',
      'theme.disable': '今後表示しない',
      'account.login': 'ログイン',
      'account.register': '登録',
      'account.logout': 'ログアウト'
    }
  };

  /* ------------------------------------------------------------------------
     2. 界面短语（中文原文 -> [English, 日本語]）
     只放界面文字，不放题干 / 选项 / 答案解析。
     ------------------------------------------------------------------------ */
  var PHRASES = {
    /* 通用动作 */
    '返回首页': ['Back to home', 'ホームに戻る'],
    '回到首页': ['Back to home', 'ホームに戻る'],
    '返回题库': ['Back to bank', '問題集に戻る'],
    '返回题库列表': ['Back to banks', '問題集一覧に戻る'],
    '返回': ['Back', '戻る'],
    '取消': ['Cancel', 'キャンセル'],
    '确定': ['OK', 'OK'],
    '确认': ['Confirm', '確認'],
    '关闭': ['Close', '閉じる'],
    '删除': ['Delete', '削除'],
    '删除选中': ['Delete selected', '選択を削除'],
    '保存': ['Save', '保存'],
    '保存配置': ['Save settings', '設定を保存'],
    '清除': ['Clear', 'クリア'],
    '清除 Key': ['Clear key', 'キーを削除'],
    '使用': ['Use', '使用'],
    '使用中': ['In use', '使用中'],
    '佩戴': ['Wear', '装着'],
    '佩戴中': ['Wearing', '装着中'],
    '查看': ['View', '表示'],
    '查看详情': ['View details', '詳細を見る'],
    '查看题目': ['View question', '問題を見る'],
    '查看全部': ['View all', 'すべて見る'],
    '去完成': ['Go', '完了する'],
    '去刷题': ['Practice', '問題を解く'],
    '去设置 API': ['Set up API', 'API を設定'],
    '检查 API 设置': ['Check API settings', 'API 設定を確認'],
    '开始答题': ['Start quiz', '開始'],
    '开始练习': ['Start practice', '練習を開始'],
    '开始练习收藏题': ['Practice saved questions', '保存した問題を練習'],
    '随机顺序': ['Random order', 'ランダム順'],
    '继续': ['Continue', '続ける'],
    '继续答题': ['Continue', '続ける'],
    '继续练习': ['Continue practice', '練習を続ける'],
    '再练一次': ['Practice again', 'もう一度'],
    '再刷一遍': ['Practice again', 'もう一度'],
    '重做本题': ['Retry question', 'この問題をやり直す'],
    '下一题': ['Next', '次へ'],
    '上一题': ['Previous', '前へ'],
    '提交答案': ['Submit', '回答を送信'],
    '交卷': ['Finish', '提出'],
    '跳过这题': ['Skip', 'スキップ'],
    '换一句': ['Another', '別の一言'],
    '复制': ['Copy', 'コピー'],
    '已复制': ['Copied', 'コピーしました'],
    '收藏': ['Save', '保存'],
    '已收藏': ['Saved', '保存済み'],
    '取消收藏': ['Unsave', '保存を解除'],
    '显示答案和解析': ['Show answer & explanation', '答えと解説を表示'],
    '收起答案': ['Hide answer', '答えを閉じる'],
    '做这道题': ['Do this question', 'この問題を解く'],
    '问 AI': ['Ask AI', 'AI に聞く'],
    '发表评论': ['Post comment', 'コメントを投稿'],
    '发送': ['Send', '送信'],
    '提交反馈': ['Submit feedback', 'フィードバックを送信'],
    '登录': ['Log in', 'ログイン'],
    '注册': ['Register', '登録'],
    '退出登录': ['Log out', 'ログアウト'],
    '注册本地账户': ['Create local account', 'ローカルアカウントを作成'],
    '去设置选择颜色': ['Choose a theme', 'テーマを選ぶ'],
    '保持浅色': ['Stay light', 'ライトのまま'],
    '以后不再提醒': ['Do not remind again', '今後表示しない'],
    '开启深色': ['Use dark', 'ダークにする'],
    '主题': ['Theme', 'テーマ'],
    '确认交卷？': ['Finish the quiz?', '提出しますか？'],
    '再检查一下': ['Check again', 'もう一度確認'],
    '确认导入题库': ['Import questions?', '問題集を読み込みますか？'],
    '导入': ['Import', '読み込む'],
    '导入失败': ['Import failed', '読み込み失敗'],
    '正在解析题库': ['Parsing questions…', '問題集を解析中…'],
    '题库名称': ['Bank name', '問題集名'],
    '选择文件': ['Choose file', 'ファイルを選択'],
    '下载示例题库': ['Download sample', 'サンプルをダウンロード'],
    '格式说明': ['Format guide', '形式ガイド'],
    '查看格式说明': ['View format guide', '形式ガイドを見る'],
    '上传你的题库': ['Upload your questions', '問題集をアップロード'],
    '我的题库': ['My banks', 'マイ問題集'],
    '拖拽文件到这里，或点击选择文件': ['Drag a file here, or click to choose', 'ここにファイルをドラッグ、またはクリックして選択'],
    '把自己的题目导入进来，格式和样式保持原样。': ['Import your own questions while keeping the original format and design.', '自分の問題を元の形式とデザインのまま読み込みます。'],
    '支持 JSON、TXT、Markdown、Word、Excel、PDF 等格式。': ['Supports JSON, TXT, Markdown, Word, Excel, PDF and more.', 'JSON、TXT、Markdown、Word、Excel、PDF などに対応。'],
    '还没有题库。点击上面的「选择文件」上传，或先': ['No banks yet. Click “Choose file” above, or first', '問題集がありません。上の「ファイルを選択」から追加するか、まず'],
    '下载示例题库': ['Download sample', 'サンプルをダウンロード'],
    '看看格式。': ['to see the format.', '形式を確認してください。'],
    '题库和练习进度都只保存在你自己的浏览器里，不上传任何服务器。': ['Banks and progress are stored only in your browser; nothing is uploaded to a server.', '問題集と進捗はブラウザ内にのみ保存され、サーバーには送信されません。'],
    '支持 JSON、TXT、Markdown、Word、Excel、PDF 等格式。': ['Supports JSON, TXT, Markdown, Word, Excel, PDF and more.', 'JSON、TXT、Markdown、Word、Excel、PDF などに対応。'],

    /* 首页 / 导航 */
    '早上好': ['Good morning', 'おはようございます'],
    '中午好': ['Good afternoon', 'こんにちは'],
    '下午好': ['Good afternoon', 'こんにちは'],
    '晚上好': ['Good evening', 'こんばんは'],
    '还没睡？': ['Still awake?', 'まだ起きていますか？'],
    '今天也来刷几道？': ['Ready for a few questions today?', '今日も問題を解きますか？'],
    '还没有题库 · 上传你的第一份题库，就能开始练习': ['No banks yet · Upload your first bank to start practicing', '問題集がありません · 最初の問題集をアップロードして始めましょう'],
    '全部功能': ['All features', 'すべての機能'],
    '搜索功能：番茄钟、考试模式、错题本、深色模式…': ['Search features: Pomodoro, exam mode, mistakes, dark mode…', '機能を検索：ポモドーロ、試験モード、間違いノート、ダークモード…'],
    '点击即可打开': ['Click to open', 'クリックで開く'],
    '没有找到对应功能，换个说法试试，例如“考试”“休息”“深色”。': ['No matching feature. Try another word, e.g. “exam”, “break”, “dark”.', '該当する機能がありません。「試験」「休憩」「ダーク」などで試してください。'],
    '累计作答': ['Answered', '累計回答'],
    '总正确率': ['Accuracy', '正答率'],
    '错题本': ['Mistakes', '間違いノート'],
    '练习次数': ['Sessions', '練習回数'],
    '继续上次': ['Continue last', '前回の続き'],
    '继续上次：': ['Continue: ', '前回の続き：'],
    '接着做': ['Resume', '再開'],
    '我的': ['Mine', 'マイ'],
    '重点收藏': ['Saved', '保存'],
    '成绩记录': ['History', '成績記録'],
    '搜题': ['Search', '検索'],
    '数据体检': ['Data check', 'データ診断'],
    '设置与备份': ['Settings', '設定とバックアップ'],
    '积分中心': ['Points', 'ポイントセンター'],
    'AI 答疑': ['AI help', 'AI 解説'],
    'AI 答疑设置': ['AI settings', 'AI 設定'],
    '上传题库': ['Upload bank', '問題集をアップロード'],
    '成长': ['Growth', '成長'],
    '题库': ['Banks', '問題集'],
    '首页': ['Home', 'ホーム'],
    '收藏': ['Saved', '保存'],
    '记录': ['History', '記録'],
    '查看积分、佩戴称号、用积分解锁酷炫主题': ['View points, wear titles and unlock cool themes', 'ポイント確認・称号装着・テーマ解放'],
    '填入自己的 API Key，在答题时让 AI 讲解题目': ['Add your API key and let AI explain questions', '自分の API キーで AI 解説を利用'],
    '关键词、模糊匹配、历史记录、预览': ['Keywords, fuzzy matching, history and preview', 'キーワード・あいまい検索・履歴・プレビュー'],
    '正确率曲线、薄弱知识点和建议': ['Accuracy trend, weak topics and suggestions', '正答率の推移・苦手分野・提案'],
    '上传其他用户成绩 JSON 做对比': ['Compare with another user’s score JSON', '他のユーザーの成績 JSON と比較'],
    '检查题库异常，查看原因和处理建议': ['Check bank issues, reasons and suggestions', '問題集の異常・原因・対処案を確認'],
    '按场景完成任务并填写体验建议': ['Complete scenario tasks and leave feedback', 'シナリオを試してフィードバック'],
    '开始专注计时，自动安排休息': ['Start a focus timer with automatic breaks', '集中タイマーと自動休憩'],
    '进入短暂休息倒计时': ['Start a short break countdown', '短い休憩タイマー'],
    '切换深色 / 浅色模式': ['Toggle dark / light mode', 'ダーク / ライトを切り替え'],
    '主题颜色设置': ['Theme colors', 'テーマカラー'],
    '界面自定义': ['Interface settings', 'インターフェース設定'],
    '背景音乐': ['Background music', 'BGM'],
    '界面语言': ['Language', '言語'],
    '防眩晕模式': ['Motion reduction', '動きを抑える'],
    '日落后提醒深色模式': ['Dark mode reminder after sunset', '日没後のダークモード通知'],
    '连续做题休息提醒': ['Break reminder', '休憩通知'],
    '登录 / 注册本地账户': ['Log in / create local account', 'ログイン / ローカルアカウント'],
    '导出 / 备份数据': ['Export / backup data', 'エクスポート / バックアップ'],
    '清空数据': ['Clear data', 'データを消去'],
    '设置': ['Settings', '設定'],
    '还没有错题': ['No mistakes yet', '間違いはありません'],
    '上一轮全对，保持住': ['All correct last round. Keep it up!', '前回は全問正解。その調子！'],
    '道待攻克': ['to review', '問を復習'],
    '道已标记': ['saved', '件保存'],
    '次练习': ['sessions', '回の練習'],
    '关键词 / 模糊匹配': ['Keyword / fuzzy match', 'キーワード / あいまい検索'],
    '题库检查通过': ['Bank check passed', '問題集チェック合格'],
    '道题异常': ['issues', '件の問題'],
    '主题 / 导出 / 清空': ['Themes / export / clear', 'テーマ / 書き出し / 消去'],
    '还没有题库 · 上传你的第一份题库，就能开始练习': ['No banks yet · Upload your first bank to start practicing', '問題集がありません · 最初の問題集をアップロードして始めましょう'],

    /* 统计 / 答题 */
    '已答': ['Answered', '回答済み'],
    '答对': ['Correct', '正解'],
    '答错': ['Wrong', '不正解'],
    '未答': ['Blank', '未回答'],
    '正确率': ['Accuracy', '正答率'],
    '不计分': ['Not scored', '採点外'],
    '总题数': ['Total questions', '総問題数'],
    '已作答': ['Answered', '回答済み'],
    '题目总数': ['Total questions', '総問題数'],
    '还没作答': ['Unanswered', '未回答'],
    '预计答对': ['Estimated correct', '正解見込み'],
    '用时': ['Time', '所要時間'],
    '分题型': ['By type', 'タイプ別'],
    '表现不错': ['Nice work', 'よくできました'],
    '继续加油': ['Keep going', 'その調子'],
    '再练一轮': ['Practice again', 'もう一度'],
    '你的答案': ['Your answer', 'あなたの答え'],
    '正确答案': ['Correct answer', '正解'],
    '回答正确': ['Correct', '正解です'],
    '回答错误': ['Incorrect', '不正解です'],
    '解析': ['Explanation', '解説'],
    '收藏于': ['Saved', '保存日時'],
    '本题': ['This question', 'この問題'],
    '剩余': ['left', '残り'],
    '跳到': ['Jump to', '移動'],
    '题目列表': ['Question list', '問題一覧'],
    '评论': ['Comments', 'コメント'],
    '还没有人留言。说说你的思路或疑问吧。': ['No comments yet. Share your thoughts or questions.', 'まだコメントはありません。考えや疑問を書きましょう。'],
    '仅保存在本机，多个本地账户可见': ['Stored locally, visible to local accounts', 'この端末に保存され、ローカルアカウントで共有されます'],
    '昵称（可匿名）': ['Nickname (optional)', 'ニックネーム（任意）'],
    '写下你的结论、疑问或解题思路…': ['Share your conclusion, question or approach…', '結論や疑問、解き方を書きましょう…'],
    '还没有收藏题目': ['No saved questions yet', '保存した問題はありません'],
    '答案默认收起来，先自己回忆一遍，再点开核对。': ['Answers are hidden by default. Recall first, then reveal.', '答えは最初は隠れています。まず思い出してから確認しましょう。'],
    '涉及题库': ['Banks', '問題集'],
    '收藏题目': ['Saved questions', '保存した問題'],
    '先自己想一想，再核对答案，记忆会更牢。': ['Think first, then check the answer.', 'まず考えてから答えを確認すると記憶に残ります。'],
    '把收藏题变成一轮练习': ['Turn saved questions into a practice round', '保存した問題を練習に'],
    '跨题库也可以一起练；提交后立即判题并显示解析。': ['Mix questions from different banks; instant grading and explanations.', '問題集をまたいで練習できます。送信後にすぐ採点と解説を表示します。'],
    '错题重练': ['Mistake practice', '間違いを練習'],
    '收藏重练': ['Saved practice', '保存を練習'],
    '模拟考试': ['Mock exam', '模擬試験'],
    '章节练习': ['Chapter practice', '章別練習'],
    '顺序练习': ['Sequential', '順番'],
    '随机练习': ['Random', 'ランダム'],
    '只做未做': ['Unseen only', '未回答のみ'],
    '练习方式': ['Practice mode', '練習方法'],
    '章节 / 知识点': ['Chapters / topics', '章 / 知識ポイント'],
    '全部章节': ['All chapters', 'すべての章'],
    '这一轮做多少': ['How many this round?', '今回の出題数'],
    '全部': ['All', 'すべて'],
    '打乱顺序': ['Shuffle', '順番をシャッフル'],
    '边做边判': ['Instant feedback', 'その場で採点'],
    '答对自动下一题': ['Auto next on correct', '正解で次へ'],
    '限时交卷': ['Timed finish', '時間制限'],
    '限时时长': ['Time limit', '制限時間'],
    '整个题库': ['Whole bank', '問題集全体'],
    '选中的章节': ['Selected chapters', '選択した章'],
    '收藏本': ['Saved', '保存'],
    '开始答题': ['Start', '開始'],
    '随机来 10 题': ['Random 10', 'ランダム10問'],
    '总题数': ['Total', '総数'],
    '按题库原顺序从头到尾过一遍': ['Go through the bank in original order', '問題集の順番に最初から最後まで'],
    '打乱顺序，避免靠题号背答案': ['Shuffle to avoid memorizing by number', '順番を変えて番号暗記を防ぐ'],
    '只刷选中的章节，适合分批推进': ['Only selected chapters; good for studying in parts', '選択した章だけを練習'],
    '跳过已经答过的题': ['Skip questions already answered', '回答済みをスキップ'],
    '只做错题本里的题，答对自动移出': ['Only mistakes; correct answers remove them', '間違いノートのみ。正解で自動的に外れます'],
    '只做自己标了重点的题': ['Only saved questions', '保存した問題のみ'],
    '中途不给对错，交卷后统一判分': ['No feedback until submission', '途中では正誤を表示せず、提出後に採点'],
    '单选题': ['Single choice', '単一選択'],
    '多选题': ['Multiple choice', '複数選択'],
    '判断题': ['True / False', '正誤問題'],
    '单选题：': ['Single choice: ', '単一選択：'],
    '多选题：': ['Multiple choice: ', '複数選択：'],
    '判断题：': ['True / False: ', '正誤問題：'],

    /* 数据体检 / 用户测试 */
    '实时检查题库的答案、选项、解析和重复题；异常标记必须由你手动点击。': ['Scan answers, options, explanations and duplicates; fixes are manual.', '答え・選択肢・解説・重複を検査します。修正は手動です。'],
    '异常题目': ['Problem questions', '問題のある問題'],
    '待处理问题': ['Open issues', '未処理の問題'],
    '提示项': ['Notes', 'ヒント'],
    '已标记记录': ['Marked records', 'マーク済み'],
    '待处理': ['Open', '未処理'],
    '已标记': ['Marked', 'マーク済み'],
    '重新检查': ['Check again', '再検査'],
    '当前没有可标记项': ['Nothing to mark', 'マークできる項目はありません'],
    '原因': ['Reason', '理由'],
    '处理建议': ['Suggestion', '対処案'],
    '异常原因': ['Reason', '理由'],
    '用户测试': ['User test', 'ユーザーテスト'],
    '已完成任务': ['Completed', '完了タスク'],
    '反馈条数': ['Feedback', 'フィードバック'],
    '体验建议': ['Feedback', 'フィードバック'],
    '整体评分': ['Overall rating', '総合評価'],
    '具体建议': ['Details', '具体的な提案'],
    '已记录的反馈': ['Saved feedback', '保存されたフィードバック'],
    '很顺手': ['Very smooth', 'とても快適'],
    '不错': ['Good', '良い'],
    '一般': ['Okay', '普通'],
    '有点卡': ['A bit laggy', '少し重い'],
    '很难用': ['Hard to use', '使いにくい'],
    '再看一次': ['View again', 'もう一度見る'],

    /* 成绩 / 清理 */
    '最近练习': ['Recent sessions', '最近の練習'],
    '成绩对比': ['Compare scores', '成績比較'],
    '上传其他用户成绩': ['Upload another user’s scores', '他のユーザーの成績をアップロード'],
    '平均正确率': ['Average accuracy', '平均正答率'],
    '最高正确率': ['Best accuracy', '最高正答率'],
    '练习轮次': ['Rounds', '練習回数'],
    '全部时间': ['All time', '全期間'],
    '今天': ['Today', '今日'],
    '昨天': ['Yesterday', '昨日'],
    '近 7 天': ['Last 7 days', '過去7日'],
    '近 30 天': ['Last 30 days', '過去30日'],
    '错题：全部轮次': ['Mistakes: all rounds', '間違い：すべて'],
    '更早的错题': ['Earlier mistakes', '以前の間違い'],
    '数据清理': ['Data cleanup', 'データ整理'],
    '时间筛选会同时作用于下面所有数据类型。': ['Time filter applies to all data below.', '時間フィルターは以下のすべてに適用されます。'],

    /* 设置 */
    '账户（本地）': ['Account (local)', 'アカウント（ローカル）'],
    '当前账户：': ['Current account: ', '現在のアカウント：'],
    '数据只保存在这台设备；登录后看到的是这个账户自己的进度、错题、收藏和成绩。': ['Data is stored on this device; each account has its own progress, mistakes, saved questions and scores.', 'データはこの端末に保存され、アカウントごとに進捗・間違い・保存・成績が分かれます。'],
    '可以创建一个本地账户来区分不同使用者的数据，也可以先以游客身份使用。账户只保存在本机，跨设备不会同步。': ['Create a local account to separate users, or use guest mode. Accounts stay on this device.', 'ユーザーを分けるためにローカルアカウントを作成できます。端末間の同期はありません。'],
    '积分与成长': ['Points & growth', 'ポイントと成長'],
    '外观主题': ['Themes', 'テーマ'],
    '选一个顺眼的主题；主题会立即生效并保存在本地。': ['Pick a theme; it applies instantly and is saved locally.', 'テーマを選ぶとすぐに適用され、ローカルに保存されます。'],
    '阅读、语言与计时': ['Reading, language & timer', '読書・言語・タイマー'],
    'AI 答疑（自带 Key）': ['AI help (your key)', 'AI 解説（自分のキー）'],
    '导出与备份': ['Export & backup', 'エクスポートとバックアップ'],
    '当前数据：已答 ': ['Current data: answered ', '現在のデータ：回答済み '],
    ' 题 · 错题 ': [' questions · mistakes ', ' 問 · 間違い '],
    ' 道 · 收藏 ': [' · saved ', ' · 保存 '],
    ' 道 · 成绩 ': [' · sessions ', ' · 成績 '],
    ' 轮 · 积分 ': [' · points ', ' · ポイント '],
    '。备份文件是 JSON，包含题库、进度、错题、收藏、成绩、积分和设置（不含 AI Key）。': ['. The JSON backup includes banks, progress, mistakes, saved questions, scores, points and settings (not the AI key).', '。JSON バックアップには問題集・進捗・間違い・保存・成績・ポイント・設定が含まれます（AI キーは含みません）。'],
    '下载备份文件': ['Download backup', 'バックアップをダウンロード'],
    '备份文件已开始下载': ['Backup download started', 'バックアップのダウンロードを開始しました'],
    '界面缩放': ['UI scale', 'UI 拡大率'],
    '内容透明度': ['Content opacity', 'コンテンツの透明度'],
    '按钮间距': ['Button spacing', 'ボタン間隔'],
    '主色': ['Primary color', 'メインカラー'],
    '页面背景': ['Page background', 'ページ背景'],
    '字体': ['Font', 'フォント'],
    '系统字体': ['System', 'システム'],
    '衬线 / 宋体': ['Serif', '明朝体'],
    '圆润字体': ['Rounded', '丸ゴシック'],
    '等宽字体': ['Monospace', '等幅'],
    '自定义背景图 / 小图片': ['Custom background image', 'カスタム背景画像'],
    '未上传时使用网站默认壁纸；图片只保存在本机。': ['Uses the default wallpaper until you upload one; images stay on this device.', '未アップロード時は既定の壁紙を使用します。画像はこの端末に保存されます。'],
    '上传图片': ['Upload image', '画像をアップロード'],
    '清除背景图': ['Clear background', '背景をクリア'],
    '按钮顺序': ['Button order', 'ボタンの順序'],
    '首页快捷入口': ['Home shortcuts', 'ホームのショートカット'],
    '顶部导航': ['Top navigation', 'トップナビ'],
    '恢复默认界面': ['Reset interface', 'インターフェースを初期化'],
    '界面已恢复默认': ['Interface reset', 'インターフェースを初期化しました'],
    '切换导航、页面标题和系统提示；题库原文保持原始中文，不做改写。': ['Translates navigation, page titles and system messages; question content keeps its original language.', 'ナビ・ページタイトル・システムメッセージを翻訳します。問題本文は原文のままです。'],
    '日落后提醒深色模式': ['Dark mode reminder after sunset', '日没後のダークモード通知'],
    '连续做题 2 小时提醒休息': ['Break reminder after 2 hours', '2時間後の休憩通知'],
    '番茄钟': ['Pomodoro', 'ポモドーロ'],
    '开始专注': ['Start focus', '集中開始'],
    '开始休息': ['Start break', '休憩開始'],
    '停止番茄钟': ['Stop timer', 'タイマー停止'],
    '用户测试与体验建议': ['User test & feedback', 'ユーザーテストとフィードバック'],
    '打开用户测试': ['Open user test', 'ユーザーテストを開く'],
    '服务商预设': ['Provider preset', 'プロバイダー'],
    '模型': ['Model', 'モデル'],
    '接口地址': ['API endpoint', 'API エンドポイント'],
    'API Key': ['API Key', 'API キー'],
    '已配置': ['Configured', '設定済み'],
    '未配置': ['Not configured', '未設定'],
    '配置已保存': ['Settings saved', '設定を保存しました'],
    '连接成功': ['Connected', '接続成功'],
    '正在测试连接…': ['Testing connection…', '接続をテスト中…'],
    '测试连接': ['Test connection', '接続テスト'],
    '还没有填写 API Key': ['API key is required', 'API キーを入力してください'],
    '配置已保存，但接口地址、模型或 API Key 还不完整': ['Saved, but endpoint, model or API key is incomplete', '保存しましたが、エンドポイント・モデル・API キーが不完全です'],
    '跟随系统': ['System', 'システム'],
    '浅色': ['Light', 'ライト'],
    '深色': ['Dark', 'ダーク'],
    '海盐蓝': ['Ocean', 'オーシャン'],
    '森林绿': ['Forest', 'フォレスト'],
    '樱花粉': ['Sakura', 'サクラ'],
    '午夜紫': ['Midnight', 'ミッドナイト'],
    '高对比': ['High contrast', '高コントラスト'],
    '薄荷清风': ['Mint', 'ミント'],
    '极光': ['Aurora', 'オーロラ'],
    '落日熔金': ['Sunset', 'サンセット'],
    '赛博霓虹': ['Cyber neon', 'サイバーネオン'],
    '星河漫游': ['Galaxy', 'ギャラクシー'],
    '清爽的薄荷绿': ['Fresh mint green', '爽やかなミントグリーン'],
    '青绿与蓝紫的极光渐变': ['Teal and blue-violet aurora gradient', '青緑と青紫のオーロラ'],
    '温暖的落日橙': ['Warm sunset orange', '暖かな夕焼けオレンジ'],
    '紫粉与青色的霓虹感': ['Purple-pink and cyan neon', '紫ピンクとシアンのネオン'],
    '蓝紫星河': ['Blue-violet galaxy', '青紫の銀河'],
    '更强的文字和边框对比': ['Stronger text and border contrast', 'テキストと枠のコントラストを強化'],
    '深色下的紫色氛围': ['Purple atmosphere in dark mode', 'ダークモードの紫の雰囲気'],
    '柔和的自然绿色': ['Soft natural green', '柔らかな自然の緑'],
    '轻快的暖粉色调': ['Light warm pink', '軽やかな暖かいピンク'],
    '冷静的蓝绿色调': ['Calm blue-green', '落ち着いた青緑'],
    '清爽的默认浅色主题': ['Clean default light theme', 'すっきりした既定のライトテーマ'],
    '自动使用系统的浅色 / 深色': ['Follows the system light / dark mode', 'システムのライト / ダークに従う'],

    /* 积分 / 称号 */
    '当前积分': ['Current points', '現在のポイント'],
    '累计获得': ['Total earned', '累計獲得'],
    '当前称号': ['Current title', '現在の称号'],
    '可用积分': ['Available points', '利用可能ポイント'],
    '我的称号': ['My titles', 'マイ称号'],
    '初来乍到': ['Newcomer', '新入り'],
    '勤学书生': ['Bookworm', '勉強家'],
    '题海行者': ['Question Walker', '問題の旅人'],
    '知识猎手': ['Knowledge Hunter', '知識ハンター'],
    '学霸之光': ['Star Student', '秀才の輝き'],
    '传奇题神': ['Legend', '伝説の達人'],
    '刚刚开始刷题的新朋友': ['Just started practicing', '問題を始めたばかり'],
    '累计获得 100 积分': ['Earn 100 points', '累計100ポイント'],
    '累计获得 250 积分': ['Earn 250 points', '累計250ポイント'],
    '累计获得 500 积分': ['Earn 500 points', '累計500ポイント'],
    '累计获得 900 积分': ['Earn 900 points', '累計900ポイント'],
    '累计获得 1500 积分': ['Earn 1500 points', '累計1500ポイント'],
    '积分主题': ['Point themes', 'ポイントテーマ'],
    '解锁': ['Unlock', '解放'],
    '解锁并应用': ['Unlock & apply', '解放して適用'],
    '积分记录': ['Points history', 'ポイント履歴'],
    '还没有积分记录。答对题目、完成练习和每日签到都会获得积分。': ['No points history yet. Correct answers, completed sessions and daily check-ins earn points.', 'ポイント履歴はありません。正解・練習完了・毎日チェックインで獲得できます。'],
    '每日签到': ['Daily check-in', '毎日チェックイン'],
    '签到 +5': ['Check in +5', 'チェックイン +5'],
    '积分': ['points', 'ポイント'],
    '积分规则：答对一题 +2；完成一轮练习 +5，正确率达到 60% 额外 +3、达到 80% 额外 +5；每日签到 +5。': ['Points: +2 per correct answer; +5 per completed session, +3 bonus at 60% accuracy and +5 at 80%; +5 daily check-in.', 'ポイント：正解1問+2、練習完了+5、正答率60%で+3、80%で+5、毎日チェックイン+5。'],
    '解锁后永久可用，可随时在设置里切换。': ['Permanently unlocked; switch anytime in settings.', '解放後は永続的に利用でき、設定でいつでも切り替えられます。'],
    '我的称号': ['My titles', 'マイ称号'],
    '佩戴中': ['Wearing', '装着中'],
    '还差': ['to go', 'あと'],

    /* AI */
    '查看题目上下文': ['Show question context', '問題の内容を表示'],
    '你想问什么？': ['What do you want to ask?', '何を聞きますか？'],
    '开始提问': ['Ask', '質問する'],
    'AI 回答仅供参考，请结合教材和解析判断。': ['AI answers are for reference; check with your materials and explanation.', 'AI の回答は参考です。教材と解説で確認してください。'],
    'AI 正在思考，通常需要几秒…': ['AI is thinking. This usually takes a few seconds…', 'AI が考えています。数秒かかることがあります…'],
    '回答完成。可以修改问题后再次提问。': ['Done. Edit your question to ask again.', '完了しました。質問を変えて再度聞けます。'],
    'AI 回答': ['AI answer', 'AI の回答'],
    '已复制 AI 回答': ['AI answer copied', 'AI の回答をコピーしました'],
    '还没有配置 AI': ['AI is not configured', 'AI が設定されていません'],
    '还没有配置 AI 服务。填入自己的 API Key 后，就可以在答题时让 AI 讲解题目。': ['No AI service configured. Add your own API key to get explanations while practicing.', 'AI サービスが未設定です。自分の API キーを入力すると、問題の解説を受けられます。'],
    'Key 只保存在当前浏览器，不会上传到本站服务器。推荐使用 DeepSeek，默认接口已经填好。': ['The key stays in this browser and is never uploaded. DeepSeek is recommended and preconfigured.', 'キーはこのブラウザにのみ保存され、アップロードされません。DeepSeek を推奨します。'],
    '支持 DeepSeek、OpenAI 以及兼容 OpenAI Chat Completions 的中转服务。Key 只保存在这台设备的浏览器里，不会上传到本站服务器，也不会随数据备份导出；提问时由浏览器直接发送给你选择的 AI 服务商。': ['Supports DeepSeek, OpenAI and OpenAI-compatible gateways. The key stays in this browser, is never uploaded, and is not included in backups; requests go directly to your provider.', 'DeepSeek、OpenAI、OpenAI 互換サービスに対応。キーはブラウザにのみ保存され、アップロードやバックアップに含まれません。リクエストは選んだサービスへ直接送信されます。'],
    '在答题页点「问 AI」，让模型讲解当前题目': ['Tap “Ask AI” on the quiz page to explain the current question', '回答画面で「AI に聞く」を押すと、現在の問題を解説します'],
    '提示：如果服务商不允许浏览器直连，请求会失败。可以改用支持浏览器跨域访问的接口，或填写你自己的中转地址。AI 回答仅供参考，请结合教材和题目解析判断。': ['Tip: if the provider blocks browser requests, use an endpoint that allows CORS or your own gateway. AI answers are for reference only.', 'ヒント：ブラウザ直通が許可されていない場合、CORS 対応のエンドポイントや中継サーバーを使用してください。AI の回答は参考です。'],

    /* 上传 / 帮助 */
    '文件：': ['File: ', 'ファイル：'],
    '题': ['questions', '問'],
    '道题': ['questions', '問'],
    '单选': ['Single', '単一'],
    '多选': ['Multiple', '複数'],
    '判断': ['True/False', '正誤'],
    '导入后保存在当前浏览器，不会上传服务器。': ['Saved in this browser; never uploaded.', 'このブラウザに保存され、アップロードされません。'],
    '如果识别结果不对，可以点「查看格式说明」按示例整理后再试。': ['If recognition is wrong, check the format guide and try again.', '認識結果が違う場合は、形式ガイドを確認して再試行してください。'],
    '正在读取「': ['Reading “', '読み込み中「'],
    'Word / Excel / PDF 需要在本机解析，文件较大时可能要等几秒。': ['Word/Excel/PDF are parsed locally; large files may take a few seconds.', 'Word/Excel/PDF は端末内で解析します。大きいファイルは数秒かかる場合があります。'],
    '支持的格式：JSON、TXT、Markdown、CSV、Word(.docx)、Excel(.xlsx)、PDF。': ['Supported formats: JSON, TXT, Markdown, CSV, Word (.docx), Excel (.xlsx), PDF.', '対応形式：JSON、TXT、Markdown、CSV、Word (.docx)、Excel (.xlsx)、PDF。'],
    '旧版 .doc / .xls 请先另存为 .docx / .xlsx。': ['For old .doc / .xls, save as .docx / .xlsx first.', '旧形式の .doc / .xls は .docx / .xlsx に保存してください。'],
    '查看题目上下文': ['Show question context', '問題の内容を表示'],
    '题目': ['Question', '問題'],
    '下载 TXT 模板': ['Download TXT template', 'TXT テンプレートをダウンロード'],
    '下载示例题库': ['Download sample', 'サンプルをダウンロード'],
    '关闭': ['Close', '閉じる'],

    /* 其他 */
    '跳到主要内容': ['Skip to content', '本文へスキップ'],
    '还没有题库。点击上面的「选择文件」上传，或先': ['No banks yet. Click “Choose file” above, or first', '問題集がありません。上の「ファイルを選択」から追加するか、まず'],
    '还没有题库': ['No banks yet', '問題集がありません'],
    '题库不存在': ['Bank not found', '問題集が見つかりません'],
    '可能链接过期了': ['The link may have expired', 'リンクが期限切れの可能性があります'],
    '这个页面还没有接上': ['This page is not connected yet', 'このページはまだ接続されていません'],
    '页面出错了': ['Something went wrong', 'エラーが発生しました'],
    '成绩记录不存在': ['Score record not found', '成績記録が見つかりません'],
    '可能记录已经被清除，或这个链接已经过期。': ['The record may have been cleared or the link has expired.', '記録が消去されたか、リンクが期限切れの可能性があります。'],
    '这一轮练习已经不在了': ['This practice session is gone', 'この練習セッションは終了しました'],
    '可能是刷新后会话已结束，重新选一个方式开始吧': ['The session may have ended after refresh. Start a new one.', '更新後にセッションが終了した可能性があります。新しく開始してください。'],
    '题目丢失': ['Question missing', '問題が見つかりません'],
    '还没有题库 · 上传你的第一份题库，就能开始练习': ['No banks yet · Upload your first bank to start practicing', '問題集がありません · 最初の問題集をアップロードして始めましょう'],
    '回到首页': ['Back to home', 'ホームに戻る'],

    /* 补充：首页快捷入口 / 功能搜索 / 设置段落 */
    '学习': ['Study', '学習'],
    '工具': ['Tools', 'ツール'],
    '设置': ['Settings', '設定'],
    '记录': ['History', '記録'],
    '外观': ['Appearance', '外観'],
    '健康': ['Health', '健康'],
    '考试': ['Exam', '試験'],
    '继续上次练习': ['Continue last practice', '前回の練習を続ける'],
    '回到上次停下的题号，保留进度': ['Return to where you stopped and keep progress', '前回止めた問題に戻り、進捗を保持'],
    '按轮次重练错题，查看错题详情': ['Practice mistakes by round and view details', '間違いを回ごとに練習し、詳細を表示'],
    '查看收藏题目，按钮显示答案和解析': ['View saved questions and reveal answers/explanations', '保存した問題を表示し、答えと解説を確認'],
    '导入 JSON、TXT、Markdown、Word、Excel 或 PDF': ['Import JSON, TXT, Markdown, Word, Excel or PDF', 'JSON、TXT、Markdown、Word、Excel、PDF を読み込む'],
    '缩放、透明度、颜色、字体、间距和顺序': ['Scale, opacity, colors, fonts, spacing and order', '拡大率・透明度・色・フォント・間隔・順序'],
    '静心音、细雨、森林、夜航等环境音': ['Calm, rain, forest, night and other ambience', '静かな音・雨・森・夜などの環境音'],
    '关闭动画和渐变，适合车上或晃动场景': ['Disable animation and gradients for moving environments', 'アニメーションとグラデーションを無効化'],
    '天黑时主动询问是否切换深色': ['Ask to switch to dark mode after dark', '暗くなったらダークモードを提案'],
    '连续 2 小时提醒休息，考试模式除外': ['Remind a break after 2 hours; not in exam mode', '2時間後に休憩を通知（試験モードを除く）'],
    '每个账户保存自己的进度、错题和成绩': ['Each account keeps its own progress, mistakes and scores', 'アカウントごとに進捗・間違い・成績を保存'],
    '下载 JSON、系统分享或复制备份内容': ['Download JSON, share or copy the backup', 'JSON のダウンロード・共有・コピー'],
    '按时间、轮次、单条清理错题/收藏/成绩等': ['Clean mistakes, saved questions and scores by time or round', '時間・回・個別に間違い/保存/成績を整理'],
    '主题、界面、音乐、账户、语言、导出和清理': ['Themes, interface, music, account, language, export and cleanup', 'テーマ・画面・音楽・アカウント・言語・書き出し・整理'],

    /* 补充：设置页长段落 */
    '主题、界面、积分、AI 答疑、音乐、账户、语言、导出和本地数据清理。所有操作都只影响这台设备。': ['Themes, interface, points, AI help, music, account, language, export and local cleanup. All changes affect only this device.', 'テーマ・画面・ポイント・AI 解説・音楽・アカウント・言語・書き出し・ローカル整理。すべてこの端末にのみ反映されます。'],
    '答对题目、完成练习和每日签到都会获得积分。积分可以兑换称号和酷炫主题，点击「查看」打开个人积分中心。': ['Earn points by answering correctly, completing sessions and checking in daily. Spend points on titles and cool themes. Click “View” to open the points center.', '正解・練習完了・毎日チェックインでポイントを獲得。称号やテーマに使えます。「表示」でポイントセンターを開きます。'],
    '还没有上传题库。': ['No banks uploaded yet.', 'まだ問題集がありません。'],
    '题库只保存在这台设备的浏览器里。': ['Banks are stored only in this browser on this device.', '問題集はこの端末のブラウザにのみ保存されます。'],
    '支持 JSON、TXT、Markdown、CSV、Word(.docx)、Excel(.xlsx)、PDF；题库只保存在这台设备的浏览器里。': ['Supports JSON, TXT, Markdown, CSV, Word (.docx), Excel (.xlsx), PDF. Banks stay in this browser only.', 'JSON、TXT、Markdown、CSV、Word (.docx)、Excel (.xlsx)、PDF に対応。問題集はこのブラウザにのみ保存されます。'],
    '夜间刷题不刺眼': ['Easy on the eyes at night', '夜でも目に優しい'],
    '清爽的薄荷绿（积分解锁）': ['Fresh mint green (point unlock)', '爽やかなミントグリーン（ポイント解放）'],
    '青绿与蓝紫的极光渐变（积分解锁）': ['Teal and blue-violet aurora (point unlock)', '青緑と青紫のオーロラ（ポイント解放）'],
    '温暖的落日橙（积分解锁）': ['Warm sunset orange (point unlock)', '暖かな夕焼けオレンジ（ポイント解放）'],
    '紫粉与青色的霓虹感（积分解锁）': ['Purple-pink and cyan neon (point unlock)', '紫ピンクとシアンのネオン（ポイント解放）'],
    '蓝紫星河（积分解锁）': ['Blue-violet galaxy (point unlock)', '青紫の銀河（ポイント解放）'],
    '深色下的紫色氛围': ['Purple atmosphere in dark mode', 'ダークモードの紫の雰囲気'],

    /* 补充：AI / 上传 / 错误提示 */
    '支持 DeepSeek、OpenAI 以及兼容 OpenAI Chat Completions 的中转服务。Key 只保存在这台设备的浏览器里，不会上传到本站服务器，也不会随数据备份导出；提问时由浏览器直接发送给你选择的 AI 服务商。': ['Supports DeepSeek, OpenAI and OpenAI-compatible gateways. The key stays in this browser, is never uploaded, and is not included in backups; requests go directly to your provider.', 'DeepSeek、OpenAI、OpenAI 互換サービスに対応。キーはブラウザにのみ保存され、アップロードやバックアップに含まれません。リクエストは選んだサービスへ直接送信されます。'],
    '还没有配置 AI 服务。填入自己的 API Key 后，就可以在答题时让 AI 讲解题目。': ['No AI service configured. Add your own API key to get explanations while practicing.', 'AI サービスが未設定です。自分の API キーを入力すると、問題の解説を受けられます。'],
    'Key 只保存在当前浏览器，不会上传到本站服务器。推荐使用 DeepSeek，默认接口已经填好。': ['The key stays in this browser and is never uploaded. DeepSeek is recommended and preconfigured.', 'キーはこのブラウザにのみ保存され、アップロードされません。DeepSeek を推奨します。'],
    '把收藏题变成一轮练习': ['Turn saved questions into a practice round', '保存した問題を練習に'],
    '跨题库也可以一起练；提交后立即判题并显示解析。': ['Mix questions from different banks; instant grading and explanations.', '問題集をまたいで練習できます。送信後にすぐ採点と解説を表示します。'],
    '还没有题库。点击上面的「选择文件」上传，或先': ['No banks yet. Click “Choose file” above, or first', '問題集がありません。上の「ファイルを選択」から追加するか、まず'],
    '看看格式。': ['to see the format.', '形式を確認してください。'],
    '支持的格式：JSON、TXT、Markdown、CSV、Word(.docx)、Excel(.xlsx)、PDF。': ['Supported formats: JSON, TXT, Markdown, CSV, Word (.docx), Excel (.xlsx), PDF.', '対応形式：JSON、TXT、Markdown、CSV、Word (.docx)、Excel (.xlsx)、PDF。'],
    '旧版 .doc / .xls 请先另存为 .docx / .xlsx。': ['For old .doc / .xls, save as .docx / .xlsx first.', '旧形式の .doc / .xls は .docx / .xlsx に保存してください。'],
    '正在读取「': ['Reading “', '読み込み中「'],
    'Word / Excel / PDF 需要在本机解析，文件较大时可能要等几秒。': ['Word/Excel/PDF are parsed locally; large files may take a few seconds.', 'Word/Excel/PDF は端末内で解析します。大きいファイルは数秒かかる場合があります。'],
    '导入后保存在当前浏览器，不会上传服务器。': ['Saved in this browser; never uploaded.', 'このブラウザに保存され、アップロードされません。'],
    '如果识别结果不对，可以点「查看格式说明」按示例整理后再试。': ['If recognition is wrong, check the format guide and try again.', '認識結果が違う場合は、形式ガイドを確認して再試行してください。'],
    '配置已保存，但接口地址、模型或 API Key 还不完整': ['Saved, but endpoint, model or API key is incomplete', '保存しましたが、エンドポイント・モデル・API キーが不完全です'],
    '调整界面大小、透明度、颜色、字体、按钮间距和快捷入口顺序；设置会立即生效。': ['Adjust size, opacity, colors, fonts, button spacing and shortcut order; changes apply immediately.', '画面サイズ・透明度・色・フォント・ボタン間隔・ショートカット順を調整します。変更はすぐに反映されます。'],
    '内置音轨由浏览器实时合成，不需要下载音频；也可以上传自己的音频文件（小文件会保存在本机）。': ['Built-in tracks are synthesized by the browser; no download needed. You can also upload your own audio file (stored locally).', '内蔵音源はブラウザがリアルタイムで合成します。自分の音声ファイルもアップロードできます（ローカル保存）。'],
    '关闭动画、渐变和阴影，适合车上、船上或容易眩晕时使用': ['Disable animation, gradients and shadows for moving environments.', 'アニメーション・グラデーション・影を無効化します。'],
    '进入傍晚后主动询问是否切换深色': ['Ask whether to switch to dark mode in the evening.', '夕方にダークモードへ切り替えるか確認します。'],
    '考试模式不会触发': ['Not triggered in exam mode.', '試験モードでは表示されません。'],
    '专注一段时间后自动进入休息；可在任意页面显示倒计时。': ['Automatically take a break after focus time; the countdown is visible on any page.', '集中後に自動で休憩します。カウントダウンはどの画面でも表示されます。'],
    '按真实场景完成几个任务，并留下你的建议。': ['Complete a few real-world tasks and leave your feedback.', '実際の操作をいくつか試して、感想を残してください。'],
    '提示：浏览器通常要求先点击播放，不能自动播放；考试时建议关闭音乐。': ['Tip: browsers require a click before playing; turn music off during exams.', 'ヒント：再生にはクリックが必要です。試験中は音楽をオフにしてください。'],
    '清爽的默认浅色主题': ['Clean default light theme', 'すっきりした既定のライトテーマ'],
    '自动使用系统的浅色 / 深色': ['Follows the system light / dark mode', 'システムのライト / ダークに従う'],
    '夜间刷题不刺眼': ['Easy on the eyes at night', '夜でも目に優しい'],
    '清爽的薄荷绿（积分解锁）': ['Fresh mint green (point unlock)', '爽やかなミントグリーン（ポイント解放）'],
    '青绿与蓝紫的极光渐变（积分解锁）': ['Teal and blue-violet aurora (point unlock)', '青緑と青紫のオーロラ（ポイント解放）'],
    '温暖的落日橙（积分解锁）': ['Warm sunset orange (point unlock)', '暖かな夕焼けオレンジ（ポイント解放）'],
    '紫粉与青色的霓虹感（积分解锁）': ['Purple-pink and cyan neon (point unlock)', '紫ピンクとシアンのネオン（ポイント解放）'],
    '蓝紫星河（积分解锁）': ['Blue-violet galaxy (point unlock)', '青紫の銀河（ポイント解放）'],
    '深色下的紫色氛围': ['Purple atmosphere in dark mode', 'ダークモードの紫の雰囲気'],
    '清爽的薄荷绿': ['Fresh mint green', '爽やかなミントグリーン'],
    '青绿与蓝紫的极光渐变': ['Teal and blue-violet aurora gradient', '青緑と青紫のオーロラ'],
    '温暖的落日橙': ['Warm sunset orange', '暖かな夕焼けオレンジ'],
    '紫粉与青色的霓虹感': ['Purple-pink and cyan neon', '紫ピンクとシアンのネオン'],
    '蓝紫星河': ['Blue-violet galaxy', '青紫の銀河'],
    '学习加油站': ['Study boost', '学習ブースト'],
    '轻松一下': ['Take a break', 'ひと休み'],

    /* 补充：空状态 / 页面说明 / 声音 */
    '晚上好，今天也来刷几道？': ['Good evening. Ready for a few questions today?', 'こんばんは。今日も問題を解きますか？'],
    '早上好，今天也来刷几道？': ['Good morning. Ready for a few questions today?', 'おはようございます。今日も問題を解きますか？'],
    '中午好，今天也来刷几道？': ['Good afternoon. Ready for a few questions today?', 'こんにちは。今日も問題を解きますか？'],
    '下午好，今天也来刷几道？': ['Good afternoon. Ready for a few questions today?', 'こんにちは。今日も問題を解きますか？'],
    '还没睡？，今天也来刷几道？': ['Still awake? Ready for a few questions?', 'まだ起きていますか？今日も問題を解きますか？'],
    '填入自己的 API Key': ['Add your own API key', '自分の API キーを入力'],
    '上移': ['Move up', '上へ'],
    '下移': ['Move down', '下へ'],
    '静心音': ['Calm', '静かな音'],
    '细雨': ['Light rain', '小雨'],
    '森林气息': ['Forest', '森の香り'],
    '夜航': ['Night flight', '夜の航海'],
    '海浪': ['Waves', '波'],
    '壁炉': ['Fireplace', '暖炉'],
    '呼吸': ['Breathing', '呼吸'],
    '午后微光': ['Afternoon glow', '午後の光'],
    '播放': ['Play', '再生'],
    '暂停': ['Pause', '一時停止'],
    '上传音频': ['Upload audio', '音声をアップロード'],
    '停止': ['Stop', '停止'],
    '音量': ['Volume', '音量'],
    '中文': ['Chinese', '中国語'],
    '已关闭': ['Off', 'オフ'],
    '已开启': ['On', 'オン'],
    '答题时点右上角的「收藏」，或者在题目回顾里加入收藏，题目就会出现在这里。': ['Tap “Save” at the top right while answering, or save from the review page, and questions will appear here.', '回答画面右上の「保存」または復習画面から保存すると、ここに表示されます。'],
    '把错题重新练会，比一味刷新题更有用。': ['Mastering mistakes is more useful than rushing through new questions.', '間違いを解き直す方が、新しい問題を流すより効果的です。'],
    '错题本还是空的': ['Your mistake book is empty', '間違いノートは空です'],
    '全对！错题本已经清空': ['All correct! Your mistake book is clear', '全問正解！間違いノートは空です'],
    '最近没有新的错题。继续保持，或者去刷一轮新题。': ['No new mistakes lately. Keep it up, or start a new round.', '最近の間違いはありません。この調子で、または新しい練習を始めましょう。'],
    '答题时做错的题会自动收集到这里，答对后会自动移出。': ['Wrong answers are collected here automatically and removed when you answer correctly.', '間違えた問題は自動でここに追加され、正解すると外れます。'],
    '每一轮都算数：看曲线、找薄弱点，再决定下一轮练什么。': ['Every round counts: check the trend, find weak spots and plan the next round.', '毎回の練習が力になります。推移を見て苦手を見つけ、次を決めましょう。'],
    '还没有成绩记录': ['No score history yet', '成績記録はまだありません'],
    '完成一轮练习并交卷后，这里会记录题量、正确率、用时和趋势。': ['After finishing a round, questions, accuracy, time and trend will be recorded here.', '練習を終えて提出すると、問題数・正答率・所要時間・推移が記録されます。'],
    '支持题目、选项、解析和章节关键词；输入不完整或有个别错字也能给出候选。': ['Search stems, options, explanations and chapters; partial input or small typos still work.', '問題・選択肢・解説・章を検索できます。入力が不完全でも候補を表示します。'],
    '输入题目关键词，例如「集合」「网页布局」': ['Enter keywords, e.g. “collections”, “page layout”', 'キーワードを入力（例：「集合」「ページレイアウト」）'],
    '搜索题目': ['Search questions', '問題を検索'],
    '搜索': ['Search', '検索'],
    '无痕搜索（不记录本次搜索历史）': ['Incognito search (do not save this search)', 'シークレット検索（履歴を保存しない）'],
    '按回车搜索，点击候选题目可直接预览。': ['Press Enter to search; click a suggestion to preview.', 'Enter で検索。候補をクリックするとプレビューできます。'],
    '最近搜索': ['Recent searches', '最近の検索'],
    '清空历史': ['Clear history', '履歴を消去'],
    '清空搜索历史？': ['Clear search history?', '検索履歴を消去しますか？'],
    '只会删除关键词记录，不会影响题库、错题和成绩。': ['Only keyword records are removed; banks, mistakes and scores are untouched.', 'キーワード履歴のみ削除されます。問題集・間違い・成績には影響しません。'],
    '搜索历史已清空': ['Search history cleared', '検索履歴を消去しました'],
    '还没有搜索记录。输入关键词开始找题。': ['No search history yet. Enter a keyword to start.', '検索履歴はありません。キーワードを入力して始めましょう。'],
    '可能的题目（点击预览）': ['Possible questions (click to preview)', '候補の問題（クリックでプレビュー）'],
    '搜索结果': ['Search results', '検索結果'],
    '没有找到相关题目': ['No matching questions', '該当する問題はありません'],
    '已按相关度排序': ['Sorted by relevance', '関連度順'],
    '换一个关键词试试；也可以只输入题干里的几个字，或输入章节名称。': ['Try another keyword, a few characters from the stem, or a chapter name.', '別のキーワード、問題文の一部、章名で試してください。'],
    '原题没有可用选项。': ['The original question has no usable options.', '元の問題に使用可能な選択肢がありません。'],
    '当前没有影响作答或判分的异常题目。信息提示项可以按需处理。': ['No questions with grading issues right now. Notes can be handled as needed.', '現在、採点に影響する問題はありません。ヒントは必要に応じて処理できます。'],
    '提示：页面加载、切换筛选都不会自动标记；只有点击按钮才会写入异常标记。': ['Note: loading or changing filters never marks anything; only button clicks write a mark.', 'ヒント：読み込みや絞り込みではマークされません。ボタンを押したときだけ記録されます。'],
    '待处理项已经清空': ['Open issues cleared', '未処理項目はありません'],
    '没有需要标记的问题。你仍然可以在下方查看已标记记录。': ['Nothing needs marking. You can still view marked records below.', 'マークが必要な問題はありません。下でマーク済み記録を確認できます。'],
    '按真实使用场景走一遍；完成的操作会自动打勾。': ['Walk through real scenarios; completed actions are checked automatically.', '実際の操作を一通り試すと、完了した項目に自動でチェックが付きます。'],
    '打开错题本并开始一轮错题重练': ['Open the mistake book and start a mistake round', '間違いノートを開いて練習を始める'],
    '检查错题分组、重练和原成绩保留。': ['Check mistake groups, retry and score retention.', '間違いの分類・再練習・成績保持を確認'],
    '上传一份其它用户成绩并完成对比': ['Upload another user’s scores and compare', '他のユーザーの成績を読み込んで比較'],
    '检查成绩记录里的本地上传对比。': ['Check the local score comparison in history.', '成績記録のローカル比較を確認'],
    '导出自己的数据备份': ['Export your data backup', 'データをバックアップ'],
    '下载或复制备份文件。': ['Download or copy the backup file.', 'バックアップをダウンロードまたはコピー'],
    '搜索一道题目并打开预览': ['Search for a question and open the preview', '問題を検索してプレビューを開く'],
    '试试不完整输入或错字。': ['Try partial input or a typo.', '不完全な入力や誤字を試す'],
    '切换一次主题': ['Switch the theme once', 'テーマを一度切り替える'],
    '浅色、深色或自定义颜色都可以。': ['Light, dark or a custom color.', 'ライト・ダーク・カスタム色のいずれでも。'],
    '清空某个时间点的数据': ['Clear data from a specific time', '特定の期間のデータを消去'],
    '在设置的数据清理里选一条删除。': ['Delete one item in Settings → Data cleanup.', '設定のデータ整理で1件削除します。'],
    '完成一次考试模式': ['Complete one exam mode', '試験モードを1回完了'],
    '从章节、错题或收藏里组卷，交卷后自动打勾。': ['Build an exam from chapters, mistakes or saved questions; it checks after submission.', '章・間違い・保存から試験を作成し、提出後にチェックされます。'],
    '写下卡顿、看不懂、找不到入口的地方。反馈保存在本地，并会随数据备份一起导出。': ['Write down anything slow, confusing or hard to find. Feedback stays local and is included in backups.', '動作が重い・分かりにくい・見つけにくい点を書いてください。フィードバックはローカル保存され、バックアップに含まれます。'],
    '例如：手机上看不清按钮、导出后不知道发到哪里、某道题评论加载慢……': ['e.g. buttons are hard to see on mobile, unclear where exports go, comments load slowly…', '例：スマホでボタンが見えにくい、書き出し先が分からない、コメントが遅い…'],
    '整体评分': ['Overall rating', '総合評価'],
    '具体建议': ['Details', '具体的な提案'],
    '体验建议': ['Feedback', 'フィードバック'],
    '已完成任务': ['Completed', '完了タスク'],
    '反馈条数': ['Feedback', 'フィードバック'],
    '去完成': ['Go', '完了する'],
    '再看一次': ['View again', 'もう一度見る'],

    /* 补充：设置页数据清理 / 导出 */
    '这个范围内没有错题。': ['No mistakes in this range.', 'この範囲に間違いはありません。'],
    '这个范围内没有收藏。': ['No saved questions in this range.', 'この範囲に保存した問題はありません。'],
    '这个范围内没有成绩记录。': ['No score records in this range.', 'この範囲に成績記録はありません。'],
    '这个范围内没有搜题记录。': ['No search records in this range.', 'この範囲に検索履歴はありません。'],
    '这个范围内没有异常标记。': ['No issue marks in this range.', 'この範囲にマークはありません。'],
    '删除选中的错题？': ['Delete selected mistakes?', '選択した間違いを削除しますか？'],
    '删除选中的收藏？': ['Delete selected saved questions?', '選択した保存問題を削除しますか？'],
    '删除选中的成绩？': ['Delete selected score records?', '選択した成績記録を削除しますか？'],
    '只会从错题本移除，不会删除题库和成绩记录。': ['Only removes them from the mistake book; banks and scores are untouched.', '間違いノートからのみ削除されます。問題集と成績は残ります。'],
    '只会取消收藏，不会删除题库和成绩记录。': ['Only removes the saved mark; banks and scores are untouched.', '保存のみ解除されます。問題集と成績は残ります。'],
    '整轮删除会移除该轮所有题目记录；单题删除会按剩余题目重新计算该轮正确率。': ['Deleting a round removes all its questions; deleting one question recalculates the round accuracy.', '回ごと削除するとその回の全問題が消えます。1問削除すると残りで正答率を再計算します。'],
    '全选': ['Select all', 'すべて選択'],
    '开启': ['On', 'オン'],
    '专注': ['Focus', '集中'],
    '休息': ['Break', '休憩'],
    '自定义 / 中转': ['Custom / gateway', 'カスタム / 中継'],
    'DeepSeek 的 Key 可在 platform.deepseek.com 创建': ['Create a DeepSeek key at platform.deepseek.com', 'DeepSeek のキーは platform.deepseek.com で作成'],
    '分享到微信 / QQ / 网盘': ['Share to WeChat / QQ / cloud drive', 'WeChat / QQ / クラウドに共有'],
    '复制备份内容': ['Copy backup contents', 'バックアップをコピー'],
    '下载后可发送到微信、QQ、邮箱或任意网盘；如果浏览器支持系统分享，点击“分享到…”会直接打开系统分享面板，选择已安装的应用。': ['After downloading, send it via WeChat, QQ, email or any cloud drive. If the browser supports system sharing, “Share to…” opens the system share sheet.', 'ダウンロード後、WeChat・QQ・メール・クラウドなどに送れます。システム共有に対応していれば「共有…」で共有画面が開きます。'],
    '搜题记录': ['Search history', '検索履歴'],
    '只删除关键词记录，不会影响题库、错题和成绩。': ['Only keyword records are removed; banks, mistakes and scores are untouched.', 'キーワード履歴のみ削除されます。問題集・間違い・成績には影響しません。'],
    '可单独选择或按轮次筛选': ['select individually or filter by round', '個別選択または回で絞り込み'],
    '可整轮删除，也可展开删除某一轮的某道题': ['delete a whole round or individual questions', '回ごとまたは問題ごとに削除'],
    '可在搜题页开启无痕模式': ['enable incognito search on the search page', '検索画面でシークレット検索を有効にできます'],
    '删除后会恢复对应题目': ['deleting restores the questions', '削除すると問題が復元されます'],
    'DeepSeek 的 Key 可在 platform.deepseek.com 创建 ·': ['Create a DeepSeek key at platform.deepseek.com ·', 'DeepSeek のキーは platform.deepseek.com で作成 ·'],
    '创建 DeepSeek Key': ['Create DeepSeek key', 'DeepSeek キーを作成'],
    'OpenAI 可能不允许浏览器直连，必要时请使用中转地址': ['OpenAI may block direct browser requests; use a gateway if needed.', 'OpenAI はブラウザ直通を許可しない場合があります。必要なら中継を使用してください。'],
    '填写完整的 chat/completions 地址，或只填到 /v1': ['Enter the full chat/completions URL, or just up to /v1', '完全な chat/completions URL か /v1 までを入力'],
    '用户名': ['Username', 'ユーザー名'],
    '密码': ['Password', 'パスワード'],
    '登录本地账户': ['Log in to local account', 'ローカルアカウントにログイン'],
    '注册本地账户': ['Create local account', 'ローカルアカウントを作成'],
    '注册并登录': ['Register and log in', '登録してログイン'],
    '账户和密码只保存在本机，不会上传服务器；换设备不会同步。': ['Account and password stay on this device and are not uploaded.', 'アカウントとパスワードはこの端末にのみ保存され、アップロードされません。'],
    '切换到深色模式': ['Switch to dark mode', 'ダークモードに切り替え'],
    '切换到浅色模式': ['Switch to light mode', 'ライトモードに切り替え'],
    '账户': ['Account', 'アカウント'],
    '给这个题库起个名字': ['Name this bank', '問題集の名前'],
    '已保存，留空表示不修改': ['Saved; leave blank to keep it', '保存済み。空欄なら変更しません'],
    '粘贴你的 API Key': ['Paste your API key', 'API キーを貼り付け'],
    '例如 deepseek-chat': ['e.g. deepseek-chat', '例：deepseek-chat'],
    '例如 https://api.deepseek.com/chat/completions': ['e.g. https://api.deepseek.com/chat/completions', '例：https://api.deepseek.com/chat/completions'],
    '回顾': ['Review', '復習'],
    '移出': ['Remove', '外す'],
    '错题回顾': ['Mistake review', '間違いの復習'],
    '已移出错题本': ['Removed from the mistake book', '間違いノートから外しました'],
    '上一轮全对！': ['All correct last round!', '前回は全問正解！'],
    '保持这个手感。': ['Keep that feeling.', 'その調子を保ちましょう。'],
    '待攻克': ['To review', '復習待ち'],
    '按轮次重练': ['Practice by round', '回ごとに練習'],
    '重练本轮': ['Retry this round', 'この回をやり直す'],
    '全部错题': ['All mistakes', 'すべての間違い'],
    '重练全部错题': ['Practice all mistakes', 'すべての間違いを練習'],
    '新开的练习会使用同一套答题 / 判题界面，原轮成绩和进度不会被清空。': ['New practice uses the same quiz and grading UI; the original round and progress are kept.', '新しい練習は同じ回答・採点画面を使い、元の回と進捗は保持されます。'],
    '最近一轮题量': ['Last round questions', '前回の出題数'],
    '正确率曲线': ['Accuracy trend', '正答率の推移'],
    '每轮记录': ['Rounds', '各回の記録'],
    '再完成一轮练习，就能看到正确率曲线的变化。': ['Finish another round to see the accuracy trend.', 'もう1回練習すると正答率の推移が表示されます。'],
    '学习建议': ['Study suggestions', '学習アドバイス'],
    '继续积累样本': ['Keep collecting samples', 'サンプルを増やしましょう'],
    '目前正确率比较平稳。多做几轮、把错题重练一遍，曲线会更有参考价值。': ['Accuracy is steady. Do a few more rounds and retry mistakes to make the trend more useful.', '正答率は安定しています。数回練習し、間違いを解き直すと推移が参考になります。'],
    '建议优先加强：': ['Focus on: ', '優先して強化：'],
    '错题是最好的入口': ['Mistakes are the best entry point', '間違いから始めるのが一番'],
    '上传另一个用户导出的 JSON 备份，在本机做成绩对比。文件不会上传到服务器。': ['Upload another user’s JSON backup to compare scores locally. The file is never uploaded.', '他のユーザーの JSON バックアップを読み込み、端末内で成績を比較します。ファイルはアップロードされません。'],
    '清空对比': ['Clear comparison', '比較をクリア'],
    '还没有导入其他用户。成绩记录会从上传文件的 history 字段读取。': ['No other user imported yet. Score records are read from the history field of the uploaded file.', '他のユーザーはまだ読み込まれていません。成績はアップロードファイルの history から読み取ります。'],
    '题量': ['Questions', '問題数'],
    '题量 / 已答': ['Questions / answered', '問題数 / 回答済み'],
    '总题量': ['Total questions', '総問題数'],
    '最近一轮': ['Last round', '前回'],
    '对比只读取各文件的轮次、题量和正确率，不读取或修改对方的题库答案。': ['The comparison only reads rounds, question counts and accuracy; it never reads or changes the other bank’s answers.', '比較は回・問題数・正答率のみを読み取り、相手の問題集の答えは読み取りも変更もしません。'],
    '最近一轮很稳': ['Last round was solid', '前回は安定'],
    '正在进步': ['Improving', '上達中'],
    '最近一轮有回落': ['Last round dipped', '前回は低下'],
    '其它需要留意的知识点': ['Other topics to watch', '他に注意する知識ポイント'],
    '暂时没有明显薄弱章节': ['No obvious weak chapters', '目立った苦手分野はありません'],
    '分享到微信 / QQ / 网盘…': ['Share to WeChat / QQ / cloud drive…', 'WeChat / QQ / クラウドに共有…'],
    '分享到微信 / QQ / 网盘等': ['Share to WeChat / QQ / cloud drive, etc.', 'WeChat / QQ / クラウドなどに共有'],
    '分享到微信 / QQ / 网盘': ['Share to WeChat / QQ / cloud drive', 'WeChat / QQ / クラウドに共有'],
    '个人积分中心': ['Points center', 'ポイントセンター'],
    '解锁后永久可用，可随时在设置里切换。': ['Permanently unlocked; switch anytime in settings.', '解放後は永続的に利用でき、設定でいつでも切り替えられます。'],
    'API Key 无效或没有权限，请检查设置': ['Invalid API key or no permission. Check your settings.', 'API キーが無効か権限がありません。設定を確認してください。'],
    '接口地址不存在，请检查 API 地址': ['Endpoint not found. Check the API address.', 'エンドポイントが見つかりません。API アドレスを確認してください。'],
    '请求太频繁或额度不足，请稍后再试': ['Too many requests or insufficient quota. Try again later.', 'リクエスト過多または残量不足です。後で再試行してください。'],
    'AI 服务暂时不可用，请稍后再试': ['AI service is temporarily unavailable. Try again later.', 'AI サービスは一時的に利用できません。後で再試行してください。'],
    '请求超时，请稍后再试': ['Request timed out. Try again later.', 'リクエストがタイムアウトしました。後で再試行してください。'],
    '网络请求失败：可能是网络问题，或服务商不允许浏览器直连': ['Network request failed: check your connection or whether the provider allows browser requests.', 'ネットワークエラー：接続またはブラウザ直通の可否を確認してください。'],
    'AI 返回格式异常，请检查模型和接口地址': ['Unexpected AI response. Check the model and endpoint.', 'AI の応答形式が不正です。モデルとエンドポイントを確認してください。'],
    'AI 没有返回内容': ['AI returned no content', 'AI から内容が返されませんでした。'],
    '请先填写 API 地址': ['Please enter the API endpoint', 'API エンドポイントを入力してください'],
    '请先填写 API Key': ['Please enter the API key', 'API キーを入力してください'],
    '请先填写模型名称': ['Please enter the model name', 'モデル名を入力してください'],
    '已加入重点收藏': ['Added to saved questions', '保存した問題に追加しました'],
    '已取消收藏': ['Removed from saved questions', '保存を解除しました'],
    '已重置本题，得分会重新计算': ['Question reset; the score will be recalculated.', '問題をリセットしました。得点は再計算されます。'],
    '先选一个答案再提交': ['Choose an answer first.', '先に答えを選んでください。'],
    '这道题已经提交过了，成绩不会重复计算': ['This question was already submitted; the score will not change.', 'この問題は提出済みです。得点は変わりません。'],
    '答错了，看看解析': ['Incorrect — check the explanation.', '不正解です。解説を確認しましょう。'],
    '时间到，自动交卷': ['Time is up. Submitting automatically.', '時間です。自動で提出します。'],
    '已经是最后一题了': ['This is the last question.', '最後の問題です。'],
    '已经是第一题了': ['This is the first question.', '最初の問題です。'],
    '先写点内容再发表': ['Write something first.', '内容を入力してください。'],
    '评论已保存': ['Comment saved', 'コメントを保存しました'],
    '已切换到深色模式': ['Switched to dark mode', 'ダークモードに切り替えました'],
    '已切换到浅色模式': ['Switched to light mode', 'ライトモードに切り替えました'],
    '已关闭日落后提醒': ['Sunset reminder turned off', '日没通知をオフにしました'],
    '已开启日落后提醒': ['Sunset reminder turned on', '日没通知をオンにしました'],
    '已关闭休息提醒': ['Break reminder turned off', '休憩通知をオフにしました'],
    '已开启休息提醒': ['Break reminder turned on', '休憩通知をオンにしました'],
    '没有可以继续的练习': ['No practice to resume', '続けられる練習がありません'],
    '这道题数据异常，不计入成绩': ['This question has a data issue and is not scored.', 'この問題はデータ異常のため採点されません。'],
    '已删除题库': ['Bank deleted', '問題集を削除しました'],
    '已清除背景图': ['Background cleared', '背景をクリアしました'],
    '背景图已应用': ['Background applied', '背景を適用しました'],
    '已清除 API Key': ['API key cleared', 'API キーを削除しました'],
    '还没有题库，上传第一份题库就能开始练习': ['No banks yet. Upload your first bank to start.', '問題集がありません。最初の問題集をアップロードしてください。'],
    '切换后界面文字立即更新；题目原文、选项、解析、评论等内容保持原语言。': ['The interface updates immediately; question text, options, explanations and comments keep their original language.', '切り替えると画面がすぐに更新されます。問題文・選択肢・解説・コメントは元の言語のままです。'],
    '界面语言 / Language': ['Interface language / Language', '表示言語 / Language'],
    '阅读与计时': ['Reading & timer', '読書とタイマー'],
    '已切换到中文': ['Switched to Chinese', '中国語に切り替えました'],
    '当前模式交卷后统一判分': ['This mode grades only after you finish.', 'このモードは提出後にまとめて採点されます。'],
    '选项': ['Options', '選択肢'],
    '提交': ['submit', '送信'],
    '切题': ['switch question', '問題移動'],
    '换主题': ['change theme', 'テーマ変更']
  };

  /* ------------------------------------------------------------------------
     3. 动态文本规则（数字、计数、日期等）
     ------------------------------------------------------------------------ */
  var RULES = [
    { re: /^第\s*(\d+)\s*题\s*·\s*(.+)$/, en: 'Question $1 · $2', ja: '第$1問 · $2' },
    { re: /^第\s*(\d+)\s*题$/, en: 'Question $1', ja: '第$1問' },
    { re: /^跳到第\s*(\d+)\s*题$/, en: 'Jump to question $1', ja: '第$1問へ移動' },
    { re: /^已答\s*(\d+)\s*\/\s*(\d+)\s*题?$/, en: 'Answered $1 / $2', ja: '回答済み $1 / $2' },
    { re: /^已答\s*(\d+)\s*\/\s*(\d+)$/, en: 'Answered $1 / $2', ja: '回答済み $1 / $2' },
    { re: /^(\d+)\s*\/\s*(\d+)\s*题$/, en: '$1 / $2 questions', ja: '$1 / $2問' },
    { re: /^\/\s*(\d+)\s*题$/, en: '/ $1 questions', ja: '/ $1問' },
    { re: /^(\d+)\s*个章节$/, en: '$1 chapters', ja: '$1章' },
    { re: /^(\d+)\s*道题$/, en: '$1 questions', ja: '$1問' },
    { re: /^(\d+)\s*道$/, en: '$1 items', ja: '$1件' },
    { re: /^(\d+)\s*题$/, en: '$1 questions', ja: '$1問' },
    { re: /^共\s*(\d+)\s*题/, en: '$1 questions total', ja: '全$1問' },
    { re: /^正确率\s*(\d+)%$/, en: 'Accuracy $1%', ja: '正答率 $1%' },
    { re: /^(\d+)\s*题不计分$/, en: '$1 not scored', ja: '$1問は採点外' },
    { re: /^单选\s*(\d+)$/, en: 'Single $1', ja: '単一 $1' },
    { re: /^多选\s*(\d+)$/, en: 'Multiple $1', ja: '複数 $1' },
    { re: /^判断\s*(\d+)$/, en: 'True/False $1', ja: '正誤 $1' },
    { re: /^评论\s*·\s*(\d+)$/, en: 'Comments · $1', ja: 'コメント · $1' },
    { re: /^收藏于\s*(.+)$/, en: 'Saved $1', ja: '保存 $1' },
    { re: /^用时\s*(.+)$/, en: 'Time $1', ja: '所要 $1' },
    { re: /^剩余\s*(.+)$/, en: '$1 left', ja: '残り $1' },
    { re: /^本题\s*(.+)$/, en: 'This question $1', ja: 'この問題 $1' },
    { re: /^(\d+)\s*积分$/, en: '$1 points', ja: '$1ポイント' },
    { re: /^(\d+)\s*分$/, en: '$1 pts', ja: '$1点' },
    { re: /^还差\s*(\d+)\s*积分$/, en: '$1 points to go', ja: 'あと$1ポイント' },
    { re: /^积分不够，还差\s*(\d+)\s*积分$/, en: 'Not enough points; $1 more needed', ja: 'ポイント不足。あと$1必要です' },
    { re: /^(\d+)\s*积分解锁$/, en: 'Unlock for $1 points', ja: '$1ポイントで解放' },
    { re: /^消耗\s*(\d+)\s*积分$/, en: 'Cost $1 points', ja: '$1ポイント消費' },
    { re: /^(\d+)\s*分\s*·\s*(.+)$/, en: '$1 pts · $2', ja: '$1点 · $2' },
    { re: /^账户：(.+)$/, en: 'Account: $1', ja: 'アカウント：$1' },
    { re: /^(\d+)\s*个题库$/, en: '$1 banks', ja: '$1問題集' },
    { re: /^(\d+)\s*次练习$/, en: '$1 sessions', ja: '$1回' },
    { re: /^(\d+)\s*道已标记$/, en: '$1 saved', ja: '$1件保存' },
    { re: /^(\d+)\s*道待攻克$/, en: '$1 to review', ja: '$1問復習' },
    { re: /^(\d+)\s*题异常$/, en: '$1 issues', ja: '$1件の問題' },
    { re: /^再获得\s*(\d+)\s*积分升级为「(.+)」$/, en: 'Earn $1 more points to reach “$2”', ja: 'あと$1ポイントで「$2」に昇格' },
    { re: /^距离「(.+)」还差\s*(\d+)\s*积分$/, en: '$2 points to “$1”', ja: '「$1」まであと$2ポイント' },
    { re: /^已切换到「(.+)」$/, en: 'Switched to “$1”', ja: '「$1」に切り替えました' },
    { re: /^已解锁「(.+)」$/, en: 'Unlocked “$1”', ja: '「$1」を解放しました' },
    { re: /^已佩戴「(.+)」$/, en: 'Wearing “$1”', ja: '「$1」を装着しました' },
    { re: /^每日签到\s*\+\s*(\d+)\s*积分$/, en: 'Daily check-in +$1 points', ja: '毎日チェックイン +$1ポイント' },
    { re: /^已导入\s*(\d+)\s*个题库$/, en: 'Imported $1 banks', ja: '$1問題集を読み込みました' },
    { re: /^第\s*(\d+)\s*题\s*原始题库/, en: 'Question $1: original bank', ja: '第$1問：元の問題集' },
    { re: /^(\d+)\s*道题\s*·\s*(\d+)\s*个章节$/, en: '$1 questions · $2 chapters', ja: '$1問 · $2章' },
    { re: /^(\d+)\s*题\s*·\s*(\d+)\s*个章节$/, en: '$1 questions · $2 chapters', ja: '$1問 · $2章' },
    { re: /^共\s*(\d+)\s*道\s*·\s*可单独选择或按轮次筛选$/, en: '$1 total · select individually or filter by round', ja: '全$1件 · 個別選択または回で絞り込み' },
    { re: /^共\s*(\d+)\s*道$/, en: '$1 total', ja: '全$1件' },
    { re: /^共\s*(\d+)\s*轮$/, en: '$1 rounds', ja: '全$1回' },
    { re: /^共\s*(\d+)\s*条异常标记$/, en: '$1 issue marks', ja: '全$1件のマーク' },
    { re: /^共\s*(\d+)\s*条$/, en: '$1 records', ja: '全$1件' },
    { re: /^找到\s*(\d+)\s*个功能$/, en: 'Found $1 features', ja: '$1件の機能が見つかりました' },
    { re: /^全部功能\s*·\s*(\d+)$/, en: 'All features · $1', ja: 'すべての機能 · $1' },
    { re: /^共\s*(\d+)\s*轮\s*·\s*可整轮删除，也可展开删除某一轮的某道题$/, en: '$1 rounds · delete a whole round or individual questions', ja: '全$1回 · 回ごとまたは問題ごとに削除' },
    { re: /^共\s*(\d+)\s*条\s*·\s*可在搜题页开启无痕模式$/, en: '$1 records · enable incognito search on the search page', ja: '全$1件 · 検索画面でシークレット検索を有効にできます' },
    { re: /^共\s*(\d+)\s*条异常标记\s*·\s*删除后会恢复对应题目$/, en: '$1 issue marks · deleting restores the questions', ja: '全$1件のマーク · 削除すると問題が復元されます' },
    { re: /^已删除\s*(\d+)\s*道错题$/, en: 'Deleted $1 mistakes', ja: '$1件の間違いを削除しました' },
    { re: /^已取消\s*(\d+)\s*道收藏$/, en: 'Removed $1 saved questions', ja: '$1件の保存を解除しました' },
    { re: /^删除选中（(\d+)）$/, en: 'Delete selected ($1)', ja: '選択を削除（$1）' },
    { re: /^解锁主题「(.+)」？$/, en: 'Unlock “$1”?', ja: '「$1」を解放しますか？' },
    { re: /^将消耗\s*(\d+)\s*积分（当前\s*(\d+)）。$/, en: 'Costs $1 points (current $2).', ja: '$1ポイント消費（現在$2）。' },
    { re: /^连接成功：(.+)$/, en: 'Connected: $1', ja: '接続成功：$1' },
    { re: /^配置已保存：(.+)$/, en: 'Settings saved: $1', ja: '設定を保存しました：$1' },
    { re: /^答对第\s*(\d+)\s*题$/, en: 'Correct question $1', ja: '第$1問 正解' },
    { re: /^错\s*(\d+)\s*次$/, en: 'Wrong $1 times', ja: '間違い$1回' },
    { re: /^(\d+)\s*道错题\s*·\s*(.+)$/, en: '$1 mistakes · $2', ja: '$1問の間違い · $2' },
    { re: /^建议优先加强：(.+)$/, en: 'Focus on: $1', ja: '優先して強化：$1' },
    { re: /^题量\s*(\d+)\s*·\s*已答\s*(\d+)$/, en: 'Questions $1 · Answered $2', ja: '問題 $1 · 回答済み $2' },
    { re: /^题量\s*(\d+)$/, en: 'Questions $1', ja: '問題 $1' },
    { re: /^已答\s*(\d+)$/, en: 'Answered $1', ja: '回答済み $1' },
    { re: /^正确率\s*(\d+)%，说明这一轮的知识点掌握得不错。可以尝试提高题量或切到模拟考试，保持手感。$/, en: '$1% accuracy: you have a good grasp of this round. Try more questions or a mock exam.', ja: '正答率$1%：この回の内容はよく身についています。問題数を増やすか模擬試験を試しましょう。' },
    { re: /^比上一轮提高了\s*(\d+)%。继续保持现在的复习节奏，下一轮可以重点回看本轮错题。$/, en: 'Up $1% from last round. Keep the pace and review this round’s mistakes next time.', ja: '前回より$1%上昇。この調子で、次は今回の間違いを見直しましょう。' },
    { re: /^比上一轮下降了\s*(\d+)%。别急，先回看错题和解析，把薄弱章节补上，再开新一轮。$/, en: 'Down $1% from last round. Review mistakes and explanations, shore up weak chapters, then start again.', ja: '前回より$1%下降。間違いと解説を見直し、苦手な章を補強してから再開しましょう。' },
    { re: /^最近\s*(\d+)\s*轮涉及这个章节，错误\/未答\s*(\d+)\s*道，正确率\s*(\d+)%。建议先看解析，再用「错题重练」集中做一小轮。$/, en: 'This chapter appeared in the last $1 rounds with $2 wrong/blank and $3% accuracy. Read the explanations, then do a short mistake round.', ja: '直近$1回でこの章が出題され、間違い/未回答$2問、正答率$3%。解説を見てから「間違い練習」を短く行いましょう。' },
    { re: /^最近\s*5\s*轮还有\s*(\d+)\s*道错题\/未答题。去错题本按轮次重练，比重刷整本题库更省时间。$/, en: 'The last 5 rounds still have $1 wrong/blank questions. Practice them by round in the mistake book; it saves time.', ja: '直近5回に間違い/未回答が$1問あります。間違いノートで回ごとに練習すると効率的です。' },
    { re: /^展示最近\s*(\d+)\s*轮，横轴为轮次，纵轴为正确率。$/, en: 'Showing the last $1 rounds; x-axis is round, y-axis is accuracy.', ja: '直近$1回を表示。横軸は回、縦軸は正答率です。' },
    { re: /^最近几轮各章节表现比较均衡。可以尝试随机练习或模拟考试，检验真实掌握程度。$/, en: 'Recent rounds are balanced across chapters. Try random practice or a mock exam to check real mastery.', ja: '最近は章ごとの成績が安定しています。ランダム練習や模擬試験で実力を確認しましょう。' },
    { re: /^完成练习\s*·\s*(.+)（正确率\s*(\d+)%）$/, en: 'Completed · $1 (accuracy $2%)', ja: '練習完了 · $1（正答率$2%）' },
    { re: /^解锁主题：(.+)$/, en: 'Unlocked theme: $1', ja: 'テーマ解放：$1' },
    { re: /^当前数据：已答\s*(\d+)\s*题\s*·\s*错题\s*(\d+)\s*道\s*·\s*收藏\s*(\d+)\s*道\s*·\s*成绩\s*(\d+)\s*轮\s*·\s*积分\s*(\d+)。备份文件是 JSON，包含题库、进度、错题、收藏、成绩、积分和设置（不含 AI Key）。$/, en: 'Current data: $1 answered · $2 mistakes · $3 saved · $4 sessions · $5 points. The JSON backup includes banks, progress, mistakes, saved questions, scores, points and settings (not the AI key).', ja: '現在：回答$1・間違い$2・保存$3・成績$4回・ポイント$5。JSON バックアップには問題集・進捗・間違い・保存・成績・ポイント・設定が含まれます（AI キーを除く）。' }
  ];

  /* ------------------------------------------------------------------------
     4. 基础 API
     ------------------------------------------------------------------------ */
  function lang() {
    var l = HZQ.store && HZQ.store.settings ? HZQ.store.settings().language : 'zh';
    return DICT[l] ? l : 'zh';
  }
  function setLang(l) {
    if (DICT[l] && HZQ.store) {
      var scrollY = window.scrollY || 0;
      HZQ.store.setSetting('language', l);
      apply(document.body);
      // 视图通常会在 setLanguage 里重绘；再补两次翻译，兜住异步插入的节点。
      setTimeout(function () { apply(document.body); }, 120);
      setTimeout(function () { apply(document.body); }, 500);
      // 重绘会把页面滚回顶部；切语言时尽量保持当前位置。
      setTimeout(function () { window.scrollTo(0, scrollY); }, 0);
      setTimeout(function () { window.scrollTo(0, scrollY); }, 160);
    }
  }
  function t(key, fallback) {
    var d = DICT[lang()] || DICT.zh;
    return d[key] || (fallback !== undefined ? fallback : key);
  }
  function languages() {
    return [
      { id: 'zh', name: '中文' },
      { id: 'en', name: 'English' },
      { id: 'ja', name: '日本語' }
    ];
  }

  /* ------------------------------------------------------------------------
     5. DOM 翻译器
     ------------------------------------------------------------------------ */
  var SKIP_SELECTOR = [
    '[data-i18n-skip]',
    '.stem', '.stem-1', '.opt', '.opt .t', '.search-preview',
    '.quality-stem', '.comment-text', '.comment-item .name',
    '.rowitem .txt', '.bankcard .desc',
    '.ai-answer-body', '.ai-context-pre', '.quote-text', '.quote-by',
    '.help-pre', 'pre', 'code', 'textarea',
    '.explain > div:not(.hd)', '.explain > .body', '.explain > .content'
  ].join(', ');

  function isSkipped(node) {
    if (!node || node.nodeType !== 1) return false;
    try {
      if (node.matches && node.matches(SKIP_SELECTOR)) return true;
      if (node.closest && node.closest(SKIP_SELECTOR)) return true;
    } catch (e) { /* 老浏览器不支持复杂选择器时忽略 */ }
    return false;
  }

  function dataTextSet() {
    var set = {};
    if (!HZQ.data || !HZQ.data.banks) return set;
    HZQ.data.banks.forEach(function (b) {
      if (b.title) set[b.title] = 1;
      if (b.desc) set[b.desc] = 1;
      (b.chapters || []).forEach(function (c) {
        if (c && c.title) set[c.title] = 1;
      });
    });
    return set;
  }

  function phraseFor(core, l) {
    var arr = PHRASES[core];
    if (arr) return arr[l === 'ja' ? 1 : 0];
    // 允许去掉末尾的冒号 / 问号后再查一次
    var m = /^(.*?)([：:？?！!。.…]+)$/.exec(core);
    if (m && PHRASES[m[1]]) return PHRASES[m[1]][l === 'ja' ? 1 : 0] + m[2];
    return '';
  }

  function translateQuoted(str, l) {
    var out = String(str).replace(/「([^」]+)」/g, function (all, name) {
      var arr = PHRASES[name];
      var n = arr ? arr[l === 'ja' ? 1 : 0] : name;
      return l === 'ja' ? '「' + n + '」' : '“' + n + '”';
    });
    return out.replace(/“([^”]+)”/g, function (all, name) {
      var arr = PHRASES[name];
      var n = arr ? arr[l === 'ja' ? 1 : 0] : name;
      return l === 'ja' ? '「' + n + '」' : '“' + n + '”';
    });
  }

  function ruleFor(core, l) {
    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i];
      if (r.re.test(core)) {
        return translateQuoted(core.replace(r.re, l === 'ja' ? r.ja : r.en), l);
      }
    }
    return '';
  }

  function translateText(text, ctx, parent) {
    if (!text) return text;
    var l = lang();
    if (l === 'zh') return text;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(String(text));
    if (!m) return text;
    var lead = m[1], core = m[2], trail = m[3];
    if (!core) return text;
    if (ctx && ctx.dataText && ctx.dataText[core]) return text;

    // “收藏”作动词和名词时英文不同：按钮里用 Save，统计标签里用 Saved。
    if (core === '收藏') {
      var inButton = false;
      try { inButton = !!(parent && parent.closest && parent.closest('.btn, button, .answer-hint')); } catch (e) {}
      return lead + (l === 'ja' ? '保存' : (inButton ? 'Save' : 'Saved')) + trail;
    }

    var exact = phraseFor(core, l);
    if (exact) return lead + exact + trail;

    // “题库 · 模式”这种用 · 拼接的文案：逐段翻译，题库名保持原文
    if (core.indexOf(' · ') >= 0) {
      var parts = core.split(' · ');
      var changed = false;
      var mapped = parts.map(function (part) {
        if (ctx && ctx.dataText && ctx.dataText[part]) return part;
        var p = phraseFor(part, l);
        if (!p) p = ruleFor(part, l);
        if (p) { changed = true; return p; }
        return part;
      });
      if (changed) return lead + mapped.join(' · ') + trail;
    }

    var rule = ruleFor(core, l);
    if (rule) return lead + rule + trail;

    // 最后尝试逐词替换常见标签，只处理被 <b> 等标签拆开的很短片段，
    // 避免把一整句中文替换成中英混杂。
    if (ctx && ctx.replacements && core.length <= 12) {
      var replaced = core;
      ctx.replacements.forEach(function (pair) {
        if (replaced.indexOf(pair[0]) >= 0) replaced = replaced.split(pair[0]).join(pair[1]);
      });
      if (replaced !== core) return lead + replaced + trail;
    }
    return text;
  }

  function applyAttr(el, name, ctx) {
    if (!el.getAttribute) return;
    var val = el.getAttribute(name);
    if (!val) return;
    // textarea 本身被跳过是为了保护用户输入内容，但它的 placeholder 仍然应该翻译。
    if (el.matches && el.matches('input, textarea')) {
      if (el.parentElement && isSkipped(el.parentElement)) return;
    } else if (isSkipped(el)) return;
    var store = el.__i18nAttr || (el.__i18nAttr = {});
    var rec = store[name];
    if (!rec || rec.dst !== val) rec = store[name] = { src: val, dst: val };
    var dst = translateText(rec.src, ctx);
    if (dst !== val) {
      rec.dst = dst;
      el.setAttribute(name, dst);
    } else {
      rec.dst = val;
    }
  }

  function walk(node, ctx) {
    if (!node) return;
    if (node.nodeType === 3) {
      var parent = node.parentNode;
      if (!parent || parent.nodeType !== 1 || isSkipped(parent)) return;
      if (node.__i18nSrc === undefined) node.__i18nSrc = node.nodeValue;
      var dst = translateText(node.__i18nSrc, ctx, parent);
      if (dst !== node.nodeValue) node.nodeValue = dst;
      return;
    }
    if (node.nodeType !== 1) return;
    if (isSkipped(node)) return;
    applyAttr(node, 'placeholder', ctx);
    applyAttr(node, 'title', ctx);
    applyAttr(node, 'aria-label', ctx);
    var child = node.firstChild;
    while (child) {
      var next = child.nextSibling;
      walk(child, ctx);
      child = next;
    }
  }

  function makeCtx() {
    var l = lang();
    return {
      dataText: dataTextSet(),
      replacements: l === 'en' ? [
        ['已答', 'Answered'], ['答对', 'Correct'], ['答错', 'Wrong'], ['未答', 'Blank'],
        ['正确率', 'Accuracy'], ['不计分', 'not scored'], ['累计获得', 'Total earned'],
        ['题库', 'Banks'], ['收藏', 'Saved'], ['错题', 'Mistakes'],
        ['积分', 'points'], ['称号', 'Title'], ['主题', 'Theme'],
        ['解析', 'Explanation'], ['答案', 'Answer'], ['题目', 'Question'],
        ['道题', 'questions'],
        ['今天', 'Today'], ['昨天', 'Yesterday'], ['分钟', 'min'], ['小时', 'hr'], ['秒', 'sec']
      ] : [
        ['已答', '回答済み'], ['答对', '正解'], ['答错', '不正解'], ['未答', '未回答'],
        ['正确率', '正答率'], ['不计分', '採点外'], ['累计获得', '累計獲得'],
        ['题库', '問題集'], ['收藏', '保存'], ['错题', '間違い'],
        ['积分', 'ポイント'], ['称号', '称号'], ['主题', 'テーマ'],
        ['解析', '解説'], ['答案', '答え'], ['题目', '問題'],
        ['道题', '問'],
        ['今天', '今日'], ['昨天', '昨日'], ['分钟', '分'], ['小时', '時間'], ['秒', '秒']
      ]
    };
  }

  function apply(root) {
    root = root || document.body;
    if (!root) return;
    var l = lang();
    if (l === 'zh') {
      // 切回中文时，把之前翻译过的节点恢复成原文
      restore(root);
      return;
    }
    walk(root, makeCtx());
  }

  function restore(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      if (node.__i18nSrc !== undefined && node.nodeValue !== node.__i18nSrc) {
        node.nodeValue = node.__i18nSrc;
      }
      return;
    }
    if (node.nodeType !== 1) return;
    ['placeholder', 'title', 'aria-label'].forEach(function (name) {
      var store = node.__i18nAttr && node.__i18nAttr[name];
      if (store && node.getAttribute(name) === store.dst && node.getAttribute(name) !== store.src) {
        node.setAttribute(name, store.src);
        store.dst = store.src;
      }
    });
    var child = node.firstChild;
    while (child) {
      var next = child.nextSibling;
      restore(child);
      child = next;
    }
  }

  function installObserver() {
    if (!window.MutationObserver || !document.body) return;
    var observer = new MutationObserver(function (mutations) {
      if (lang() === 'zh') return;
      var ctx = makeCtx();
      mutations.forEach(function (m) {
        if (m.type === 'childList') {
          Array.prototype.forEach.call(m.addedNodes || [], function (n) {
            walk(n, ctx);
          });
        } else if (m.type === 'attributes') {
          applyAttr(m.target, m.attributeName, ctx);
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });
  }

  if (document.body) {
    apply(document.body);
    installObserver();
    setTimeout(function () { if (lang() !== 'zh') apply(document.body); }, 400);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      apply(document.body);
      installObserver();
    });
  }

  return {
    lang: lang,
    setLang: setLang,
    t: t,
    languages: languages,
    apply: apply,
    translateText: translateText
  };
})();
