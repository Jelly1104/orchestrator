# Wireframe.md - 화면 설계

## 1. 오케스트레이터 대시보드 (/dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Orchestrator Management Console                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ Total Agents│ │Active Agents│ │Failed Tasks │ │ Success │ │
│ │     12      │ │      8      │ │      3      │ │  Rate   │ │
│ │             │ │             │ │             │ │  87.3%  │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Real-time Agent Status  │ │ Recent Workflow Executions  │ │
│ │ ┌─ Leader Agent    ●   │ │ ┌─ WF-001  Success  2min ago│ │
│ │ ├─ Coding Agent    ●   │ │ ├─ WF-002  Running  5min ago│ │
│ │ ├─ Design Agent   ●   │ │ ├─ WF-003  Failed   10min    │ │
│ │ └─ Analysis Agent ●   │ │ └─ WF-004  Success  15min    │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 2. 에이전트 목록 페이지 (/agents/list)

```
┌─────────────────────────────────────────────────────────────┐
│ Agent Management                           [+ Add Agent]    │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Status ▼] [Type ▼] [Search____________] [Filter] │
├─────────────────────────────────────────────────────────────┤
│ ID    │ Name          │ Type     │ Status  │ Last Active    │
├─────────────────────────────────────────────────────────────┤
│ AG001 │ Leader Agent  │ Leader   │ Active  │ 2min ago      │
│ AG002 │ Coding Agent  │ Coding   │ Active  │ 1min ago      │
│ AG003 │ Design Agent  │ Design   │ Idle    │ 5min ago      │
│ AG004 │ Analysis Agent│ Analysis │ Error   │ 10min ago     │
└─────────────────────────────────────────────────────────────┘
```

## 3. 통합 검증 페이지 (/validation/integration-test)

```
┌─────────────────────────────────────────────────────────────┐
│ Integration Test Suite                    [Run All Tests]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Test Categories                                         ┐ │
│ │ ☑ Agent Communication Tests                             │ │
│ │ ☑ Workflow Execution Tests                              │ │
│ │ ☑ Error Handling Tests                                  │ │
│ │ ☑ Performance Tests                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Test Results:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Agent-to-Agent Communication          [PASS] 1.2s    │ │
│ │ ✓ Leader Agent Workflow Dispatch        [PASS] 0.8s    │ │
│ │ ✗ Error Recovery Mechanism              [FAIL] 2.5s    │ │
│ │ ⏳ Performance Load Test                 [RUNNING]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 4. 컴포넌트 데이터 바인딩

### 대시보드 카드 컴포넌트
```javascript
// MetricsCard.vue
props: {
  title: String,          // "Total Agents"
  value: Number,         // 12
  status: String,        // "success", "warning", "error"
  source: String         // API endpoint for data
}
```

### 에이전트 상태 컴포넌트  
```javascript
// AgentStatusList.vue
data: {
  agents: [
    { id: 'AG001', name: 'Leader Agent', status: 'active', lastPing: '2min' }
  ]
}
```