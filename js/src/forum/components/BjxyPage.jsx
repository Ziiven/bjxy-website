// BjxyPage.jsx — /bjxy 页面 8 section 完整渲染
// v0.1.0i 修: 之前 class 命名跟 less/forum.less 不一致, 全部 grid / card / hover styles 没生效
//   改成跟 less 对齐的命名: .bjxy-section / .bjxy-feature / .bjxy-stat / .bjxy-coach
//   .bjxy-curri-tabs / .bjxy-curri-tab / .bjxy-level-card / .bjxy-section .bjxy-sub
// 8 section settings 走 app.forum.attribute('bjxy_*') (SOP 56)
// 17 级 + 6 特色 走 app.data.bjxyCurriculum / bjxyFeatures (vendor custom payload)
import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';

const DEFAULT_BRAND = '北极雪屿';
const DEFAULT_SLOGAN = '室内滑雪 · 全国连锁';
const DEFAULT_ELITE = 'ELITE';

export default class BjxyPage extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.coaches = [];
    this.loadingCoaches = true;
    this.activeBoard = 'single';
  }

  view() {
    const s = (key, fallback) => app.forum.attribute(key) || fallback;
    const curriculum = (app.data && app.data.bjxyCurriculum) || { single: [], double: [] };
    const features = (app.data && app.data.bjxyFeatures) || [];
    const reviewsHtml = s('bjxy_reviews_html', '');
    const studentsHtml = s('bjxy_students_html', '');

    return [
      // v0.1.0j: 注入渐变背景 CSS (4 个颜色 settings 拼成 linear-gradient)
      // 浅色 / 深色模式分别走 [data-theme^="dark"] selector
      m('style', {
        oncreate: ({ dom }) => {
          const ls = s('bjxy_bg_gradient_light_start', '#E0EBF8') || '#E0EBF8';
          const le = s('bjxy_bg_gradient_light_end', '#F7FAFC') || '#F7FAFC';
          const ds = s('bjxy_bg_gradient_dark_start', '#0F1419') || '#0F1419';
          const de = s('bjxy_bg_gradient_dark_end', '#1A202C') || '#1A202C';
          dom.textContent = `
.bjxy-page { background: linear-gradient(135deg, ${ls}, ${le}); }
[data-theme^="dark"] .bjxy-page { background: linear-gradient(135deg, ${ds}, ${de}); }
`;
        },
      }),
      m('div', { class: 'bjxy-page' }, [
      // ===== 公告条 =====
      m('div', { class: 'bjxy-announce' }, [
        m('span', { class: 'bjxy-announce-badge' }, '🏔 ' + s('bjxy_elite_text', DEFAULT_ELITE)),
        m('span', null, s('bjxy_brand_slogan', DEFAULT_SLOGAN) + ' · 17 级教学体系 · 6 大特色'),
        m('a', { href: '#contact', class: 'bjxy-announce-link' }, '📞 立即咨询'),
        m('span', { class: 'bjxy-announce-arrow' }, '→'),
      ]),

      // ===== 导航 =====
      m('nav', { class: 'bjxy-nav' }, [
        m('div', { class: 'bjxy-logo' }, [
          s('bjxy_brand_logo_url')
            ? m('img', { class: 'bjxy-logo-img', src: s('bjxy_brand_logo_url'), alt: s('bjxy_brand_name', DEFAULT_BRAND) })
            : m('div', { class: 'bjxy-logo-fallback' }, (s('bjxy_brand_name', DEFAULT_BRAND) || 'BJ').substring(0, 2)),
          m('div', { class: 'bjxy-logo-slogan' }, [
            m('div', null, s('bjxy_brand_name', DEFAULT_BRAND)),
            m('small', null, s('bjxy_brand_slogan', DEFAULT_SLOGAN)),
          ]),
        ]),
        m('div', { class: 'bjxy-nav-links' }, [
          m('a', { href: '#about' }, '关于'),
          m('a', { href: '#features' }, '特色'),
          m('a', { href: '#curriculum' }, '教学'),
          m('a', { href: '#coaches' }, '教练'),
          m('a', { href: '#reviews' }, '评价'),
          m('a', { href: '#contact' }, '联系'),
        ]),
        m('div', { class: 'bjxy-nav-right' }, [
          m('a', { href: '#contact', class: 'bjxy-btn bjxy-btn-primary' }, s('bjxy_hero_cta_text', '立即咨询')),
        ]),
      ]),

      // ===== Hero =====
      m('section', { class: 'bjxy-hero', id: 'hero' }, [
        m('div', { class: 'bjxy-hero-text' }, [
          m('h1', null, [
            s('bjxy_hero_title', '探索极致的滑雪体验。'),
          ]),
          m('p', null, s('bjxy_hero_subtitle', '专注滑雪领域的全国连锁机构, 17 级渐进教学体系 + 认证教练 + 全国品牌机构。')),
          m('div', { class: 'bjxy-hero-cta-row' }, [
            m('a', { href: s('bjxy_hero_cta_link', '#contact'), class: 'bjxy-btn bjxy-btn-primary' }, s('bjxy_hero_cta_text', '立即咨询')),
          ]),
          m('div', { class: 'bjxy-hero-features' }, [
            m('div', { class: 'bjxy-hero-feature' }, [m('span', { class: 'check' }, '✓'), m('strong', null, s('bjxy_about_stat_1_num', '10+')), ' ' + s('bjxy_about_stat_1_label', '年教学经验')]),
            m('div', { class: 'bjxy-hero-feature' }, [m('span', { class: 'check' }, '✓'), m('strong', null, s('bjxy_about_stat_2_num', '50+')), ' ' + s('bjxy_about_stat_2_label', '专业教练')]),
            m('div', { class: 'bjxy-hero-feature' }, [m('span', { class: 'check' }, '✓'), m('strong', null, s('bjxy_about_stat_3_num', '1000+')), ' ' + s('bjxy_about_stat_3_label', '毕业学员')]),
          ]),
        ]),
        m('div', { class: 'bjxy-hero-banner' }, [
          s('bjxy_hero_banner_light') ? m('img', { src: s('bjxy_hero_banner_light'), alt: 'Hero' }) : null,
          s('bjxy_hero_banner_dark') ? m('img', { src: s('bjxy_hero_banner_dark'), alt: 'Hero Dark' }) : null,
        ]),
      ]),

      // ===== 关于 =====
      m('section', { class: 'bjxy-section', id: 'about' }, [
        m('div', { class: 'bjxy-sub' }, s('bjxy_about_sub', 'ABOUT US')),
        m('h2', null, s('bjxy_about_title', '关于北极雪屿')),
        m('p', null, s('bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年, 专注滑雪领域的全国连锁机构...')),
        m('div', { class: 'bjxy-stats' }, [
          m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_1_num', '10+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_1_label', '年教学经验'))]),
          m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_2_num', '50+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_2_label', '专业教练'))]),
          m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_3_num', '1000+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_3_label', '毕业学员'))]),
        ]),
      ]),

      // ===== 特色 =====
      m('section', { class: 'bjxy-section bjxy-section-alt', id: 'features' }, [
        m('div', { class: 'bjxy-sub' }, 'FEATURES'),
        m('h2', null, '办学特色'),
        m('div', { class: 'bjxy-feature-grid' }, features.map((f, i) => m('div', { class: 'bjxy-feature', key: 'f' + i }, [
          m('div', { class: 'bjxy-feature-icon' }, f.icon || '★'),
          m('h3', null, f.title || ''),
          m('p', null, f.desc || ''),
        ]))),
      ]),

      // ===== 教学体系 =====
      m('section', { class: 'bjxy-section', id: 'curriculum' }, [
        m('div', { class: 'bjxy-sub' }, 'CURRICULUM'),
        m('h2', null, '17 级教学体系'),
        m('div', { class: 'bjxy-curri-tabs' }, [
          m('div', {
            class: 'bjxy-curri-tab' + (this.activeBoard === 'single' ? ' active' : ''),
            onclick: () => { this.activeBoard = 'single'; },
          }, '单板 (' + (curriculum.single ? curriculum.single.length : 0) + ' 级)'),
          m('div', {
            class: 'bjxy-curri-tab' + (this.activeBoard === 'double' ? ' active' : ''),
            onclick: () => { this.activeBoard = 'double'; },
          }, '双板 (' + (curriculum.double ? curriculum.double.length : 0) + ' 级)'),
        ]),
        m('div', { class: 'bjxy-curri-list' },
          (this.activeBoard === 'single' ? curriculum.single : curriculum.double || []).map((l, i) => m('div', { class: 'bjxy-level-card', key: 'c' + i }, [
            m('div', { class: 'bjxy-level-num' }, i + 1),
            m('div', { class: 'bjxy-level-lvl' }, l.level || ''),
            m('div', { class: 'bjxy-level-name' }, l.name || ''),
            m('div', { class: 'bjxy-level-desc' }, l.desc || ''),
          ]))
        ),
      ]),

      // ===== 教练 =====
      m('section', { class: 'bjxy-section bjxy-section-alt', id: 'coaches' }, [
        m('div', { class: 'bjxy-sub' }, 'COACHES'),
        m('h2', null, '专业教练'),
        this.loadingCoaches
          ? m('p', null, '加载中...')
          : this.coaches.length === 0
            ? m('p', null, '（暂无教练, 请在后台选择用户组）')
            : m('div', { class: 'bjxy-coach-grid' }, this.coaches.map((c, i) => m('div', { class: 'bjxy-coach', key: 'c' + i }, [
                m('div', { class: 'bjxy-coach-avatar' }, [
                  c.avatarUrl ? m('img', { src: c.avatarUrl, alt: c.displayName }) : (c.displayName || '?').charAt(0),
                ]),
                m('div', { class: 'bjxy-coach-name' }, c.displayName || ''),
                c.title ? m('div', { class: 'bjxy-coach-title' }, c.title) : null,
              ]))),
      ]),

      // ===== 评价 (HTML 自由区) =====
      m('section', { class: 'bjxy-section', id: 'reviews' }, [
        m('div', { class: 'bjxy-sub' }, 'REVIEWS'),
        m('h2', null, '学员评价'),
        reviewsHtml
          ? m('div', { class: 'bjxy-reviews-html', oncreate: ({ dom }) => { dom.innerHTML = reviewsHtml; } })
          : m('p', null, '（暂无评价, 在后台 HTML 自由区添加）'),
      ]),

      // ===== 学员展示 (HTML 自由区) =====
      m('section', { class: 'bjxy-section bjxy-section-alt', id: 'students' }, [
        m('div', { class: 'bjxy-sub' }, 'STUDENTS'),
        m('h2', null, '学员展示'),
        studentsHtml
          ? m('div', { class: 'bjxy-student-grid', oncreate: ({ dom }) => { dom.innerHTML = studentsHtml; } })
          : m('p', null, '（暂无学员展示, 在后台 HTML 自由区添加）'),
      ]),

      // ===== 联系 =====
      m('section', { class: 'bjxy-section', id: 'contact' }, [
        m('div', { class: 'bjxy-sub' }, 'CONTACT'),
        m('h2', null, '联系我们'),
        m('div', { class: 'bjxy-contact-grid' }, [
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '📍 地址'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_address', '北京市朝阳区滑雪场路 88 号'))]),
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '📞 电话'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_phone', '400-888-8888'))]),
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '💬 微信'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_wechat', 'bjxy_ski'))]),
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '✉ 邮箱'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_email', 'hi@bjxy.com'))]),
        ]),
      ]),

      // ===== footer =====
      m('footer', { class: 'bjxy-footer' }, [
        m('span', null, '© ' + new Date().getFullYear() + ' ' + s('bjxy_brand_name', DEFAULT_BRAND) + ' · ICP 备 2026xxxxxx 号'),
      ]),
      ]),
    ];
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
      this.loadingCoaches = false;
      m.redraw();
    }).catch(err => {
      console.error('bjxy load coaches failed', err);
      this.loadingCoaches = false;
      m.redraw();
    });
  }
}
