<?php

namespace Ziiven\BjxyWebsite;

/**
 * 教学体系默认数据 (单板 8 级 + 双板 9 级)
 * 走 settings 表, 但提供默认值
 */
class CurriculumData
{
    const SINGLE_BOARD = [
        ['level' => 'PRIMARY', 'name' => '直滑降后刃推坡', 'desc' => '能够熟练的做直滑降练习，在滑降的过程当中能够做到扶膝盖，雪鞋，并很好的控制身体平衡；能利用后刃推坡的技术做到匀速上滑，匀速下滑/加速下滑并刹车/任意停留在雪机某个点，并且保持重心稳定和身体平衡。'],
        ['level' => 'PRIMARY', 'name' => '前刃推坡', 'desc' => '能够利用前刃做到匀速上滑，匀速下滑/加速下滑并刹车。'],
        ['level' => 'PRIMARY', 'name' => '前后刃落叶飘', 'desc' => '在前后刃落叶飘的过程当中，能够很好的做到拧板、改变重心，改变立刃角，控制落叶飘；能够在雪机上做落叶飘上下练习，同时保证落叶飘流畅度、均匀度和相对较快的速度。'],
        ['level' => 'INTERMEDIATE', 'name' => '辅助换刃', 'desc' => '在借助扶杆，+拉绳，拉手的方式，达到换刃的目的，动作有引申，并且做到换刃时机准确。'],
        ['level' => 'INTERMEDIATE', 'name' => '基础转弯', 'desc' => '在不借助外力的情况下，完成S形搓雪转弯，动作有明显引申。'],
        ['level' => 'INTERMEDIATE', 'name' => '标准转弯', 'desc' => '动作有明显引申，滑行流畅，有节奏感；可以熟练转弯的大小与弯形，转弯过程中少量搓雪。'],
        ['level' => 'ADVANCED', 'name' => '刻滑', 'desc' => '不搓雪的刻滑转弯，能够较流畅的反脚滑行。'],
        ['level' => 'ADVANCED', 'name' => '自由式', 'desc' => '流畅正反脚滑行、Ollie、自由式基础。'],
    ];

    const DOUBLE_BOARD = [
        ['level' => 'PRIMARY', 'name' => '犁式刹车', 'desc' => '熟悉滑雪基本站姿，时刻保持身体重心居中；独立完成标准直滑降动作；掌握犁式刹车动作姿态，自如控制身体前行速度。'],
        ['level' => 'PRIMARY', 'name' => '基础犁式转弯', 'desc' => '在犁式刹车基础上，通过偏移身体重心将身体重量施加在一侧雪板的里侧刃上，使雪板产生圆弧式形变引发转向；能够对身体下肢骨关节进行简单的旋转控制。'],
        ['level' => 'PRIMARY', 'name' => '高级犁式转弯', 'desc' => '熟练基础犁式转弯的基础上，掌握引申释放雪板压力，通过旋转大腿控制转弯半径，自如控制身体的行进方向。理解髋关节的旋转带来的雪板转向；正确使用雪仗。'],
        ['level' => 'INTERMEDIATE', 'name' => '半犁式转弯', 'desc' => '稳定流畅的犁式转弯后，将非承重腿微抬起，以跟随的方式进入双板平行姿态。进入平行滑行后，能够保持身体重心在承重腿一侧。'],
        ['level' => 'INTERMEDIATE', 'name' => '高级半犁式', 'desc' => '熟练犁式转弯，转弯过程中能够较好的控制转弯节奏、引申、旋转腿等技术动作；转向后持续稳定的做到转向腿有效承重，从动腿熟练且快速跟随，进入平行滑行。'],
        ['level' => 'INTERMEDIATE', 'name' => '基础平行式', 'desc' => '能够在转弯的任何阶段保持双板平行滑行姿态，始终保持转向腿承受身体重量直至新的转弯开始；做到准确、快速的移动身体重心；正确的使用雪杖控制转弯节奏。'],
        ['level' => 'ADVANCED', 'name' => '中级平行式', 'desc' => '平行转弯流畅，有较好的滑行节奏，对雪板刃的控制能力强，能够通过身体关节的旋转控制转弯的弯形大小，自然的雪仗使用姿态。'],
        ['level' => 'ADVANCED', 'name' => '高级平行式', 'desc' => '精准的控制雪板刃的使用，根据滑行意愿随时变换滑行节奏，滑行中身体能够始终保持标准的高山滑雪站姿，流畅规范的使用雪杖，配合滑行节奏优美的点杖。'],
        ['level' => 'ADVANCED', 'name' => '全地域大神', 'desc' => '单脚滑行、豚跳、180 度旋转、360 度旋转、小跳台等技巧，并且可以在雪上多种地形游刃有余。'],
    ];

    // v0.1.33 改: 加 bgImageUrl 字段 (admin 可上传背景图, 前端走 bjxy-feature-bg + bjxy-feature-mask 渲染)
    //   默认空, 留空时前端不渲染背景层, 保持原玻璃卡样式
    const FEATURES = [
        ['icon' => '🏂', 'title' => '室内滑雪高效', 'desc' => '一年四季恒温环境, 不受天气影响', 'bgImageUrl' => ''],
        ['icon' => '🛡️', 'title' => '安全专业教练', 'desc' => '认证教练全程指导, 安全第一', 'bgImageUrl' => ''],
        ['icon' => '📚', 'title' => '滑雪教学', 'desc' => '自主研发课程体系, 分级进阶', 'bgImageUrl' => ''],
        ['icon' => '🎿', 'title' => '雪具护具免费', 'desc' => '全套装备免费使用, 省心省力', 'bgImageUrl' => ''],
        ['icon' => '🌐', 'title' => '全国品牌机构', 'desc' => '连锁品牌, 标准化教学', 'bgImageUrl' => ''],
        ['icon' => '🏔️', 'title' => '学玩用赛', 'desc' => '全生态滑雪服务', 'bgImageUrl' => ''],
    ];

    public static function getSingleBoard(): array
    {
        return self::SINGLE_BOARD;
    }

    public static function getDoubleBoard(): array
    {
        return self::DOUBLE_BOARD;
    }

    public static function getFeatures(): array
    {
        return self::FEATURES;
    }
}
