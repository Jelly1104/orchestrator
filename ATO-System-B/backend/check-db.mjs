import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: '222.122.26.242',
  port: 3306,
  user: 'medigate',
  password: 'apelWkd',
  database: 'medigate'
});

console.log('=== U_ALIVE 분포 ===');
const [alive] = await conn.execute('SELECT U_ALIVE, COUNT(*) as cnt FROM USERS GROUP BY U_ALIVE');
console.log(alive);

console.log('\n=== USERS 테이블 컬럼 확인 ===');
const [cols] = await conn.execute("SHOW COLUMNS FROM USERS LIKE '%ALIVE%'");
console.log(cols);

console.log('\n=== 활성 상태 관련 컬럼 ===');
const [allCols] = await conn.execute("SHOW COLUMNS FROM USERS");
const statusCols = allCols.filter(c =>
  c.Field.includes('ALIVE') ||
  c.Field.includes('STATUS') ||
  c.Field.includes('STATE') ||
  c.Field.includes('ACTIVE')
);
console.log(statusCols);

await conn.end();
