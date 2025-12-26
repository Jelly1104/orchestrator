# Wireframe.md - 활성 사용자 현황 대시보드 화면 설계

## 1. 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ 🏠 관리자 > 사용자 관리 > 활성 사용자 현황 대시보드        │
│                                          업데이트: 실시간 │
├─────────────────────────────────────────────────────────┤
│ KPI Cards Section                                        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │전체사용자│ │활성사용자│ │신규가입자│ │전월대비  │        │
│ │203,914  │ │   ?     │ │  408    │ │  +2.1%  │        │
│ │   명    │ │   명    │ │  명/월   │ │        │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│ Charts Section                                          │
│ ┌─────────────────────┐ ┌─────────────────────┐         │
│ │월별 신규 가입자 추이   │ │유형별 사용자 분포     │         │
│ │                    │ │                    │         │
│ │     📈            │ │      🥧            │         │
│ │   Line Chart      │ │   Pie Chart        │         │
│ │                    │ │                    │         │
│ └─────────────────────┘ └─────────────────────┘         │
├─────────────────────────────────────────────────────────┤
│ Data Table Section                                      │
│ ┌─────┬────────┬────────┬──────────┬─────────────────┐  │
│ │유형  │유형명   │사용자수│비율       │등록일 범위        │  │
│ ├─────┼────────┼────────┼──────────┼─────────────────┤  │
│ │UKD001│의사    │128,356 │ 63.0%    │2020-01~2025-12 │  │
│ │...   │...     │...     │ ...      │...              │  │
│ └─────┴────────┴────────┴──────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 2. 컴포넌트 상세 설계

### 2.1 KPI Cards

```jsx
<KPICard>
  <Value>203,914</Value>
  <Label>전체 사용자</Label>
  <Trend>↗️ +2.1% (전월 대비)</Trend>
</KPICard>
```

**데이터 매핑**:
- 전체 사용자: `COUNT(*) FROM USERS`
- 활성 사용자: `COUNT(*) FROM USERS WHERE U_ALIVE='Y'` [⚠️ AI 추론됨 - 검토 필요]
- 신규 가입자: `COUNT(*) FROM USERS WHERE DATE_FORMAT(U_REG_DATE, '%Y-%m') = '2025-12'`

### 2.2 월별 신규 가입자 추이 차트

```jsx
<LineChart>
  <XAxis>월 (2024-01 ~ 2025-12)</XAxis>
  <YAxis>신규 가입자 수</YAxis>
  <Line data={monthlySignups} />
</LineChart>
```

**데이터 소스**:
```sql
SELECT 
  DATE_FORMAT(U_REG_DATE, '%Y-%m') as month,
  COUNT(*) as signup_count
FROM USERS 
WHERE U_REG_DATE >= '2024-01-01'
GROUP BY DATE_FORMAT(U_REG_DATE, '%Y-%m')
ORDER BY month
```

### 2.3 유형별 사용자 분포 차트

```jsx
<PieChart>
  <Data>
    {userTypeDistribution.map(item => 
      <Slice key={item.type} value={item.count} label={item.name} />
    )}
  </Data>
</PieChart>
```

**데이터 소스**:
```sql
SELECT 
  u.U_KIND as user_type,
  cm.CODE_NAME as type_name,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM USERS), 1) as percentage
FROM USERS u
LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE='U_KIND' AND cm.CODE_VALUE=u.U_KIND
GROUP BY u.U_KIND, cm.CODE_NAME
ORDER BY user_count DESC
```

## 3. 반응형 설계

### Desktop (>= 1200px)
- KPI Cards: 4개 가로 배치
- Charts: 2개 나란히 배치 (50% : 50%)
- Table: 전체 너비

### Tablet (768px - 1199px)
- KPI Cards: 2x2 배치
- Charts: 세로 배치
- Table: 스크롤 가능

### Mobile (< 768px)
- KPI Cards: 세로 배치
- Charts: 세로 배치, 간소화
- Table: 카드형 레이아웃 전환

## 4. 상호작용 설계

| 요소 | 상호작용 | 결과 |
|------|----------|------|
| KPI Card | 클릭 | 해당 지표 상세 페이지로 이동 |
| 차트 데이터 포인트 | 호버 | 툴팁으로 상세 값 표시 |
| 테이블 행 | 클릭 | 해당 유형 사용자 목록 페이지로 이동 |
| 새로고침 버튼 | 클릭 | 전체 데이터 새로고침 |