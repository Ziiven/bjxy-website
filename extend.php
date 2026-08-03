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

return [
    // 合并所有 forum frontend 配置到一个 Extend\Frontend 实例 (避免 2 个实例互相覆盖)
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less')
        // Flarum 2.0 page extension: 注册 /bjxy 路由 (跟 ziven-dress-up /dressUp 同模式)
        ->route('/bjxy', 'bjxy.website', function (Document $document, ServerRequestInterface $request) {
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
        ->serializeToForum('bjxy_hero_cta_link', 'bjxy_hero_cta_link')
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
        // v0.1.0ab: footer icp 备案号 (后台可设, 前台 footer 渲染)
        ->serializeToForum('bjxy_icp_number', 'bjxy_icp_number')
        // v0.1.2: 公安备案号 + 网安链接 (国家规定中国大陆站点 footer 必须有)
        ->serializeToForum('bjxy_police_number', 'bjxy_police_number')
        ->serializeToForum('bjxy_police_link', 'bjxy_police_link')
        ->serializeToForum('bjxy_reviews_html', 'bjxy_reviews_html')
        ->serializeToForum('bjxy_students_html', 'bjxy_students_html')
        ->serializeToForum('bjxy_bg_gradient_light_start', 'bjxy_bg_gradient_light_start')
        ->serializeToForum('bjxy_bg_gradient_light_end', 'bjxy_bg_gradient_light_end')
        ->serializeToForum('bjxy_bg_gradient_dark_start', 'bjxy_bg_gradient_dark_start')
        ->serializeToForum('bjxy_bg_gradient_dark_end', 'bjxy_bg_gradient_dark_end')
        // v0.1.0z: 背景图 URL (走 ziven-core COS 上传, 设置了图就不显示渐变)
        ->serializeToForum('bjxy_bg_image_light_url', 'bjxy_bg_image_light_url')
        ->serializeToForum('bjxy_bg_image_dark_url', 'bjxy_bg_image_dark_url'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/less/admin.less'),

    new Extend\Locales(__DIR__ . '/locale'),

    // 注册设置/上传/教练 API (Flarum 2.0 走 Controller implements RequestHandlerInterface)
    (new Extend\Routes('api'))
        ->get('/bjxy/settings', 'bjxy.settings.get', \Ziiven\BjxyWebsite\Api\Controllers\SettingsController::class)
        ->post('/bjxy/settings', 'bjxy.settings.post', \Ziiven\BjxyWebsite\Api\Controllers\SettingsController::class)
        ->post('/bjxy/upload', 'bjxy.upload', \Ziiven\BjxyWebsite\Api\Controllers\UploadController::class)
        ->get('/bjxy/coaches', 'bjxy.coaches', \Ziiven\BjxyWebsite\Api\Controllers\CoachesController::class)
        ->get('/bjxy/coach/{id}', 'bjxy.coach.show', \Ziiven\BjxyWebsite\Api\Controllers\CoachShowController::class),
];
