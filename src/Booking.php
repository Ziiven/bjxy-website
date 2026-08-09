<?php

/*
 * This file is part of ziiven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 *
 * v0.2.0 (辉哥 2026-08-09 8:14 反馈): 预约体验 modal 提交数据 model
 *   - extends vendor AbstractModel (SOP 126 必读)
 *   - 7 字段 + 2 时间戳
 *   - casts 强制类型, 防 controller 拿 string
 *   - EXPERIENCE_TYPES const 跟 BookingModal 体验类型选项对应
 */

namespace Ziiven\BjxyWebsite;

use Flarum\Database\AbstractModel;

class Booking extends AbstractModel
{
    protected $table = 'bjxy_bookings';

    protected $casts = [
        'has_ski_experience' => 'boolean',
        'booking_date' => 'date',
        'age' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // v0.2.0: 体验类型 enum (跟 BookingModal 体验类型 radio 对应)
    //   BookingModal field_experience_type 选项:
    //   - single 单板体验
    //   - double 双板体验
    public const EXPERIENCE_TYPES = [
        'single' => '单板体验',
        'double' => '双板体验',
    ];
}
