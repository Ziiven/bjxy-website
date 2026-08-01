// BjxySettings.jsx — 后台 settings UI
// 8 section: 品牌 / Hero / 关于 / 特色 / 教学体系 / 教练 / 评价 / 学员展示 / 联系
import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
// mithril 走 vendor 注入的 global m (zct 同款, 不 import)

const DEFAULT_FEATURES = [
  { icon: '🏂', title: '室内滑雪高效', desc: '一年四季恒温环境, 不受天气影响' },
  { icon: '🛡️', title: '安全专业教练', desc: '认证教练全程指导, 安全第一' },
  { icon: '📚', title: '滑雪教学', desc: '自主研发课程体系, 分级进阶' },
  { icon: '🎿', title: '雪具护具免费', desc: '全套装备免费使用, 省心省力' },
  { icon: '🌐', title: '全国品牌机构', desc: '连锁品牌, 标准化教学' },
  { icon: '🏔️', title: '学玩用赛', desc: '全生态滑雪服务' },
];

const DEFAULT_SINGLE = [
  { level: 'PRIMARY', name: '直滑降后刃推坡', desc: '能够熟练的做直滑降练习...' },
  { level: 'PRIMARY', name: '前刃推坡', desc: '能够利用前刃做到匀速上滑...' },
  { level: 'PRIMARY', name: '前后刃落叶飘', desc: '在前后刃落叶飘的过程当中...' },
  { level: 'INTERMEDIATE', name: '辅助换刃', desc: '在借助扶杆 + 拉绳 + 拉手...' },
  { level: 'INTERMEDIATE', name: '基础转弯', desc: '不借助外力, S 形搓雪...' },
  { level: 'INTERMEDIATE', name: '标准转弯', desc: '动作有明显引申, 滑行流畅...' },
  { level: 'ADVANCED', name: '刻滑', desc: '不搓雪的刻滑转弯...' },
  { level: 'ADVANCED', name: '自由式', desc: '流畅正反脚滑行, Ollie...' },
];
const DEFAULT_DOUBLE = [
  { level: 'PRIMARY', name: '犁式刹车', desc: '熟悉滑雪基本站姿...' },
  { level: 'PRIMARY', name: '基础犁式转弯', desc: '在犁式刹车基础上...' },
  { level: 'PRIMARY', name: '高级犁式转弯', desc: '熟练基础犁式转弯的基础上...' },
  { level: 'INTERMEDIATE', name: '半犁式转弯', desc: '稳定流畅的犁式转弯后...' },
  { level: 'INTERMEDIATE', name: '高级半犁式', desc: '熟练犁式转弯...' },
  { level: 'INTERMEDIATE', name: '基础平行式', desc: '能够在转弯的任何阶段保持双板平行...' },
  { level: 'ADVANCED', name: '中级平行式', desc: '平行转弯流畅, 有较好的滑行节奏...' },
  { level: 'ADVANCED', name: '高级平行式', desc: '精准的控制雪板刃的使用...' },
  { level: 'ADVANCED', name: '全地域大神', desc: '单脚滑行, 豚跳, 180 度旋转...' },
];

export default class BjxySettings extends Component {
  init() {
    this.loading = true;
    this.saving = false;
    this.data = {};
    this.features = JSON.parse(JSON.stringify(DEFAULT_FEATURES));
    this.single = JSON.parse(JSON.stringify(DEFAULT_SINGLE));
    this.double = JSON.parse(JSON.stringify(DEFAULT_DOUBLE));
    this.coachGroupIds = [];
    this.allGroups = [];
  }

  view() {
    if (this.loading) {
      return <div class="BjxySettings"><p>加载中...</p></div>;
    }
    return (
      <div class="BjxySettings">
        <h1>北极雪屿官网配置</h1>
        <p class="desc">配置 /bjxy 页面所有内容 (8 section + 后台上传走 ziven-core COS)</p>

        <div class="BjxySection">
          <div class="BjxySection-head">🏔 品牌信息 (全局)</div>
          <div class="BjxySection-body">
            {this.field('品牌名', 'bjxy_brand_name', '北极雪屿')}
            {this.field('品牌副标', 'bjxy_brand_slogan', '室内滑雪 · 全国连锁')}
            {this.fileField('Logo 图片', 'bjxy_brand_logo_url', 'logo.svg / png (走 ziven-core COS)')}
            {this.field('ELITE 文字', 'bjxy_elite_text', 'ELITE')}
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">🏔 Hero 区域</div>
          <div class="BjxySection-body">
            {this.field('主标题', 'bjxy_hero_title', '探索极致的滑雪体验。')}
            {this.field('副标题', 'bjxy_hero_subtitle', '专注滑雪领域的全国连锁机构...')}
            {this.fileField('浅色模式 banner', 'bjxy_hero_banner_light', '1920×600 推荐')}
            {this.fileField('深色模式 banner', 'bjxy_hero_banner_dark', '1920×600 推荐')}
            {this.field('CTA 文字', 'bjxy_hero_cta_text', '立即咨询')}
            {this.field('CTA 链接', 'bjxy_hero_cta_link', '#contact')}
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">📖 关于我们</div>
          <div class="BjxySection-body">
            {this.field('小标题', 'bjxy_about_sub', 'ABOUT US')}
            {this.field('主标题', 'bjxy_about_title', '关于北极雪屿')}
            {this.textareaField('描述', 'bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年...')}
            {this.field('数据 1 - 数字', 'bjxy_about_stat_1_num', '10+')}
            {this.field('数据 1 - 标签', 'bjxy_about_stat_1_label', '年教学经验')}
            {this.field('数据 2 - 数字', 'bjxy_about_stat_2_num', '50+')}
            {this.field('数据 2 - 标签', 'bjxy_about_stat_2_label', '专业教练')}
            {this.field('数据 3 - 数字', 'bjxy_about_stat_3_num', '1000+')}
            {this.field('数据 3 - 标签', 'bjxy_about_stat_3_label', '毕业学员')}
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">✨ 办学特色 (6 个卡片)</div>
          <div class="BjxySection-body">
            <div class="BjxyField-label">特色卡片</div>
            <div class="BjxyField-array">
              {this.features.map((f, i) => (
                <div class="BjxyField-array-row">
                  <div class="ic-mini">{f.icon || '★'}</div>
                  <input value={f.title} oninput={(e) => { f.title = e.target.value; }} />
                  <input value={f.icon} oninput={(e) => { f.icon = e.target.value; }} />
                  <input value={f.desc} oninput={(e) => { f.desc = e.target.value; }} />
                  <button class="del" onclick={() => { this.features.splice(i, 1); m.redraw(); }}>×</button>
                </div>
              ))}
              <div class="BjxyField-array-add" onclick={() => { this.features.push({ icon: '★', title: '新特色', desc: '' }); m.redraw(); }}>+ 添加特色</div>
            </div>
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">📚 教学体系 (单板 8 + 双板 9)</div>
          <div class="BjxySection-body">
            <div class="BjxyField-label">单板 ({this.single.length} 级)</div>
            <div class="BjxyField-array">
              {this.single.map((l, i) => (
                <div class="BjxyField-array-row">
                  <div class="ic-mini">{i + 1}</div>
                  <input value={l.level} oninput={(e) => { l.level = e.target.value; }} />
                  <input value={l.name} oninput={(e) => { l.name = e.target.value; }} />
                  <input value={l.desc} oninput={(e) => { l.desc = e.target.value; }} />
                  <button class="del" onclick={() => { this.single.splice(i, 1); m.redraw(); }}>×</button>
                </div>
              ))}
            </div>
            <div class="BjxyField-label">双板 ({this.double.length} 级)</div>
            <div class="BjxyField-array">
              {this.double.map((l, i) => (
                <div class="BjxyField-array-row">
                  <div class="ic-mini">{i + 1}</div>
                  <input value={l.level} oninput={(e) => { l.level = e.target.value; }} />
                  <input value={l.name} oninput={(e) => { l.name = e.target.value; }} />
                  <input value={l.desc} oninput={(e) => { l.desc = e.target.value; }} />
                  <button class="del" onclick={() => { this.double.splice(i, 1); m.redraw(); }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">👥 教练展示</div>
          <div class="BjxySection-body">
            <div class="BjxyField-label">选择用户组 (多选)</div>
            <div class="BjxyField-group-select">
              {this.allGroups.length === 0 && <div class="BjxyField-hint">加载中...</div>}
              {this.allGroups.map(g => (
                <div class={'opt' + (this.coachGroupIds.indexOf(g.id) >= 0 ? ' on' : '')}
                     onclick={() => this.toggleGroup(g.id)}>
                  <span class="ck">{this.coachGroupIds.indexOf(g.id) >= 0 ? '✓' : ''}</span>
                  {g.nameSingular} ({g.userCount || 0} 人)
                </div>
              ))}
              <div class="BjxyField-group-pick" onclick={() => this.openGroupModal()}>🎯 弹 modal 选用户组 (v0.1.1)</div>
              <div class="BjxyField-hint">💡 选中用户组内的所有用户将作为教练展示. 拖拽排序 + 弹 modal 在 v0.1.1.</div>
            </div>
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">💬 学员评价 (HTML 自由区)</div>
          <div class="BjxySection-body">
            <div class="BjxyField-label" style="padding-top: 0;">HTML 自由区</div>
            <textarea
              class="BjxyField-textarea"
              style="min-height: 120px; grid-column: 2;"
              value={this.data.bjxy_reviews_html || ''}
              placeholder="&lt;div class=&quot;review&quot;&gt;评价卡片...&lt;/div&gt;"
              oninput={(e) => { this.data.bjxy_reviews_html = e.target.value; }}
            />
            <div class="BjxyField-hint" style="grid-column: 2;">💡 自由布局: 卡片 / 轮播 / 视频 / 嵌入第三方评论, 任意 HTML</div>
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">📸 学员展示</div>
          <div class="BjxySection-body">
            <div class="BjxyField-label" style="padding-top: 0;">HTML 自由区 (瀑布流 / 时间线 / 视频集)</div>
            <textarea
              class="BjxyField-textarea"
              style="min-height: 80px; grid-column: 2;"
              value={this.data.bjxy_students_html || ''}
              placeholder="&lt;div class=&quot;student-grid&quot;&gt;...&lt;/div&gt;"
              oninput={(e) => { this.data.bjxy_students_html = e.target.value; }}
            />
            <div class="BjxyField-hint" style="grid-column: 2;">💡 也可以用下面的简化 JSON: [&#123;image:url, name:王同学&#125;]</div>
            <div class="BjxyField-label">学员 JSON (简单版)</div>
            <textarea
              class="BjxyField-textarea"
              style="min-height: 60px; grid-column: 2;"
              value={this.data.bjxy_students_json || ''}
              placeholder='[{"name":"王同学 · 初级毕业"}, ...]'
              oninput={(e) => { this.data.bjxy_students_json = e.target.value; }}
            />
          </div>
        </div>

        <div class="BjxySection">
          <div class="BjxySection-head">📞 联系我们</div>
          <div class="BjxySection-body">
            {this.field('地址', 'bjxy_contact_address', '北京市朝阳区滑雪场路 88 号')}
            {this.field('电话', 'bjxy_contact_phone', '400-888-8888')}
            {this.field('微信', 'bjxy_contact_wechat', 'bjxy_ski')}
            {this.field('邮箱', 'bjxy_contact_email', 'hi@bjxy.com')}
          </div>
        </div>

        <div class="BjxySavebar">
          <button class="btn-secondary" onclick={() => m.redraw()}>取消</button>
          <button class="btn-primary" onclick={() => this.save()} disabled={this.saving}>
            {this.saving ? '保存中...' : '保存全部'}
          </button>
        </div>
      </div>
    );
  }

  field(label, key, defaultValue) {
    return [
      <div class="BjxyField-label">{label}</div>,
      <input
        class="BjxyField-input"
        value={this.data[key] || ''}
        placeholder={defaultValue}
        oninput={(e) => { this.data[key] = e.target.value; }}
      />,
    ];
  }

  textareaField(label, key, defaultValue) {
    return [
      <div class="BjxyField-label">{label}</div>,
      <textarea
        class="BjxyField-textarea"
        value={this.data[key] || ''}
        placeholder={defaultValue}
        oninput={(e) => { this.data[key] = e.target.value; }}
      />,
    ];
  }

  fileField(label, key, hint) {
    const url = this.data[key] || '';
    return [
      <div class="BjxyField-label">{label}</div>,
      <div>
        <div class="BjxyField-file" onclick={(e) => this.uploadFile(e, key)}>
          📷 点击上传 ({hint})
        </div>
        {url && (
          <div class="BjxyField-file-preview">
            ✓ 已上传: {url}
            {(key.indexOf('banner') >= 0 || key.indexOf('logo') >= 0 || key.indexOf('image') >= 0) && (
              <div><img src={url} alt="" /></div>
            )}
          </div>
        )}
      </div>,
    ];
  }

  async oncreate(vnode) {
    try {
      const data = await m.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/bjxy/settings',
      });
      this.data = data.settings || {};
      if (this.data.bjxy_features_json) {
        try { this.features = JSON.parse(this.data.bjxy_features_json); } catch (e) {}
      }
      if (this.data.bjxy_curriculum_single_json) {
        try { this.single = JSON.parse(this.data.bjxy_curriculum_single_json); } catch (e) {}
      }
      if (this.data.bjxy_curriculum_double_json) {
        try { this.double = JSON.parse(this.data.bjxy_curriculum_double_json); } catch (e) {}
      }
      if (this.data.bjxy_coach_group_ids) {
        try { this.coachGroupIds = JSON.parse(this.data.bjxy_coach_group_ids); } catch (e) {}
      }
      const grpData = await m.request({
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

  openGroupModal() {
    app.modal.show({ title: '选择用户组 (v0.1.1)', content: '弹 modal 选用户组 + 拖拽排序在 v0.1.1 实现' });
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
        const r = await m.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/bjxy/upload',
          body: form,
          headers: { 'Content-Type': null },
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
    payload.bjxy_curriculum_single_json = JSON.stringify(this.single);
    payload.bjxy_curriculum_double_json = JSON.stringify(this.double);
    payload.bjxy_coach_group_ids = JSON.stringify(this.coachGroupIds);
    try {
      await m.request({
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
