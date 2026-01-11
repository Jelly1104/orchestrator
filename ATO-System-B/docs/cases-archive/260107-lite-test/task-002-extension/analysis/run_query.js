const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '222.122.26.242',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'medigate',
    password: process.env.DB_PASS || 'apelWkd',
    database: process.env.DB_NAME || 'medigate',
    connectTimeout: 10000
  });

  try {
    console.log('Connected to database');

    // Query 1: 일간 베스트 게시물 TOP 5
    const [bestPosts] = await connection.execute(`
      SELECT
        BOARD_IDX,
        TITLE,
        LEFT(CONTENT, 500) AS CONTENT_PREVIEW,
        READ_CNT,
        AGREE_CNT,
        REG_DATE,
        (READ_CNT + AGREE_CNT) AS popularity_score
      FROM BOARD_MUZZIMA
      WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
      ORDER BY popularity_score DESC
      LIMIT 5
    `);

    console.log('\n=== 일간 베스트 TOP 5 ===');
    console.log(JSON.stringify(bestPosts, null, 2));

    // Query 2: 댓글 수 집계 (베스트 게시물이 있는 경우만)
    if (bestPosts.length > 0) {
      const boardIds = bestPosts.map(p => p.BOARD_IDX).join(',');
      const [comments] = await connection.execute(`
        SELECT
          BOARD_IDX,
          COUNT(*) AS comment_count
        FROM COMMENT
        WHERE BOARD_IDX IN (${boardIds})
        GROUP BY BOARD_IDX
      `);

      console.log('\n=== 댓글 수 집계 ===');
      console.log(JSON.stringify(comments, null, 2));

      // 결과 저장
      const result = {
        timestamp: new Date().toISOString(),
        bestPosts,
        comments
      };

      fs.writeFileSync(
        path.join(__dirname, 'query_result.json'),
        JSON.stringify(result, null, 2)
      );
      console.log('\n결과 저장: query_result.json');
    } else {
      console.log('\n24시간 내 게시물 없음');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

main();
