<?php

/*
 * This file is part of ziiven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 *
 * v0.2.0 (辉哥 2026-08-09 8:14 反馈): GET /api/bjxy/bookings
 *   admin 接口, 列出所有预约体验提交, 分页 20 条/页
 *   返回 {bookings: [...], total: N, page: M, perPage: 20}
 *   字段: id / name / phone / age / has_ski_experience / experience_type / booking_date / created_at / ip_address / user_id
 */

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Ziiven\BjxyWebsite\Booking;

class ListBookingsController implements RequestHandlerInterface
{
    public const PER_PAGE = 20;

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        // 解析分页参数 (page number, default 1, min 1)
        $queryParams = $request->getQueryParams();
        $page = isset($queryParams['page']['number']) ? (int)$queryParams['page']['number'] : 1;
        if ($page < 1) $page = 1;

        $query = Booking::query()->orderBy('id', 'desc');
        $total = $query->count();
        $bookings = $query->forPage($page, self::PER_PAGE)->get();

        $items = $bookings->map(function (Booking $b) {
            return [
                'id' => (int)$b->id,
                'name' => (string)$b->name,
                'phone' => (string)$b->phone,
                'age' => $b->age !== null ? (int)$b->age : null,
                'has_ski_experience' => (bool)$b->has_ski_experience,
                'experience_type' => (string)$b->experience_type,
                'experience_type_label' => Booking::EXPERIENCE_TYPES[$b->experience_type] ?? $b->experience_type,
                'booking_date' => $b->booking_date ? $b->booking_date->toDateString() : null,
                'created_at' => $b->created_at ? $b->created_at->toDateTimeString() : null,
                'ip_address' => $b->ip_address,
                'user_id' => $b->user_id !== null ? (int)$b->user_id : null,
            ];
        })->all();

        return new JsonResponse([
            'bookings' => $items,
            'total' => (int)$total,
            'page' => $page,
            'perPage' => self::PER_PAGE,
        ]);
    }
}
