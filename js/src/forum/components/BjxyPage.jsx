// BjxyPage.jsx — /bjxy 页面 8 section 完整渲染
// v0.1.0h 修: 之前是占位版 (h1 + p), 现在按 SOP 56 真正渲染 8 section:
//   - 8 section settings (bjxy_brand_name 等) 走 app.forum.attribute('bjxy_*')
//   - 17 级 + 6 特色 (bjxyCurriculum / bjxyFeatures) 走 app.data.* (vendor custom payload)
//   - 评价 / 学员展示 走 HTML 自由区 settings (bjxy_reviews_html / bjxy_students_html)
//   - 教练走 /api/bjxy/coaches 公共 API
// mithril 走 vendor 注入的 global m (zct 同款, 不 import)
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
    this.activeBoard = 'single';  // 教学体系 single/double 切换
  }

  view() {
    const s = (key, fallback) => app.forum.attribute(key) || fallback;
    const curriculum = (app.data && app.data.bjxyCurriculum) || { single: [], double: [] };
    const features = (app.data && app.data.bjxyFeatures) || [];
    const reviewsHtml = s('bjxy_reviews_html', '');
    const studentsHtml = s('bjxy_students_html', '');

    return m('div', { class: 'bjxy-page' }, [
      // Section 1: 公告条
      m('div', { class: 'bjxy-announce' }, [
        m('div', { class: 'bjxy-container' }, [
          m('span', { class: 'bjxy-announce-badge' }, '🏔 ' + s('bjxy_elite_text', DEFAULT_ELITE)),
          m('span', null, s('bjxy_brand_slogan', DEFAULT_SLOGAN) + ' · 17 级教学体系 · 6 大特色'),
          m('a', { href: '#contact', class: 'bjxy-announce-link' }, '📞 立即咨询'),
        ]),
      ]),

      // Section 2: 导航
      m('nav', { class: 'bjxy-nav' }, [
        m('div', { class: 'bjxy-container bjxy-nav-inner' }, [
          m('a', { href: '#hero', class: 'bjxy-nav-brand' }, [
            s('bjxy_brand_logo_url') ? m('img', { src: s('bjxy_brand_logo_url'), alt: s('bjxy_brand_name', DEFAULT_BRAND) }) : null,
            m('span', null, s('bjxy_brand_name', DEFAULT_BRAND)),
          ]),
          m('div', { class: 'bjxy-nav-links' }, [
            m('a', { href: '#hero' }, '首页'),
            m('a', { href: '#about' }, '关于'),
            m('a', { href: '#features' }, '特色'),
            m('a', { href: '#curriculum' }, '教学'),
            m('a', { href: '#coaches' }, '教练'),
            m('a', { href: '#reviews' }, '评价'),
            m('a', { href: '#contact' }, '联系'),
          ]),
        ]),
      ]),

      // Section 3: Hero
      m('section', { class: 'bjxy-hero', id: 'hero' }, [
        m('div', { class: 'bjxy-container bjxy-hero-inner' }, [
          m('div', { class: 'bjxy-hero-text' }, [
            m('h1', { class: 'bjxy-hero-title' }, s('bjxy_hero_title', '探索极致的滑雪体验。')),
            m('p', { class: 'bjxy-hero-subtitle' }, s('bjxy_hero_subtitle', '专注滑雪领域的全国连锁机构, 17 级渐进教学体系 + 认证教练 + 全国品牌机构。')),
            m('a', { class: 'bjxy-hero-cta', href: s('bjxy_hero_cta_link', '#contact') }, s('bjxy_hero_cta_text', '立即咨询')),
          ]),
          (s('bjxy_hero_banner_light') || s('bjxy_hero_banner_dark')) ? m('div', { class: 'bjxy-hero-image' }, [
            s('bjxy_hero_banner_light') ? m('img', { src: s('bjxy_hero_banner_light'), class: 'bjxy-hero-banner-light', alt: 'Hero' }) : null,
            s('bjxy_hero_banner_dark') ? m('img', { src: s('bjxy_hero_banner_dark'), class: 'bjxy-hero-banner-dark', alt: 'Hero' }) : null,
          ]) : null,
        ]),
      ]),

      // Section 4: 关于
      m('section', { class: 'bjxy-about', id: 'about' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, s('bjxy_about_sub', 'ABOUT US')),
          m('h2', { class: 'bjxy-section-title' }, s('bjxy_about_title', '关于北极雪屿')),
          m('p', { class: 'bjxy-about-desc' }, s('bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年, 专注滑雪领域的全国连锁机构...')),
          m('div', { class: 'bjxy-stats' }, [
            this.statCard(s('bjxy_about_stat_1_num', '10+'), s('bjxy_about_stat_1_label', '年教学经验')),
            this.statCard(s('bjxy_about_stat_2_num', '50+'), s('bjxy_about_stat_2_label', '专业教练')),
            this.statCard(s('bjxy_about_stat_3_num', '1000+'), s('bjxy_about_stat_3_label', '毕业学员')),
          ]),
        ]),
      ]),

      // Section 5: 特色
      m('section', { class: 'bjxy-features', id: 'features' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, 'FEATURES'),
          m('h2', { class: 'bjxy-section-title' }, '办学特色'),
          m('div', { class: 'bjxy-feature-grid' }, features.map((f, i) => m('div', { class: 'bjxy-feature-card', key: 'f' + i }, [
            m('div', { class: 'bjxy-feature-icon' }, f.icon || '★'),
            m('h3', null, f.title || ''),
            m('p', null, f.desc || ''),
          ]))),
        ]),
      ]),

      // Section 6: 教学体系
      m('section', { class: 'bjxy-curriculum', id: 'curriculum' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, 'CURRICULUM'),
          m('h2', { class: 'bjxy-section-title' }, '17 级教学体系'),
          m('div', { class: 'bjxy-curriculum-tabs' }, [
            m('button', {
              class: 'bjxy-tab' + (this.activeBoard === 'single' ? ' active' : ''),
              onclick: () => { this.activeBoard = 'single'; },
            }, '单板 (' + (curriculum.single ? curriculum.single.length : 0) + ' 级)'),
            m('button', {
              class: 'bjxy-tab' + (this.activeBoard === 'double' ? ' active' : ''),
              onclick: () => { this.activeBoard = 'double'; },
            }, '双板 (' + (curriculum.double ? curriculum.double.length : 0) + ' 级)'),
          ]),
          m('div', { class: 'bjxy-curriculum-list' },
            (this.activeBoard === 'single' ? curriculum.single : curriculum.double || []).map((l, i) => m('div', { class: 'bjxy-curriculum-item', key: 'c' + i }, [
              m('div', { class: 'bjxy-curriculum-num' }, i + 1),
              m('div', { class: 'bjxy-curriculum-body' }, [
                m('div', { class: 'bjxy-curriculum-level' }, l.level || ''),
                m('div', { class: 'bjxy-curriculum-name' }, l.name || ''),
                m('div', { class: 'bjxy-curriculum-desc' }, l.desc || ''),
              ]),
            ]))
          ),
        ]),
      ]),

      // Section 7: 教练
      m('section', { class: 'bjxy-coaches', id: 'coaches' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, 'COACHES'),
          m('h2', { class: 'bjxy-section-title' }, '专业教练'),
          this.loadingCoaches
            ? m('p', { class: 'bjxy-loading' }, '加载中...')
            : this.coaches.length === 0
              ? m('p', { class: 'bjxy-empty' }, '（暂无教练, 请在后台选择用户组）')
              : m('div', { class: 'bjxy-coach-grid' }, this.coaches.map((c, i) => m('div', { class: 'bjxy-coach-card', key: 'c' + i }, [
                  c.avatarUrl ? m('img', { class: 'bjxy-coach-avatar', src: c.avatarUrl, alt: c.displayName }) : m('div', { class: 'bjxy-coach-avatar-placeholder' }, (c.displayName || '?').charAt(0)),
                  m('div', { class: 'bjxy-coach-name' }, c.displayName || ''),
                  c.bio ? m('div', { class: 'bjxy-coach-bio' }, c.bio) : null,
                ]))),
        ]),
      ]),

      // Section 8: 评价 (HTML 自由区)
      m('section', { class: 'bjxy-reviews', id: 'reviews' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, 'REVIEWS'),
          m('h2', { class: 'bjxy-section-title' }, '学员评价'),
          reviewsHtml
            ? m('div', { class: 'bjxy-html-free', oncreate: ({ dom }) => { dom.innerHTML = reviewsHtml; } })
            : m('p', { class: 'bjxy-empty' }, '（暂无评价, 在后台 HTML 自由区添加）'),
        ]),
      ]),

      // Section 9: 学员展示 (HTML 自由区)
      m('section', { class: 'bjxy-students', id: 'students' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, 'STUDENTS'),
          m('h2', { class: 'bjxy-section-title' }, '学员展示'),
          studentsHtml
            ? m('div', { class: 'bjxy-html-free', oncreate: ({ dom }) => { dom.innerHTML = studentsHtml; } })
            : m('p', { class: 'bjxy-empty' }, '（暂无学员展示, 在后台 HTML 自由区添加）'),
        ]),
      ]),

      // Section 10: 联系
      m('section', { class: 'bjxy-contact', id: 'contact' }, [
        m('div', { class: 'bjxy-container' }, [
          m('div', { class: 'bjxy-section-label' }, 'CONTACT'),
          m('h2', { class: 'bjxy-section-title' }, '联系我们'),
          m('div', { class: 'bjxy-contact-grid' }, [
            this.contactItem('📍', '地址', s('bjxy_contact_address', '北京市朝阳区滑雪场路 88 号')),
            this.contactItem('📞', '电话', s('bjxy_contact_phone', '400-888-8888')),
            this.contactItem('💬', '微信', s('bjxy_contact_wechat', 'bjxy_ski')),
            this.contactItem('✉', '邮箱', s('bjxy_contact_email', 'hi@bjxy.com')),
          ]),
        ]),
      ]),

      // footer
      m('footer', { class: 'bjxy-footer' }, [
        m('div', { class: 'bjxy-container' }, [
          m('span', null, '© ' + new Date().getFullYear() + ' ' + s('bjxy_brand_name', DEFAULT_BRAND) + '. All rights reserved.'),
        ]),
      ]),
    ]);
  }

  statCard(num, label) {
    return m('div', { class: 'bjxy-stat-card' }, [
      m('div', { class: 'bjxy-stat-num' }, num),
      m('div', { class: 'bjxy-stat-label' }, label),
    ]);
  }

  contactItem(icon, label, value) {
    return m('div', { class: 'bjxy-contact-item' }, [
      m('div', { class: 'bjxy-contact-icon' }, icon),
      m('div', null, [
        m('div', { class: 'bjxy-contact-label' }, label),
        m('div', { class: 'bjxy-contact-value' }, value),
      ]),
    ]);
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
