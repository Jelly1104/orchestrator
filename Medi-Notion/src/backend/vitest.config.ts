import { defineConfig } from "vitest/config";
import path from "node:path";

const TEST_ROOT = path.resolve(__dirname, "../../tests");

export default defineConfig({
  // NOTE: vitest 실행 위치는 backend이지만, 테스트는 repo 루트(Medi-Notion/tests)에 존재합니다.
  // root는 유지(backend)하여 node_modules 해석은 backend 기준으로 하고,
  // server.fs.allow + include(absolute)로 외부 테스트 폴더를 읽어옵니다.
  server: {
    fs: {
      allow: [TEST_ROOT],
    },
  },
  test: {
    environment: "jsdom",
    include: [
      path.resolve(TEST_ROOT, "**/*.test.ts"),
      path.resolve(TEST_ROOT, "**/*.test.tsx"),
    ],
  },
});
