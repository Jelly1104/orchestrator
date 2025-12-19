/**
 * 알림 API 테스트
 * @see docs/case2-notification/SDD.md
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../src/backend/index";

let server: import("node:http").Server;
let baseUrl = "";

beforeAll(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start server");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

async function jsonFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}${path}`, init);
  const data = await res.json();
  return { res, data };
}

describe("Notification API", () => {
  it("GET /api/v1/notifications - X-User-Id 없으면 400", async () => {
    const { res, data } = await jsonFetch(`/api/v1/notifications`);
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/notifications - 정상 조회", async () => {
    const { res, data } = await jsonFetch(`/api/v1/notifications`, {
      headers: { "X-User-Id": "12345678901234" },
    });

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.items)).toBe(true);
    expect(typeof data.data.unreadCount).toBe("number");
  });

  it("PATCH /api/v1/notifications/:id/read - 본인 알림 읽음 처리", async () => {
    const { res, data } = await jsonFetch(`/api/v1/notifications/1/read`, {
      method: "PATCH",
      headers: { "X-User-Id": "12345678901234" },
    });

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(1);
    expect(data.data.isRead).toBe(true);
  });

  it("POST /api/v1/admin/notifications - 발송 mock 결과", async () => {
    const { res, data } = await jsonFetch(`/api/v1/admin/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "SPECIFIC",
        targetUserIds: ["12345678901234"],
        type: "NOTICE",
        title: "테스트",
        message: "테스트 메시지",
      }),
    });

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.sentCount).toBe(1);
  });
});
