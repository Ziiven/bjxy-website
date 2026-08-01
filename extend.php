<?php

/*
 * This file is part of ziven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 */

namespace Ziiven\BjxyWebsite;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/less/admin.less'),

    new Extend\Locales(__DIR__ . '/locale'),

    // 注册 /bjxy 路由
    (new Extend\Routes('forum'))
        ->get('/bjxy', 'bjxy.website', function () {
            return view('bjxy-website::index');
        }),

    // 注册设置上传/读取 API
    (new Extend\Routes('api'))
        ->get('/bjxy/settings', 'bjxy.settings.get', \Ziiven\BjxyWebsite\Api\Controllers\SettingsController::class . '@handleGet')
        ->post('/bjxy/settings', 'bjxy.settings.post', \Ziiven\BjxyWebsite\Api\Controllers\SettingsController::class . '@handlePost')
        ->post('/bjxy/upload', 'bjxy.upload', \Ziiven\BjxyWebsite\Api\Controllers\UploadController::class)
        ->get('/bjxy/coaches', 'bjxy.coaches', \Ziiven\BjxyWebsite\Api\Controllers\CoachesController::class)
        ->get('/bjxy/coach/{id}', 'bjxy.coach.show', \Ziiven\BjxyWebsite\Api\Controllers\CoachShowController::class),

    // 默认数据 (教学体系 / 特色) 注入到前端
    (new Extend\Frontend('forum'))
        ->content(function () {
            $curriculum = \Ziiven\BjxyWebsite\CurriculumData::getSingleBoard() + \Ziiven\BjxyWebsite\CurriculumData::getDoubleBoard();
            $features = \Ziiven\BjxyWebsite\CurriculumData::getFeatures();
            return [
                'bjxyCurriculum' => [
                    'single' => \Ziiven\BjxyWebsite\CurriculumData::getSingleBoard(),
                    'double' => \Ziiven\BjxyWebsite\CurriculumData::getDoubleBoard(),
                ],
                'bjxyFeatures' => $features,
            ];
        }),
];
