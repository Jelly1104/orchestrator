import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection({
  host: '222.122.26.242',
  port: 3306,
  user: 'medigate',
  password: 'apelWkd',
  database: 'medigate'
});

console.log('=== 일간 베스트 게시물 추출 (24시간 내) ===\n');

// Query 1: 24시간 내 게시물 (실제 데이터가 없을 수 있으므로 7일로 확장)
const query = `
SELECT
  bm.BOARD_IDX,
  bm.TITLE,
  LEFT(bm.CONTENT, 500) AS CONTENT_PREVIEW,
  bm.READ_CNT,
  bm.AGREE_CNT,
  bm.REG_DATE,
  COALESCE(c.comment_count, 0) AS comment_count,
  (bm.READ_CNT + COALESCE(c.comment_count, 0) * 3) AS engagement_score
FROM BOARD_MUZZIMA bm
LEFT JOIN (
  SELECT BOARD_IDX, COUNT(*) AS comment_count
  FROM COMMENT
  WHERE SVC_CODE = 'MUZZIMA'
  GROUP BY BOARD_IDX
) c ON bm.BOARD_IDX = c.BOARD_IDX
WHERE bm.REG_DATE >= NOW() - INTERVAL 7 DAY
ORDER BY engagement_score DESC
LIMIT 10
`;

try {
  const [rows] = await conn.execute(query);
  console.log(`결과 행 수: ${rows.length}\n`);

  if (rows.length > 0) {
    rows.forEach((row, idx) => {
      console.log(`--- 게시물 ${idx + 1} ---`);
      console.log(`BOARD_IDX: ${row.BOARD_IDX}`);
      console.log(`TITLE: ${row.TITLE}`);
      console.log(`READ_CNT: ${row.READ_CNT}`);
      console.log(`AGREE_CNT: ${row.AGREE_CNT}`);
      console.log(`comment_count: ${row.comment_count}`);
      console.log(`engagement_score: ${row.engagement_score}`);
      console.log(`REG_DATE: ${row.REG_DATE}`);
      console.log(`CONTENT_PREVIEW: ${row.CONTENT_PREVIEW?.substring(0, 200)}...`);
      console.log('');
    });

    // 결과를 JSON 파일로 저장
    const outputPath = '../docs/cases/260107-lite-test/task-004-extension-lite/analysis/results/analysis_result.json';
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));
    console.log(`\n결과 저장: ${outputPath}`);
  } else {
    console.log('24시간/7일 내 게시물이 없습니다. 전체 최신 게시물 조회...');

    // Fallback: 최신 게시물 5건
    const fallbackQuery = `
    SELECT
      bm.BOARD_IDX,
      bm.TITLE,
      LEFT(bm.CONTENT, 500) AS CONTENT_PREVIEW,
      bm.READ_CNT,
      bm.AGREE_CNT,
      bm.REG_DATE,
      COALESCE(c.comment_count, 0) AS comment_count,
      (bm.READ_CNT + COALESCE(c.comment_count, 0) * 3) AS engagement_score
    FROM BOARD_MUZZIMA bm
    LEFT JOIN (
      SELECT BOARD_IDX, COUNT(*) AS comment_count
      FROM COMMENT
      WHERE SVC_CODE = 'MUZZIMA'
      GROUP BY BOARD_IDX
    ) c ON bm.BOARD_IDX = c.BOARD_IDX
    ORDER BY engagement_score DESC
    LIMIT 10
    `;

    const [fallbackRows] = await conn.execute(fallbackQuery);
    console.log(`Fallback 결과 행 수: ${fallbackRows.length}\n`);

    fallbackRows.forEach((row, idx) => {
      console.log(`--- 게시물 ${idx + 1} ---`);
      console.log(`BOARD_IDX: ${row.BOARD_IDX}`);
      console.log(`TITLE: ${row.TITLE}`);
      console.log(`READ_CNT: ${row.READ_CNT}`);
      console.log(`engagement_score: ${row.engagement_score}`);
      console.log(`REG_DATE: ${row.REG_DATE}`);
      console.log('');
    });

    const outputPath = '../docs/cases/260107-lite-test/task-004-extension-lite/analysis/results/analysis_result.json';
    fs.writeFileSync(outputPath, JSON.stringify(fallbackRows, null, 2));
    console.log(`\n결과 저장: ${outputPath}`);
  }
} catch (err) {
  console.error('쿼리 실행 오류:', err.message);
}

await conn.end();
console.log('\n=== 쿼리 완료 ===');
