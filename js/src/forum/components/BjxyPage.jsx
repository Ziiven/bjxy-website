// BjxyPage.jsx — /bjxy 页面 (10 section + 浅深双版)
import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
// mithril 走 vendor 注入的 global m (zct 同款, 不 import)

const DEFAULT_BRAND = '北极雪屿';
const DEFAULT_SLOGAN = '室内滑雪 · 全国连锁';
const DEFAULT_ELITE = 'ELITE';

export default class BjxyPage extends Component {
  init() {
    this.coaches = [];
    this.activeTab = 'single';
  }

  view() {
    const s = app.forum.attribute.bind(app.forum);

    const brandName = s('bjxy_brand_name') || DEFAULT_BRAND;
    const brandSlogan = s('bjxy_brand_slogan') || DEFAULT_SLOGAN;
    const brandLogo = s('bjxy_brand_logo_url');
    const eliteText = s('bjxy_elite_text') || DEFAULT_ELITE;

    const heroTitle = s('bjxy_hero_title') || '探索极致的滑雪体验。';
    const heroSubtitle = s('bjxy_hero_subtitle') || '专注滑雪领域的全国连锁机构, 为儿童、青少年及成人提供滑雪全方位服务。';
    const heroBannerLight = s('bjxy_hero_banner_light');
    const heroBannerDark = s('bjxy_hero_banner_dark');
    const heroCtaText = s('bjxy_hero_cta_text') || '立即咨询';
    const heroCtaLink = s('bjxy_hero_cta_link') || '#contact';

    const aboutTitle = s('bjxy_about_title') || '关于北极雪屿';
    const aboutSub = s('bjxy_about_sub') || 'ABOUT US';
    const aboutDesc = s('bjxy_about_desc') || '北极雪屿室内滑雪成立于 2024 年, 是专注滑雪领域的全国连锁机构。';
    const aboutStats = [
      { num: s('bjxy_about_stat_1_num') || '10+', label: s('bjxy_about_stat_1_label') || '年教学经验' },
      { num: s('bjxy_about_stat_2_num') || '50+', label: s('bjxy_about_stat_2_label') || '专业教练' },
      { num: s('bjxy_about_stat_3_num') || '1000+', label: s('bjxy_about_stat_3_label') || '毕业学员' },
    ];

    let features = app.forum.attribute('bjxyFeatures') || [
      { icon: '🏂', title: '室内滑雪高效', desc: '一年四季恒温环境' },
      { icon: '🛡️', title: '安全专业教练', desc: '认证教练全程指导' },
      { icon: '📚', title: '滑雪教学', desc: '自主研发课程体系' },
      { icon: '🎿', title: '雪具护具免费', desc: '全套装备免费使用' },
      { icon: '🌐', title: '全国品牌机构', desc: '连锁品牌, 标准化' },
      { icon: '🏔️', title: '学玩用赛', desc: '全生态滑雪服务' },
    ];
    try {
      const fj = s('bjxy_features_json');
      if (fj) features = JSON.parse(fj);
    } catch (e) {}

    const curriculum = app.forum.attribute('bjxyCurriculum') || { single: [], double: [] };
    const activeLevels = this.activeTab === 'single' ? curriculum.single : curriculum.double;

    const reviewsHtml = s('bjxy_reviews_html') || '';
    const studentsHtml = s('bjxy_students_html') || '';

    let students = [
      { name: '王同学 · 初级毕业' }, { name: '李同学 · 中级毕业' },
      { name: '张同学 · 高级毕业' }, { name: '陈同学 · 自由式' },
      { name: '刘同学 · 进阶' }, { name: '赵同学 · 入门' },
    ];
    try {
      const sj = s('bjxy_students_json');
      if (sj) students = JSON.parse(sj);
    } catch (e) {}

    const contact = {
      address: s('bjxy_contact_address') || '北京市朝阳区滑雪场路 88 号',
      phone: s('bjxy_contact_phone') || '400-888-8888',
      wechat: s('bjxy_contact_wechat') || 'bjxy_ski',
      email: s('bjxy_contact_email') || 'hi@bjxy.com',
    };

    return (
      <div class="bjxy-page">
        <div class="bjxy-announce">
          <span class="bjxy-announce-badge">What's new</span>
          <span>
            北极雪屿 2024 暑期招生开启
            <a href="#features" class="bjxy-announce-link">查看课程详情</a>
          </span>
          <span class="bjxy-announce-arrow">→</span>
        </div>

        <nav class="bjxy-nav">
          <a href="/bjxy" class="bjxy-logo">
            {brandLogo ? (
              <img class="bjxy-logo-img" src={brandLogo} alt={brandName} />
            ) : (
              <span class="bjxy-logo-fallback">{(brandName || '北').charAt(0)}</span>
            )}
            <span>{brandName}</span>
            <span class="bjxy-logo-slogan">{brandSlogan}</span>
          </a>
          <div class="bjxy-nav-links">
            <a href="#hero">首页</a>
            <a href="#about">介绍</a>
            <a href="#features">课程</a>
            <a href="#curriculum">教学体系</a>
            <a href="#coaches">教练</a>
            <a href="#contact">联系</a>
          </div>
          <div class="bjxy-nav-right">
            <button class="bjxy-theme-toggle" onclick={() => this.toggleTheme()}>
              {app.forum.attribute('themeDark') ? '☀️' : '🌙'}
            </button>
            <a href={heroCtaLink} class="bjxy-btn bjxy-btn-primary">{heroCtaText} →</a>
          </div>
        </nav>

        <section id="hero" class="bjxy-hero">
          <div class="bjxy-hero-text">
            <h1>
              {heroTitle.split('。')[0]}
              {heroTitle.includes('。') && <span class="bjxy-accent">。</span>}
            </h1>
            <p>{heroSubtitle}</p>
            <div class="bjxy-hero-cta-row">
              <a href={heroCtaLink} class="bjxy-btn bjxy-btn-primary">{heroCtaText} →</a>
              <a href="#curriculum" class="bjxy-btn bjxy-btn-outline">🎿 查看教学体系</a>
            </div>
            <div class="bjxy-hero-features">
              {aboutStats.map(st => (
                <div class="bjxy-hero-feature">
                  <span class="check">✓</span>
                  <strong>{st.num}</strong> {st.label}
                </div>
              ))}
            </div>
          </div>
          <div class="bjxy-hero-banner">
            {heroBannerLight && <img class="bjxy-hero-banner-light" src={heroBannerLight} alt="" />}
            {heroBannerDark && <img class="bjxy-hero-banner-dark" src={heroBannerDark} alt="" />}
            {(!heroBannerLight && !heroBannerDark) && (
              <div class="bjxy-hero-banner-fallback">⛷️ {brandName} · {brandSlogan}</div>
            )}
          </div>
        </section>

        <section id="about" class="bjxy-section">
          <h2>{aboutTitle}</h2>
          <p class="bjxy-sub">{aboutSub}</p>
          <p>{aboutDesc}</p>
          <div class="bjxy-stats">
            {aboutStats.map(st => (
              <div class="bjxy-stat">
                <div class="bjxy-stat-num">{st.num}</div>
                <div class="bjxy-stat-label">{st.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" class="bjxy-section bjxy-section-alt">
          <h2>办学特色</h2>
          <p class="bjxy-sub">FEATURES · 6 大优势</p>
          <div class="bjxy-feature-grid">
            {features.map(f => (
              <div class="bjxy-feature">
                <div class="bjxy-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="curriculum" class="bjxy-section">
          <h2>教学体系</h2>
          <p class="bjxy-sub">CURRICULUM · 单板 {curriculum.single.length} 级 / 双板 {curriculum.double.length} 级</p>
          <div class="bjxy-curri-tabs">
            <button
              class={'bjxy-curri-tab' + (this.activeTab === 'single' ? ' active' : '')}
              onclick={() => { this.activeTab = 'single'; m.redraw(); }}
            >🎿 单板等级</button>
            <button
              class={'bjxy-curri-tab' + (this.activeTab === 'double' ? ' active' : '')}
              onclick={() => { this.activeTab = 'double'; m.redraw(); }}
            >⛷ 双板等级</button>
          </div>
          <div class="bjxy-curri-list">
            {activeLevels.map((l, i) => (
              <div class="bjxy-level-card">
                <div class="bjxy-level-num">{i + 1}</div>
                <div class="bjxy-level-lvl">{l.level}</div>
                <div class="bjxy-level-name">{l.name}</div>
                <div class="bjxy-level-desc">{l.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="coaches" class="bjxy-section bjxy-section-alt">
          <h2>专业教练</h2>
          <p class="bjxy-sub">COACHES · 点击查看详情</p>
          <div class="bjxy-coach-grid" id="bjxy-coach-grid">
            {this.coaches.length === 0 && (
              <div style="grid-column: 1/-1; text-align: center; padding: 32px; color: var(--bjxy-text-mute);">
                暂无教练, 请管理员在后台选择教练组
              </div>
            )}
            {this.coaches.map(c => (
              <div class="bjxy-coach" onclick={() => this.openCoachModal(c)}>
                <div class="bjxy-coach-avatar">
                  {c.avatarUrl ? <img src={c.avatarUrl} alt={c.displayName} /> : (c.displayName || c.username || '?').charAt(0)}
                </div>
                <div class="bjxy-coach-name">{c.displayName || c.username}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" class="bjxy-section">
          <h2>学员评价</h2>
          <p class="bjxy-sub">TESTIMONIALS · 真实学员反馈</p>
          <div class="bjxy-reviews-html" innerHTML={reviewsHtml} />
        </section>

        <section id="students" class="bjxy-section bjxy-section-alt">
          <h2>学员展示</h2>
          <p class="bjxy-sub">STUDENTS · 学员风采</p>
          {studentsHtml ? (
            <div class="bjxy-reviews-html" innerHTML={studentsHtml} />
          ) : (
            <div class="bjxy-student-grid">
              {students.map(s => (
                <div class="bjxy-student">
                  {s.image && <img src={s.image} alt={s.name} />}
                  <div class="bjxy-student-label">{s.name}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="contact" class="bjxy-section">
          <h2>联系我们</h2>
          <p class="bjxy-sub">CONTACT · 4 种联系方式</p>
          <div class="bjxy-contact-grid">
            <div class="bjxy-contact-item">
              <div class="bjxy-contact-label">地址</div>
              <div class="bjxy-contact-value">{contact.address}</div>
            </div>
            <div class="bjxy-contact-item">
              <div class="bjxy-contact-label">电话</div>
              <div class="bjxy-contact-value">{contact.phone}</div>
            </div>
            <div class="bjxy-contact-item">
              <div class="bjxy-contact-label">微信</div>
              <div class="bjxy-contact-value">{contact.wechat}</div>
            </div>
            <div class="bjxy-contact-item">
              <div class="bjxy-contact-label">邮箱</div>
              <div class="bjxy-contact-value">{contact.email}</div>
            </div>
          </div>
        </section>

        <footer class="bjxy-footer">
          © 2026 {brandName} · 京 ICP 备 2026xxxxxx 号 · Powered by Flarum
        </footer>
      </div>
    );
  }

  oncreate(vnode) {
    this.loadCoaches();
  }

  loadCoaches() {
    m.request({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/bjxy/coaches',
    }).then(data => {
      this.coaches = data.coaches || [];
      m.redraw();
    }).catch(err => {
      console.error('bjxy load coaches failed', err);
    });
  }

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur.startsWith('dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    app.forum.attribute('themeDark', next === 'dark');
    m.redraw();
  }

  openCoachModal(coach) {
    app.modal.show(app.bjxyCoachModal, { coach });
  }
}
