<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ServerRequestInterface;
use Laminas\Diactoros\Response\JsonResponse;

/**
 * GET /api/bjxy/settings — 读取所有 bjxy_ 前缀 settings
 * POST /api/bjxy/settings — 保存 (key => value)
 */
class SettingsController
{
    public function __construct(protected SettingsRepositoryInterface $settings) {}

    public function handleGet(ServerRequestInterface $request): JsonResponse
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $all = $this->settings->all();
        $bjxy = [];
        foreach ($all as $k => $v) {
            if (str_starts_with($k, 'bjxy_')) {
                $bjxy[$k] = $v;
            }
        }
        return new JsonResponse(['settings' => $bjxy]);
    }

    public function handlePost(ServerRequestInterface $request): JsonResponse
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $body = $request->getParsedBody();
        if (!is_array($body)) {
            throw new ValidationException(['body' => 'invalid']);
        }
        $saved = 0;
        foreach ($body as $k => $v) {
            if (!str_starts_with($k, 'bjxy_')) continue;
            $this->settings->set($k, (string) $v);
            $saved++;
        }
        return new JsonResponse(['ok' => true, 'saved' => $saved]);
    }
}
