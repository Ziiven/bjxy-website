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
