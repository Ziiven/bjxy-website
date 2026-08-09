<?php

/*
 * This file is part of ziiven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 *
 * v0.2.0 (辉哥 2026-08-09 8:14 反馈): 预约体验 modal 提交后, 6 字段存到这张表
 *   - name (string 100, 必填)
 *   - phone (string 50, 必填)
 *   - age (int unsigned nullable, 可选)
 *   - has_ski_experience (bool default false, 是/否)
 *   - experience_type (string 20, 'single' | 'double' 单板/双板)
 *   - booking_date (date, >= today 验证)
 *   - ip_address (string 45 nullable, IPv6 max length)
 *   - user_id (int unsigned nullable, Flarum user id, 登录用户可空, 公开用户不记)
 *   - created_at (timestamp useCurrent, 排序用, index)
 *   - updated_at (timestamp nullable, 一般不改, 不强制)
 *   - 限流索引: created_at + ip_address 联合查 1 分钟内同 IP 提交记录
 *     (注意: 单 index(created_at) 也够, 同 IP 1 分钟过滤在 where 阶段)
 *   - booking_date index 便于后台按日期排序展示
 */

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

return Migration::createTable('bjxy_bookings', function (Blueprint $table) {
    $table->increments('id');
    $table->string('name', 100);
    $table->string('phone', 50);
    $table->integer('age')->unsigned()->nullable();
    $table->boolean('has_ski_experience')->default(false);
    $table->string('experience_type', 20);
    $table->date('booking_date');
    $table->string('ip_address', 45)->nullable();
    $table->integer('user_id')->unsigned()->nullable();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->nullable();

    // 限流查询: WHERE ip_address = ? AND created_at > NOW() - INTERVAL 1 MINUTE
    $table->index('created_at');
    $table->index('booking_date');
    // v0.2.0 联合索引 (P0 限流): 单 index(created_at) 让 server 1 分钟 1 IP 查 1 次慢,
    //   (ip_address, created_at) 联合让 server 一次命中索引
    $table->index(['ip_address', 'created_at'], 'idx_bjxy_bookings_ip_created');
});
