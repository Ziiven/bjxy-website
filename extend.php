<?php

/*
 * This file is part of ziven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 */

namespace Ziiven\BjxyWebsite;

use Flarum\Extend;
use Flarum\Frontend\Document;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ServerRequestInterface;
use Ziiven\BjxyWebsite\Api\Controllers\CreateBookingController;
use Ziiven\BjxyWebsite\Api\Controllers\ListBookingsController;

return [
    // 合并所有 forum frontend 配置到一个 Extend\Frontend 实例 (避免 2 个实例互相覆盖)
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less')
        // Flarum 2.0 page extension: 注册 /bjxy 路由 (跟 ziven-dress-up /dressUp 同模式)
        ->route('/bjxy', 'bjxy.website', function (Document $document, ServerRequestInterface $request) {
            // v0.1.22: /bjxy 路径 HTML <title> 改为品牌名 + 品牌副标 (辉哥 18:38 新需求)
            //   server-side render 直接 set $document->title, Flarum Document L31 字段,
            //   之后 makeTitle() (L210) 自动拼到 HTML <title> 标签. vendor route callback
            //   只在 /bjxy 路径触发, 其他路由不污染
            //   读 bjxy_brand_name / bjxy_brand_slogan setting (跟 '品牌信息' tab 配置联动),
            //   留空时 fallback 到默认 '北极雪屿' + '室内滑雪 · 全国连锁' (跟 BjxyPage.jsx DEFAULT_BRAND 一致)
            /** @var SettingsRepositoryInterface $settings */
            $settings = app(SettingsRepositoryInterface::class);
            $brandName = $settings->get('bjxy_brand_name') ?: '北极雪屿';
            $brandSlogan = $settings->get('bjxy_brand_slogan') ?: '室内滑雪 · 全国连锁';
            $document->title = $brandName . ' · ' . $brandSlogan;
            // v0.2.0h (返工) 新 (辉哥 2026-08-10 19:00 反馈, og meta 微信分享卡):
            //   之前 /bjxy 路由只 set $document->title, 微信爬虫抓到的 og:* 是论坛 default (极客雪域 + ZivenSki 描述)
            //   不是 bjxy 品牌, 微信分享卡显示不专业
            //   改: server-side 拼 6+1 个 meta 标签 push 到 $document->head[] (Flarum Document L101)
            //   vendor Document->makeHead() 末尾 implode("\n", array_merge($head, $this->head)) 把我的 head 拼到 head 末尾
            //   实际 /bjxy 页面 vendor fof-seo 2.0 已 set og:site_name=极客雪域 + og:type=website + twitter:card=summary_large_image
            //   (fof-seo PageListener L198-205), 我再 push og:site_name=brandName 跟 vendor 重复 — HTML spec meta 标签 last wins, 浏览器取我的
            //   字段值:
            //     - og:title / twitter:title = brandName + ' · ' + brandSlogan (跟 $document->title 一致, 但 og:title 不带 vendor 自动拼的 ' - 极客雪域')
            //     - og:description / twitter:description = heroSubtitle (有值时, 跟 Hero 段一致) OR heroTitle fallback
            //     - og:image / twitter:image = brandLogoUrl (有值时, 没值就跳过 image, 微信爬虫会用 page 缺省 image)
            //     - og:url = dynamic request scheme + host + '/bjxy' (跟当前访问 URL 一致, 让微信知道原页面在哪)
            //   XSS 防护: 全部 htmlspecialchars(..., ENT_QUOTES) 包裹, slogan / title 可能含 " / ' (后台 admin 输入)
            $heroSubtitle = $settings->get('bjxy_hero_subtitle') ?: '';
            $heroTitle = $settings->get('bjxy_hero_title') ?: $brandSlogan;
            $brandLogo = $settings->get('bjxy_brand_logo_url') ?: '';
            $ogTitle = $brandName . ' · ' . $brandSlogan;
            $ogDescription = $heroSubtitle ?: $heroTitle;
            // og:url 拼成 scheme://host[:port]/bjxy (跟当前 request 一致, 不带 query string)
            //   包含 port: local MAMP port=8844, prod port=443, 都需要正确带 (port 非 default 80/443 时显式带)
            $ogScheme = $request->getUri()->getScheme();
            $ogHost = $request->getUri()->getHost();
            $ogPort = $request->getUri()->getPort();
            $ogPortPart = ($ogPort && !in_array($ogPort, [80, 443], true)) ? ':' . $ogPort : '';
            $ogUrl = $ogScheme . '://' . $ogHost . $ogPortPart . '/bjxy';
            // 1) og:site_name override (跟 vendor fof-seo setMetaPropertyTag('og:site_name', '极客雪域') 重复)
            //   浏览器 last wins, 取我的 bjxy brandName, 让微信知道这是 bjxy brand site 不是论坛
            $document->head[] = '<meta property="og:site_name" content="' . htmlspecialchars($brandName, ENT_QUOTES) . '">';
            // 2) og:title
            $document->head[] = '<meta property="og:title" content="' . htmlspecialchars($ogTitle, ENT_QUOTES) . '">';
            // 3) og:description
            $document->head[] = '<meta property="og:description" content="' . htmlspecialchars($ogDescription, ENT_QUOTES) . '">';
            // 4) og:url
            $document->head[] = '<meta property="og:url" content="' . htmlspecialchars($ogUrl, ENT_QUOTES) . '">';
            // 5) og:image (有 logo 时才加, 没 logo 跳过让微信爬虫用 page 缺省 image)
            if ($brandLogo) {
                $document->head[] = '<meta property="og:image" content="' . htmlspecialchars($brandLogo, ENT_QUOTES) . '">';
                // 6) twitter:image
                $document->head[] = '<meta name="twitter:image" content="' . htmlspecialchars($brandLogo, ENT_QUOTES) . '">';
            }
            // 7) twitter:title
            $document->head[] = '<meta name="twitter:title" content="' . htmlspecialchars($ogTitle, ENT_QUOTES) . '">';
            // 8) twitter:description
            $document->head[] = '<meta name="twitter:description" content="' . htmlspecialchars($ogDescription, ENT_QUOTES) . '">';
            return $document;
        })
        // v0.1.0r 修: 教学体系 + 特色 从 settings 读用户配置, fallback 用 CurriculumData 默认
        //   之前永远用 hard-coded CurriculumData::getSingleBoard() 等, 即使 admin
        //   POST 保存了 bjxy_curriculum_single_json setting, 前台还是显示 hard-coded 默认
        //   修法: content() callback 通过 app() helper 拿 SettingsRepositoryInterface
        //   (content() 运行时已经 boot 完, container setInstance OK), JSON decode user 设置
        //   不存在或解析失败时 fallback 到 CurriculumData 默认
        // v0.1.0s 改: 教学体系从 {single, double} 重构成 boards array
        //   优先读 bjxy_curriculum_boards_json (新格式), fallback 兼容旧 single/double
        //   都没有时用 CurriculumData 默认 (单板 + 双板)
        ->content(function (Document $document) {
            /** @var SettingsRepositoryInterface $settings */
            $settings = app(SettingsRepositoryInterface::class);

            $decode = function ($key, $default) use ($settings) {
                $raw = $settings->get($key);
                if (!$raw) return $default;
                $decoded = json_decode($raw, true);
                return is_array($decoded) && count($decoded) > 0 ? $decoded : $default;
            };

            $boardsRaw = $settings->get('bjxy_curriculum_boards_json');
            $boards = null;
            if ($boardsRaw) {
                $decoded = json_decode($boardsRaw, true);
                if (is_array($decoded) && count($decoded) > 0) $boards = $decoded;
            }
            if (!$boards) {
                // 兼容旧数据: single/double → boards
                $single = $decode('bjxy_curriculum_single_json', \Ziiven\BjxyWebsite\CurriculumData::getSingleBoard());
                $double = $decode('bjxy_curriculum_double_json', \Ziiven\BjxyWebsite\CurriculumData::getDoubleBoard());
                $boards = [
                    ['name' => '单板', 'levels' => $single],
                    ['name' => '双板', 'levels' => $double],
                ];
            }

            $document->payload['bjxyCurriculum'] = ['boards' => $boards];
            $document->payload['bjxyFeatures'] = $decode('bjxy_features_json', \Ziiven\BjxyWebsite\CurriculumData::getFeatures());
        }),

    // v0.1.0l 修: 把 bjxy_* settings 序列化到 forum API document attributes
    //   之前 BjxyPage 走 app.forum.attribute('bjxy_*') 但 bjxy settings 不在 vendor forum.attributes
    //   (Flarum 2.0 forum API document 只含 core 字段), 永远拿 undefined → fallback
    //   辉哥 21:50 反馈深色模式背景色改了前台没变 → 实际所有 settings 都没生效
    //   修法: 用 vendor Extend\Settings::serializeToForum() 把 bjxy_* 加进 forum.attributes
    //   之后前台 app.forum.attribute('bjxy_*') 就能拿到 (跟走 vendor settings 一样)
    (new Extend\Settings())
        ->serializeToForum('bjxy_brand_name', 'bjxy_brand_name')
        ->serializeToForum('bjxy_brand_slogan', 'bjxy_brand_slogan')
        ->serializeToForum('bjxy_brand_logo_url', 'bjxy_brand_logo_url')
        ->serializeToForum('bjxy_hero_title', 'bjxy_hero_title')
        ->serializeToForum('bjxy_hero_subtitle', 'bjxy_hero_subtitle')
        ->serializeToForum('bjxy_hero_banner_light', 'bjxy_hero_banner_light')
        ->serializeToForum('bjxy_hero_banner_dark', 'bjxy_hero_banner_dark')
        ->serializeToForum('bjxy_hero_cta_text', 'bjxy_hero_cta_text')
        // v0.2.0a 删: bjxy_hero_cta_link serializeToForum (辉哥 9:28 反馈)
        //   CTA 按钮现在弹 BookingModal (jsx <button onclick>), 不读 href 字段
        //   留 settings 表里的已存值不删, 前端不再 serialize 出去, 不会污染 forum.attributes
        ->serializeToForum('bjxy_about_sub', 'bjxy_about_sub')
        ->serializeToForum('bjxy_about_title', 'bjxy_about_title')
        ->serializeToForum('bjxy_about_desc', 'bjxy_about_desc')
        ->serializeToForum('bjxy_about_stat_1_num', 'bjxy_about_stat_1_num')
        ->serializeToForum('bjxy_about_stat_1_label', 'bjxy_about_stat_1_label')
        ->serializeToForum('bjxy_about_stat_2_num', 'bjxy_about_stat_2_num')
        ->serializeToForum('bjxy_about_stat_2_label', 'bjxy_about_stat_2_label')
        ->serializeToForum('bjxy_about_stat_3_num', 'bjxy_about_stat_3_num')
        ->serializeToForum('bjxy_about_stat_3_label', 'bjxy_about_stat_3_label')
        ->serializeToForum('bjxy_contact_address', 'bjxy_contact_address')
        ->serializeToForum('bjxy_contact_phone', 'bjxy_contact_phone')
        ->serializeToForum('bjxy_contact_wechat', 'bjxy_contact_wechat')
        ->serializeToForum('bjxy_contact_email', 'bjxy_contact_email')
        // v0.1.32: 联系我们 section 改造 (辉哥 11:48 反馈)
        //   - 地址 改多地址: bjxy_contact_addresses (JSON array of {value})
        //   - 微信 改多图: bjxy_contact_wechat_images (JSON array of URL)
        //   - 邮箱保留 serializeToForum (前端不用, 后续 V 测反馈再删)
        //   - 旧 bjxy_contact_address / bjxy_contact_wechat 单值保留, 加载时 if 新字段空 then 迁移
        ->serializeToForum('bjxy_contact_addresses', 'bjxy_contact_addresses')
        ->serializeToForum('bjxy_contact_wechat_images', 'bjxy_contact_wechat_images')
        // v0.1.0ab: footer icp 备案号 (后台可设, 前台 footer 渲染)
        ->serializeToForum('bjxy_icp_number', 'bjxy_icp_number')
        // v0.1.2: 公安备案号 + 网安链接 (国家规定中国大陆站点 footer 必须有)
        ->serializeToForum('bjxy_police_number', 'bjxy_police_number')
        ->serializeToForum('bjxy_police_link', 'bjxy_police_link')
        // v0.1.4: 教练 user id 数组 (GroupPickerModal 弹 modal 选 user 后保存, 前台优先用这个列表)
        ->serializeToForum('bjxy_coach_user_ids', 'bjxy_coach_user_ids')
        // v0.1.5: 教练详细内容 (JSON array: [{userId, bio, achievements, specialties, photoUrl}])
        //   key 用 userId 跟 bjxy_coach_user_ids 配对, 前台 CoachesController join 拼一起
        ->serializeToForum('bjxy_coach_details', 'bjxy_coach_details')
        // v0.1.7a 删: bjxy_reviews_html + bjxy_students_html (老的 HTML 自由区字段已废弃)
        //   评价/活动统一走结构化 JSON (bjxy_reviews / bjxy_students)
        // v0.1.6: 评价结构化 (JSON array: [{author, rating, text, date, photoUrl}])
        //   替代老 bjxy_reviews_html (HTML 自由区, 干坏处多: XSS + 不便维护)
        ->serializeToForum('bjxy_reviews', 'bjxy_reviews')
        // v0.1.6: 学员结构化 (JSON array: [{name, level, photoUrl, achievement}])
        //   升级老 bjxy_students_json (简单 JSON, 只有 name 字段)
        ->serializeToForum('bjxy_students', 'bjxy_students')
        // v0.1.6g: 活动展示 swiper 自动轮播间隔 (毫秒, 默认 3000)
        //   后台输入, 前台 swiper.autoplay.delay 用
        ->serializeToForum('bjxy_events_autoplay_ms', 'bjxy_events_autoplay_ms')
        ->serializeToForum('bjxy_bg_gradient_light_start', 'bjxy_bg_gradient_light_start')
        ->serializeToForum('bjxy_bg_gradient_light_end', 'bjxy_bg_gradient_light_end')
        ->serializeToForum('bjxy_bg_gradient_dark_start', 'bjxy_bg_gradient_dark_start')
        ->serializeToForum('bjxy_bg_gradient_dark_end', 'bjxy_bg_gradient_dark_end')
        // v0.1.0z: 背景图 URL (走 ziven-core COS 上传, 设置了图就不显示渐变)
        ->serializeToForum('bjxy_bg_image_light_url', 'bjxy_bg_image_light_url')
        ->serializeToForum('bjxy_bg_image_dark_url', 'bjxy_bg_image_dark_url')
        // v0.1.9 (辉哥 13:06 反馈): 后台 11 tab 拖拽排序, 前台 8 主体 section 按这个顺序渲染
        //   存 JSON 数组 ['brand','bg','hero','about','features','curriculum','coach','reviews','events','contact','footer']
        //   前台 BjxyPage.jsx 读这个 settings, 过滤掉 brand/bg/footer 渲染 8 主体 section
        //   后台 BjxySettings.jsx sortablejs 拖拽 onEnd 改 this.tabOrder + save() 持久化
        // v0.1.15: 10 个 section 可见性开关 (默认全部 '1' 开启)
        //   辉哥 18:19 拍板: "给每个section的tab里加上一个开关，默认是开启状态，只有在开启时前端对应的section才展示"
        //   10 个 key: bjxy_section_visible_<key> (key = brand/hero/about/features/curriculum/coach/reviews/events/contact/footer)
        //   存 '1' = 展示, '0' = 隐藏; 前台 BjxyPage.jsx getSectionOrder() 过滤掉 visible=0 的
        //   footer 单独控制 (永远渲染在底部, 关闭时整个 footer 不渲染)
        //   旧部署缺这些 setting 时, 前台 fallback 默认 visible (跟开关默认开启一致)
        ->serializeToForum('bjxy_section_order_json', 'bjxy_section_order_json')
        ->serializeToForum('bjxy_section_visible_brand', 'bjxy_section_visible_brand')
        ->serializeToForum('bjxy_section_visible_hero', 'bjxy_section_visible_hero')
        ->serializeToForum('bjxy_section_visible_about', 'bjxy_section_visible_about')
        ->serializeToForum('bjxy_section_visible_events', 'bjxy_section_visible_events')
        ->serializeToForum('bjxy_section_visible_features', 'bjxy_section_visible_features')
        ->serializeToForum('bjxy_section_visible_curriculum', 'bjxy_section_visible_curriculum')
        ->serializeToForum('bjxy_section_visible_coach', 'bjxy_section_visible_coach')
        ->serializeToForum('bjxy_section_visible_reviews', 'bjxy_section_visible_reviews')
        ->serializeToForum('bjxy_section_visible_contact', 'bjxy_section_visible_contact')
        ->serializeToForum('bjxy_section_visible_footer', 'bjxy_section_visible_footer')
        // v0.1.17: 通用设置 - 显示底部 mobile tab 开关 (默认 '0' 关闭)
        //   辉哥 19:37+ 拍板: "在bjxy后台'全局设置'中新加一个tab，叫'通用设置'，里面加一个开关叫'显示底部Tab'，默认关闭"
        //   "开启状态时，会在bjxy的前端页面，把下方的mobile tab移除"
        //   '0' = 显示 mobile tab (默认, mobile tab 扩展已装时正常显示)
        //   '1' = 隐藏 mobile tab (前台 bjxy 页面 CSS hide nav.MobileTab)
        //   旧部署缺这 setting 时, 前台默认 '0' (显示 mobile tab, 跟默认一致)
        //   是否渲染开关由 admin 检测 mobile tab 扩展是否安装决定 (custom-tab-items API 拿)
        ->serializeToForum('bjxy_show_mobile_tab', 'bjxy_show_mobile_tab')
        // v0.1.33 (辉哥 14:38 反馈): 办学特色 section 背景图黑色遮罩不透明度 (0-100, 默认 50)
        //   前台 BjxyPage.jsx renderFeaturesSection 读这个 setting, 设 .bjxy-feature-mask opacity
        //   0 = 透明遮罩 (背景图全亮), 100 = 全黑遮罩 (背景图全黑)
        //   默认 50, 走 admin '办学特色' tab 顶部数字输入框
        ->serializeToForum('bjxy_feature_card_overlay_opacity', 'bjxy_feature_card_overlay_opacity')
        // v0.2.0 (辉哥 2026-08-09 8:14 反馈): 预约体验通知邮箱 (可选, 留空 fallback admin user id=1)
        //   Booking 提交后 CreateBookingController 走 vendor SendInformationalEmailJob 通知这个邮箱
        //   admin 配这个 setting 时, 通知收件人不一定是 admin user, 可配独立客服邮箱
        ->serializeToForum('bjxy_booking_notify_email', 'bjxy_booking_notify_email')
        // v0.2.0g (辉哥 2026-08-10 7:40 反馈): 10 个 section tab 名称 (全局设置的 3 个 tab 除外)
        //   辉哥: "让每个 section 中的 tab 名字都可以修改, 比如'专业教练'改成'教练团队', 前端 title 跟后端 tab 名保持一致"
        //   key 跟 BJXY_TABS 一一对应 (brand/hero/about/events/features/curriculum/coach/reviews/contact/footer)
        //   全局设置 3 个 tab (背景渐变/通用设置/用户预约) 不参与, 它们在 .bjxy-global-section 独立区
        //   后台 BjxySettings.jsx 每个 section 内容顶部加 text input, 默认值 = BJXY_TABS[i].label
        //   前端 BjxyPage.jsx 6 个 h2 (about/events/features/curriculum/coach/reviews/contact) 优先读
        //   app.forum.attribute('bjxy_section_label_<key>'), fallback 保留原 hardcode 文案
        ->serializeToForum('bjxy_section_label_brand', 'bjxy_section_label_brand')
        ->serializeToForum('bjxy_section_label_hero', 'bjxy_section_label_hero')
        ->serializeToForum('bjxy_section_label_about', 'bjxy_section_label_about')
        ->serializeToForum('bjxy_section_label_events', 'bjxy_section_label_events')
        ->serializeToForum('bjxy_section_label_features', 'bjxy_section_label_features')
        ->serializeToForum('bjxy_section_label_curriculum', 'bjxy_section_label_curriculum')
        ->serializeToForum('bjxy_section_label_coach', 'bjxy_section_label_coach')
        ->serializeToForum('bjxy_section_label_reviews', 'bjxy_section_label_reviews')
        ->serializeToForum('bjxy_section_label_contact', 'bjxy_section_label_contact')
        ->serializeToForum('bjxy_section_label_footer', 'bjxy_section_label_footer'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/less/admin.less'),

    new Extend\Locales(__DIR__ . '/locale'),

    // 注册设置/上传/教练 API (Flarum 2.0 走 Controller implements RequestHandlerInterface)
    (new Extend\Routes('api'))
        ->get('/bjxy/settings', 'bjxy.settings.get', \Ziiven\BjxyWebsite\Api\Controllers\SettingsController::class)
        ->post('/bjxy/settings', 'bjxy.settings.post', \Ziiven\BjxyWebsite\Api\Controllers\SettingsController::class)
        ->post('/bjxy/upload', 'bjxy.upload', \Ziiven\BjxyWebsite\Api\Controllers\UploadController::class)
        // v0.1.21: fileField 删除/移除按钮配套, 清空 setting + 删 COS 文件
        ->delete('/bjxy/upload', 'bjxy.upload.delete', \Ziiven\BjxyWebsite\Api\Controllers\UploadController::class)
        ->get('/bjxy/coaches', 'bjxy.coaches', \Ziiven\BjxyWebsite\Api\Controllers\CoachesController::class)
        ->get('/bjxy/coach/{id}', 'bjxy.coach.show', \Ziiven\BjxyWebsite\Api\Controllers\CoachShowController::class)
        // v0.1.4: GroupPickerModal 调这个 API 拿所选 group 的 user 列表
        ->get('/bjxy/group-users', 'bjxy.group_users', \Ziiven\BjxyWebsite\Api\Controllers\GroupUsersController::class)
        // v0.2.0 (辉哥 2026-08-09 8:14 反馈): 预约体验 modal 提交 + admin 列表
        //   POST /api/bjxy/bookings 公共接口, 6 字段预约 + 同 IP 1 分钟限流 + 邮件通知 admin
        //   GET  /api/bjxy/bookings admin 接口, assertAdmin + 分页 20/页
        ->post('/bjxy/bookings', 'bjxy.bookings.create', CreateBookingController::class)
        ->get('/bjxy/bookings', 'bjxy.bookings.list', ListBookingsController::class),
];
