// BjxySettings.jsx — 后台 settings UI
// 8 section: 品牌 / Hero / 关于 / 特色 / 教学体系 / 教练 / 评价 / 学员展示 / 联系
// Flarum 2.0 admin ExtensionPage pattern (跟 ziven-dress-up SeedreamAdminPage 同款)
// v0.1.0c 修: BjxySettings extends ExtensionPage (vendor Flarum 2.0 class),
//              override content() 方法 (走 vendor sections().toArray() 框架)
import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import ColorPreviewInput from 'flarum/common/components/ColorPreviewInput';
// mithril 走 vendor 注入的 global m (zct 同款, 不 import)

const DEFAULT_FEATURES = [
  { icon: '🏂', title: '室内滑雪高效', desc: '一年四季恒温环境, 不受天气影响' },
  { icon: '🛡️', title: '安全专业教练', desc: '认证教练全程指导, 安全第一' },
  { icon: '📚', title: '滑雪教学', desc: '自主研发课程体系, 分级进阶' },
  { icon: '🎿', title: '雪具护具免费', desc: '全套装备免费使用, 省心省力' },
  { icon: '🌐', title: '全国品牌机构', desc: '连锁品牌, 标准化教学' },
  { icon: '🏔️', title: '学玩用赛', desc: '全生态滑雪服务' },
];

// v0.1.0s 改: 教学体系从 2 个固定 array (single/double) 重构成 boards 数组
//   每个 board: {name, levels: [{level, name, desc}, ...]}
//   默认 2 个 board (单板 + 双板), 跟 v0.1.0r 兼容
//   用户可后台增删 board 本身 (雪橇/冰球/自由式等)
const DEFAULT_BOARDS = [
  { name: '单板', levels: [
    { level: 'PRIMARY', name: '直滑降后刃推坡', desc: '能够熟练的做直滑降练习...' },
    { level: 'PRIMARY', name: '前刃推坡', desc: '能够利用前刃做到匀速上滑...' },
    { level: 'PRIMARY', name: '前后刃落叶飘', desc: '在前后刃落叶飘的过程当中...' },
    { level: 'INTERMEDIATE', name: '辅助换刃', desc: '在借助扶杆 + 拉绳 + 拉手...' },
    { level: 'INTERMEDIATE', name: '基础转弯', desc: '不借助外力, S 形搓雪...' },
    { level: 'INTERMEDIATE', name: '标准转弯', desc: '动作有明显引申, 滑行流畅...' },
    { level: 'ADVANCED', name: '刻滑', desc: '不搓雪的刻滑转弯...' },
    { level: 'ADVANCED', name: '自由式', desc: '流畅正反脚滑行, Ollie...' },
  ]},
  { name: '双板', levels: [
    { level: 'PRIMARY', name: '犁式刹车', desc: '熟悉滑雪基本站姿...' },
    { level: 'PRIMARY', name: '基础犁式转弯', desc: '在犁式刹车基础上...' },
    { level: 'PRIMARY', name: '高级犁式转弯', desc: '熟练基础犁式转弯的基础上...' },
    { level: 'INTERMEDIATE', name: '半犁式转弯', desc: '稳定流畅的犁式转弯后...' },
    { level: 'INTERMEDIATE', name: '高级半犁式', desc: '熟练犁式转弯...' },
    { level: 'INTERMEDIATE', name: '基础平行式', desc: '能够在转弯的任何阶段保持双板平行...' },
    { level: 'ADVANCED', name: '中级平行式', desc: '平行转弯流畅, 有较好的滑行节奏...' },
    { level: 'ADVANCED', name: '高级平行式', desc: '精准的控制雪板刃的使用...' },
    { level: 'ADVANCED', name: '全地域大神', desc: '单脚滑行, 豚跳, 180 度旋转...' },
  ]},
];

export default class BjxySettings extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = true;
    this.saving = false;
    this.data = {};
    this.features = JSON.parse(JSON.stringify(DEFAULT_FEATURES));
    // v0.1.0s 改: this.boards array 替代 this.single / this.double
    this.boards = JSON.parse(JSON.stringify(DEFAULT_BOARDS));
    this.coachGroupIds = [];
    this.allGroups = [];
    this.loadSettings();
  }

  // Flarum 2.0 ExtensionPage content() 是 sections().toArray() 的 'content' key
  // override content() 就能在 vendor ExtensionPage 框架里渲染 bjxy settings
  content() {
    if (this.loading) {
      return m('div', { class: 'BjxySettings' }, m('p', null, '加载中...'));
    }

    // v0.1.0d 修: 不能在 module top-level 缓存 app.forum.attribute.bind() (那时 admin app
    // 还没 register, app undefined throw). 改在 content() 调用时 lazy 拿 app.
    const s = app && app.forum ? app.forum.attribute.bind(app.forum) : () => null;

    // v0.1.0n 修: value 优先级 反过来 this.data[key] 优先
    // 之前 (s(key) || this.data[key]) → server load 时的旧值优先, 用户改了 input
    // mithril redraw 重 render 时 s(key) 仍是 server 旧值 → 覆盖用户输入 → 看似被重置
    // 现在 this.data[key] 优先 (用户输入), 然后 s(key) (load 时的 server 值), 然后 default
    // load 完一次 this.data 已经存 server 值, 所以 user 改了 this.data[key] 后 redraw
    // 拿到的还是 user 改的值, 不会回退到 server 旧值
    const field = (label, key, defaultValue) => m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m('input', {
        class: 'BjxyField-input',
        value: (this.data[key] != null ? this.data[key] : (s(key) || '')) || defaultValue,
        placeholder: defaultValue,
        oninput: (e) => { this.data[key] = e.target.value; },
      }),
    ]);

    // v0.1.0m 颜色选择器: 用 vendor ColorPreviewInput (跨浏览器一致)
    // v0.1.0j 用的 HTML5 native <input type="color"> 在某些浏览器 (iOS Safari, 部分 Android) 不显示 swatch
    // 辉哥 00:45 反馈浅色 end + 深色 end 的色块空白, 改成 vendor ColorPreviewInput (text + hidden color + icon, 跨浏览器 work)
    const colorField = (label, key, defaultColor) => m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m(ColorPreviewInput, {
        className: 'BjxyField-color-text',
        value: (this.data[key] != null ? this.data[key] : (s(key) || '')) || defaultColor,
        placeholder: defaultColor,
        onchange: (e) => { this.data[key] = e.target.value; m.redraw(); },
      }),
    ]);

    const textareaField = (label, key, defaultValue) => m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m('textarea', {
        class: 'BjxyField-textarea',
        value: (this.data[key] != null ? this.data[key] : (s(key) || '')) || defaultValue,
        placeholder: defaultValue,
        oninput: (e) => { this.data[key] = e.target.value; },
      }),
    ]);

    const fileField = (label, key, hint) => {
      const url = this.data[key] || '';
      return m('div', { class: 'BjxyField-row' }, [
        m('div', { class: 'BjxyField-label' }, label),
        m('div', null, [
          m('div', { class: 'BjxyField-file', onclick: (e) => this.uploadFile(e, key) }, '📷 点击上传 (' + hint + ')'),
          url ? m('div', { class: 'BjxyField-file-preview' }, [
            m('div', null, '✓ 已上传: ' + url),
            (key.indexOf('banner') >= 0 || key.indexOf('logo') >= 0 || key.indexOf('image') >= 0)
              ? m('div', null, m('img', { src: url, alt: '' }))
              : null,
          ]) : null,
        ]),
      ]);
    };

    return m('div', { class: 'BjxySettings' }, [
      m('div', { class: 'BjxySettings-intro' }, [
        m('h2', null, '北极雪屿官网配置'),
        m('p', { class: 'desc' }, '配置 /bjxy 页面所有内容 (8 section + 后台上传走 ziven-core COS)'),
      ]),

      // Section 1: 品牌
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '🏔 品牌信息 (全局)'),
        m('div', { class: 'BjxySection-body' }, [
          field('品牌名', 'bjxy_brand_name', '北极雪屿'),
          field('品牌副标', 'bjxy_brand_slogan', '室内滑雪 · 全国连锁'),
          fileField('Logo 图片', 'bjxy_brand_logo_url', 'logo.svg / png (走 ziven-core COS)'),
        ]),
      ]),

      // v0.1.0m: 渐变背景 4 色 — 删了 BjxyField-hint 块 (v0.1.0j 加的提示语占一整行
      // 把 grid 2 列布局变 1+1+1+1, 辉哥反馈页面不规整)
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '🎨 背景渐变 (浅深双版)'),
        m('div', { class: 'BjxySection-body' }, [
          colorField('浅色模式 - 起始色', 'bjxy_bg_gradient_light_start', '#E0EBF8'),
          colorField('浅色模式 - 结束色', 'bjxy_bg_gradient_light_end', '#F7FAFC'),
          colorField('深色模式 - 起始色', 'bjxy_bg_gradient_dark_start', '#0F1419'),
          colorField('深色模式 - 结束色', 'bjxy_bg_gradient_dark_end', '#1A202C'),
        ]),
      ]),

      // Section 2: Hero
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '🏔 Hero 区域'),
        m('div', { class: 'BjxySection-body' }, [
          field('主标题', 'bjxy_hero_title', '探索极致的滑雪体验。'),
          field('副标题', 'bjxy_hero_subtitle', '专注滑雪领域的全国连锁机构...'),
          fileField('浅色模式 banner', 'bjxy_hero_banner_light', '1920×600 推荐'),
          fileField('深色模式 banner', 'bjxy_hero_banner_dark', '1920×600 推荐'),
          field('CTA 文字', 'bjxy_hero_cta_text', '立即咨询'),
          field('CTA 链接', 'bjxy_hero_cta_link', '#contact'),
        ]),
      ]),

      // Section 3: 关于
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '📖 关于我们'),
        m('div', { class: 'BjxySection-body' }, [
          field('小标题', 'bjxy_about_sub', 'ABOUT US'),
          field('主标题', 'bjxy_about_title', '关于北极雪屿'),
          textareaField('描述', 'bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年...'),
          field('数据 1 - 数字', 'bjxy_about_stat_1_num', '10+'),
          field('数据 1 - 标签', 'bjxy_about_stat_1_label', '年教学经验'),
          field('数据 2 - 数字', 'bjxy_about_stat_2_num', '50+'),
          field('数据 2 - 标签', 'bjxy_about_stat_2_label', '专业教练'),
          field('数据 3 - 数字', 'bjxy_about_stat_3_num', '1000+'),
          field('数据 3 - 标签', 'bjxy_about_stat_3_label', '毕业学员'),
        ]),
      ]),

      // Section 4: 特色
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '✨ 办学特色 (6 个卡片)'),
        m('div', { class: 'BjxySection-body' }, [
          m('div', { class: 'BjxyField-label' }, '特色卡片'),
          m('div', { class: 'BjxyField-array' }, [
            this.features.map((f, i) => m('div', { class: 'BjxyField-array-row', key: 'f' + i }, [
              m('div', { class: 'ic-mini' }, f.icon || '★'),
              m('input', { value: f.title, oninput: (e) => { f.title = e.target.value; } }),
              m('input', { value: f.icon, oninput: (e) => { f.icon = e.target.value; } }),
              m('input', { value: f.desc, oninput: (e) => { f.desc = e.target.value; } }),
              m('button', { class: 'del', onclick: () => { this.features.splice(i, 1); m.redraw(); } }, '×'),
            ])),
            m('div', {
              class: 'BjxyField-array-add',
              onclick: () => { this.features.push({ icon: '★', title: '新特色', desc: '' }); m.redraw(); },
            }, '+ 添加特色'),
          ]),
        ]),
      ]),

      // Section 5: 教学体系
      // v0.1.0s 改: 教学体系类型任意多 (boards array), 之前 fixed 单板/双板
      //   - 每个 board 是 {name, levels: [...]}, 用户可增删 board 本身 (雪橇/冰球/自由式等)
      //   - 每个 board 内 levels 可增删改 (v0.1.0r 实现)
      //   - level 字段 select 三选一 (PRIMARY/INTERMEDIATE/ADVANCED)
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '📚 教学体系 (' + this.boards.length + ' 种类型 / 共 ' + this.boards.reduce((s, b) => s + b.levels.length, 0) + ' 级)'),
        m('div', { class: 'BjxySection-body' }, [
          this.boards.map((board, bi) => m('div', { class: 'BjxyField-board', key: 'board' + bi }, [
            m('div', { class: 'BjxyField-board-head' }, [
              m('input', {
                class: 'BjxyField-board-name',
                value: board.name,
                placeholder: '类型名 (单板/双板/雪橇/冰球...)',
                oninput: (e) => { board.name = e.target.value; },
              }),
              m('span', { class: 'BjxyField-board-count' }, board.levels.length + ' 级'),
              m('button', {
                class: 'del',
                onclick: () => { if (confirm('删除类型 ' + board.name + ' 及其所有等级?')) { this.boards.splice(bi, 1); m.redraw(); } },
              }, '× 删除类型'),
            ]),
            m('div', { class: 'BjxyField-array' }, [
              board.levels.map((l, i) => m('div', { class: 'BjxyField-array-row', key: 'b' + bi + 'l' + i }, [
                m('div', { class: 'ic-mini' }, i + 1),
                m('select', {
                  value: l.level,
                  onchange: (e) => { l.level = e.target.value; },
                }, [
                  m('option', { value: 'PRIMARY' }, 'PRIMARY'),
                  m('option', { value: 'INTERMEDIATE' }, 'INTERMEDIATE'),
                  m('option', { value: 'ADVANCED' }, 'ADVANCED'),
                ]),
                m('input', { value: l.name, oninput: (e) => { l.name = e.target.value; } }),
                m('input', { value: l.desc, oninput: (e) => { l.desc = e.target.value; } }),
                m('button', { class: 'del', onclick: () => { board.levels.splice(i, 1); m.redraw(); } }, '×'),
              ])),
              m('div', {
                class: 'BjxyField-array-add',
                onclick: () => { board.levels.push({ level: 'PRIMARY', name: '新等级', desc: '' }); m.redraw(); },
              }, '+ 添加等级'),
            ]),
          ])),
          m('div', {
            class: 'BjxyField-board-add',
            onclick: () => { this.boards.push({ name: '新类型', levels: [{ level: 'PRIMARY', name: '新等级', desc: '' }] }); m.redraw(); },
          }, '+ 添加类型 (雪橇 / 冰球 / 自由式...)'),
        ]),
      ]),

      // Section 6: 教练
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '👥 教练展示'),
        m('div', { class: 'BjxySection-body' }, [
          m('div', { class: 'BjxyField-label' }, '选择用户组 (多选)'),
          m('div', { class: 'BjxyField-group-select' }, [
            this.allGroups.length === 0 ? m('div', { class: 'BjxyField-hint' }, '加载中...') : null,
            this.allGroups.map(g => {
              const on = this.coachGroupIds.indexOf(g.id) >= 0;
              return m('div', {
                class: 'opt' + (on ? ' on' : ''),
                onclick: () => this.toggleGroup(g.id),
              }, [
                m('span', { class: 'ck' }, on ? '✓' : ''),
                g.nameSingular + ' (' + (g.userCount || 0) + ' 人)',
              ]);
            }),
            m('div', { class: 'BjxyField-group-pick', onclick: () => this.openGroupModal() }, '🎯 弹 modal 选用户组 (v0.1.1)'),
            m('div', { class: 'BjxyField-hint' }, '💡 选中用户组内的所有用户将作为教练展示. 拖拽排序 + 弹 modal 在 v0.1.1.'),
          ]),
        ]),
      ]),

      // Section 7: 学员评价
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '💬 学员评价 (HTML 自由区)'),
        m('div', { class: 'BjxySection-body' }, [
          m('div', { class: 'BjxyField-label', style: 'padding-top: 0;' }, 'HTML 自由区'),
          m('textarea', {
            class: 'BjxyField-textarea',
            style: 'min-height: 120px; grid-column: 2;',
            value: this.data.bjxy_reviews_html || '',
            placeholder: '<div class="review">评价卡片...</div>',
            oninput: (e) => { this.data.bjxy_reviews_html = e.target.value; },
          }),
          m('div', { class: 'BjxyField-hint', style: 'grid-column: 2;' }, '💡 自由布局: 卡片 / 轮播 / 视频 / 嵌入第三方评论, 任意 HTML'),
        ]),
      ]),

      // Section 8: 学员展示
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '📸 学员展示'),
        m('div', { class: 'BjxySection-body' }, [
          m('div', { class: 'BjxyField-label', style: 'padding-top: 0;' }, 'HTML 自由区 (瀑布流 / 时间线 / 视频集)'),
          m('textarea', {
            class: 'BjxyField-textarea',
            style: 'min-height: 80px; grid-column: 2;',
            value: this.data.bjxy_students_html || '',
            placeholder: '<div class="student-grid">...</div>',
            oninput: (e) => { this.data.bjxy_students_html = e.target.value; },
          }),
          m('div', { class: 'BjxyField-hint', style: 'grid-column: 2;' }, '💡 也可以用下面的简化 JSON: [{"image":"url","name":"王同学"}]'),
          m('div', { class: 'BjxyField-label' }, '学员 JSON (简单版)'),
          m('textarea', {
            class: 'BjxyField-textarea',
            style: 'min-height: 60px; grid-column: 2;',
            value: this.data.bjxy_students_json || '',
            placeholder: '[{"name":"王同学 · 初级毕业"}, ...]',
            oninput: (e) => { this.data.bjxy_students_json = e.target.value; },
          }),
        ]),
      ]),

      // Section 9: 联系
      m('div', { class: 'BjxySection' }, [
        m('div', { class: 'BjxySection-head' }, '📞 联系我们'),
        m('div', { class: 'BjxySection-body' }, [
          field('地址', 'bjxy_contact_address', '北京市朝阳区滑雪场路 88 号'),
          field('电话', 'bjxy_contact_phone', '400-888-8888'),
          field('微信', 'bjxy_contact_wechat', 'bjxy_ski'),
          field('邮箱', 'bjxy_contact_email', 'hi@bjxy.com'),
        ]),
      ]),

      m('div', { class: 'BjxySavebar' }, [
        m('button', { class: 'btn-secondary', onclick: () => m.redraw() }, '取消'),
        m('button', {
          class: 'btn-primary',
          onclick: () => this.save(),
          disabled: this.saving,
        }, this.saving ? '保存中...' : '保存全部'),
      ]),
    ]);
  }

  async loadSettings() {
    try {
      const data = await app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/bjxy/settings',
      });
      this.data = data.settings || {};
      if (this.data.bjxy_features_json) {
        try { this.features = JSON.parse(this.data.bjxy_features_json); } catch (e) {}
      }
      // v0.1.0s 改: 优先读 bjxy_curriculum_boards_json (新格式), 兼容旧 single/double
      if (this.data.bjxy_curriculum_boards_json) {
        try {
          const parsed = JSON.parse(this.data.bjxy_curriculum_boards_json);
          if (Array.isArray(parsed) && parsed.length > 0) this.boards = parsed;
        } catch (e) {}
      } else if (this.data.bjxy_curriculum_single_json || this.data.bjxy_curriculum_double_json) {
        // 旧数据迁移: 单板/双板 → boards array
        this.boards = [
          { name: '单板', levels: (() => { try { return JSON.parse(this.data.bjxy_curriculum_single_json) || []; } catch (e) { return []; } })() },
          { name: '双板', levels: (() => { try { return JSON.parse(this.data.bjxy_curriculum_double_json) || []; } catch (e) { return []; } })() },
        ];
      }
      if (this.data.bjxy_coach_group_ids) {
        try { this.coachGroupIds = JSON.parse(this.data.bjxy_coach_group_ids); } catch (e) {}
      }
      const grpData = await app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/groups',
        params: { page: { limit: 50 } },
      });
      this.allGroups = (grpData.data || []).map(g => ({
        id: g.id,
        nameSingular: g.attributes.nameSingular,
        userCount: g.attributes.userCount || 0,
      }));
    } catch (e) {
      console.error('bjxy settings load failed', e);
    }
    this.loading = false;
    m.redraw();
  }

  toggleGroup(id) {
    const idx = this.coachGroupIds.indexOf(id);
    if (idx >= 0) this.coachGroupIds.splice(idx, 1);
    else this.coachGroupIds.push(id);
    m.redraw();
  }

  // v0.1.0f 修: openGroupModal 不能用 app.modal.show({title, content}) 传 plain object
  // Flarum 2.0 ModalManager 期望 Component class, plain object 抛 "ModalManager can only show Modals"
  // 这个 throw 会让整个 admin app 状态崩, 后续操作全部白屏, mobile 看到 forum
  // "加载论坛时出错" 误以为是 page load 失败. 改用 alert 占位 (v0.1.1 实装 modal 选用户组)
  openGroupModal() {
    app.alerts.show({ type: 'info' }, '弹 modal 选用户组 + 拖拽排序在 v0.1.1 实现');
  }

  async uploadFile(e, key) {
    e.preventDefault();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      form.append('key', key);
      try {
        // v0.1.0g 修: 删 `headers: { 'Content-Type': null }` (Flarum 2.0 mithril request
        // 把 null 转字符串 "null" 而不是移除 header, server 拿到 Content-Type: null
        // 不会自动转 multipart/form-data, 然后拿不到 form fields → "missing key" 400.
        // 正确做法: 完全不传 headers, 让 app.request 默认行为 (浏览器自动 set multipart + boundary)
        const r = await app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/bjxy/upload',
          body: form,
        });
        if (r.ok) {
          this.data[key] = r.url;
          app.alerts.show({ type: 'success' }, '上传成功');
          m.redraw();
        } else {
          app.alerts.show({ type: 'error' }, r.error || '上传失败');
        }
      } catch (err) {
        app.alerts.show({ type: 'error' }, '上传异常: ' + err.message);
      }
    };
    fileInput.click();
  }

  async save() {
    this.saving = true;
    m.redraw();
    const payload = Object.assign({}, this.data);
    payload.bjxy_features_json = JSON.stringify(this.features);
    // v0.1.0s 改: boards array 写到 bjxy_curriculum_boards_json 新字段
    payload.bjxy_curriculum_boards_json = JSON.stringify(this.boards);
    payload.bjxy_coach_group_ids = JSON.stringify(this.coachGroupIds);
    try {
      await app.request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/bjxy/settings',
        body: payload,
      });
      app.alerts.show({ type: 'success' }, '保存成功');
    } catch (e) {
      app.alerts.show({ type: 'error' }, '保存失败: ' + e.message);
    }
    this.saving = false;
    m.redraw();
  }
}
