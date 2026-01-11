import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const conn = await mysql.createConnection({
  host: '222.122.26.242',
  port: 3306,
  user: 'medigate',
  password: 'apelWkd',
  database: 'medigate'
});

console.log('=== task-005: 일간 베스트 게시물 추출 (24시간 내) ===\n');

// Query: 24시간 내 게시물 (없으면 7일로 확장)
const query24h = `
SELECT
  bm.BOARD_IDX,
  bm.CTG_CODE,
  bm.TITLE,
  LEFT(bm.CONTENT, 1000) AS CONTENT_PREVIEW,
  bm.READ_CNT,
  bm.AGREE_CNT,
  bm.REG_DATE,
  (bm.READ_CNT + bm.AGREE_CNT * 2) AS popularity_score
FROM BOARD_MUZZIMA bm
WHERE bm.REG_DATE >= NOW() - INTERVAL 24 HOUR
ORDER BY popularity_score DESC
LIMIT 10
`;

// Fallback: 7일 내 게시물
const query7d = `
SELECT
  bm.BOARD_IDX,
  bm.CTG_CODE,
  bm.TITLE,
  LEFT(bm.CONTENT, 1000) AS CONTENT_PREVIEW,
  bm.READ_CNT,
  bm.AGREE_CNT,
  bm.REG_DATE,
  (bm.READ_CNT + bm.AGREE_CNT * 2) AS popularity_score
FROM BOARD_MUZZIMA bm
WHERE bm.REG_DATE >= NOW() - INTERVAL 7 DAY
ORDER BY popularity_score DESC
LIMIT 10
`;

// Ultimate Fallback: 전체 인기 게시물
const queryAll = `
SELECT
  bm.BOARD_IDX,
  bm.CTG_CODE,
  bm.TITLE,
  LEFT(bm.CONTENT, 1000) AS CONTENT_PREVIEW,
  bm.READ_CNT,
  bm.AGREE_CNT,
  bm.REG_DATE,
  (bm.READ_CNT + bm.AGREE_CNT * 2) AS popularity_score
FROM BOARD_MUZZIMA bm
ORDER BY popularity_score DESC
LIMIT 10
`;

try {
  // 1. 24시간 내 시도
  let [rows] = await conn.execute(query24h);
  let timeRange = '24시간';

  if (rows.length === 0) {
    console.log('24시간 내 게시물 없음. 7일로 확장...');
    [rows] = await conn.execute(query7d);
    timeRange = '7일';
  }

  if (rows.length === 0) {
    console.log('7일 내 게시물 없음. 전체 인기 게시물 조회...');
    [rows] = await conn.execute(queryAll);
    timeRange = '전체';
  }

  console.log(`결과 행 수: ${rows.length} (${timeRange} 기준)\n`);

  // 2. 댓글 수 조회
  if (rows.length > 0) {
    const boardIdxList = rows.map(r => r.BOARD_IDX).join(',');
    const commentQuery = `
      SELECT BOARD_IDX, COUNT(*) AS COMMENT_CNT
      FROM COMMENT
      WHERE BOARD_IDX IN (${boardIdxList})
      GROUP BY BOARD_IDX
    `;
    const [commentRows] = await conn.execute(commentQuery);
    const commentMap = {};
    commentRows.forEach(r => {
      commentMap[r.BOARD_IDX] = r.COMMENT_CNT;
    });

    // 댓글 수 병합
    rows = rows.map(row => ({
      ...row,
      COMMENT_CNT: commentMap[row.BOARD_IDX] || 0
    }));

    // 출력
    rows.forEach((row, idx) => {
      console.log(`--- 게시물 ${idx + 1} ---`);
      console.log(`BOARD_IDX: ${row.BOARD_IDX}`);
      console.log(`CTG_CODE: ${row.CTG_CODE}`);
      console.log(`TITLE: ${row.TITLE}`);
      console.log(`READ_CNT: ${row.READ_CNT}, AGREE_CNT: ${row.AGREE_CNT}, COMMENT_CNT: ${row.COMMENT_CNT}`);
      console.log(`popularity_score: ${row.popularity_score}`);
      console.log(`REG_DATE: ${row.REG_DATE}`);
      console.log(`CONTENT_PREVIEW: ${row.CONTENT_PREVIEW?.substring(0, 200)}...`);
      console.log('');
    });

    // 결과 저장
    const outputDir = path.join(__dirname, '../docs/cases/260107-lite-test/task-005-extension-full/analysis');

    // 디렉토리 확인/생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'query_result.json');
    const result = {
      generatedAt: new Date().toISOString(),
      timeRange,
      rowCount: rows.length,
      posts: rows.map(row => ({
        BOARD_IDX: row.BOARD_IDX,
        CTG_CODE: row.CTG_CODE,
        TITLE: row.TITLE,
        CONTENT_PREVIEW: row.CONTENT_PREVIEW,
        READ_CNT: row.READ_CNT,
        AGREE_CNT: row.AGREE_CNT,
        COMMENT_CNT: row.COMMENT_CNT,
        popularity_score: row.popularity_score,
        REG_DATE: row.REG_DATE
      }))
    };

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n결과 저장: ${outputPath}`);
  }
} catch (err) {
  console.error('쿼리 실행 오류:', err.message);
}

await conn.end();
console.log('\n=== 쿼리 완료 ===');
