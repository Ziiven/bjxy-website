<?php

/*
 * This file is part of ziven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 */

namespace Ziiven\BjxyWebsite;

use Flarum\Extend;
use Flarum\Frontend\Document;
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
        // 17 级教学体系 + 6 特色 默认数据注入到前端 (Flarum 2.0 content() 接收 Document, mutate payload)
        ->content(function (Document $document) {
            $document->payload['bjxyCurriculum'] = [
                'single' => \Ziiven\BjxyWebsite\CurriculumData::getSingleBoard(),
                'double' => \Ziiven\BjxyWebsite\CurriculumData::getDoubleBoard(),
            ];
            $document->payload['bjxyFeatures'] = \Ziiven\BjxyWebsite\CurriculumData::getFeatures();
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
        ->serializeToForum('bjxy_elite_text', 'bjxy_elite_text')
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
        ->serializeToForum('bjxy_reviews_html', 'bjxy_reviews_html')
        ->serializeToForum('bjxy_students_html', 'bjxy_students_html')
        ->serializeToForum('bjxy_bg_gradient_light_start', 'bjxy_bg_gradient_light_start')
        ->serializeToForum('bjxy_bg_gradient_light_end', 'bjxy_bg_gradient_light_end')
        ->serializeToForum('bjxy_bg_gradient_dark_start', 'bjxy_bg_gradient_dark_start')
        ->serializeToForum('bjxy_bg_gradient_dark_end', 'bjxy_bg_gradient_dark_end'),

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
