<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;

/**
 * GET /api/bjxy/coach/{id}
 * 单个教练详情 (v0.1.0 仅显示头像 + 昵称, 后续扩展)
 */
class CoachShowController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $id = (int) ($request->getAttribute('id') ?? 0);
        $u = User::find($id);
        if (!$u) {
            return new JsonResponse(['error' => 'not found'], 404);
        }

        return new JsonResponse([
            'id' => (int) $u->id,
            'username' => $u->username,
            'displayName' => $u->display_name,
            'avatarUrl' => $u->avatar_url,
            'joinedAt' => $u->joined_at?->toIso8601String(),
            'bio' => $u->bio, // 后续 v0.1.1+ 扩展
        ]);
    }
}
