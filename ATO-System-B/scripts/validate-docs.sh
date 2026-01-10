#!/bin/bash
# validate-docs.sh - 문서 일관성 검증 스크립트

echo "📋 Plan05 문서 정합성 검증"
echo "================================"

# 1. SYSTEM_MANIFEST 버전 확인
MANIFEST_VERSION=$(grep "Version" .claude/SYSTEM_MANIFEST.md | head -1 | sed 's/.*: \([0-9.]*\).*/\1/')
echo "✅ SYSTEM_MANIFEST 버전: v$MANIFEST_VERSION"

# 2. 주요 문서 존재 확인
REQUIRED_DOCS=(
  ".claude/SYSTEM_MANIFEST.md"
  ".claude/workflows/DOCUMENT_PIPELINE.md"
  ".claude/rules/ROLES_DEFINITION.md"
  "docs/reports/FileTree-Plan05.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc"
  else
    echo "❌ 누락: $doc"
  fi
done

# 3. 경로 참조 일관성 (간단 버전)
echo ""
echo "📍 경로 참조 검증"
grep -r "docs/cases" .claude/*.md 2>/dev/null | wc -l | xargs echo "  - Current 경로 (docs/cases) 참조:"
grep -r "services/" .claude/SYSTEM_MANIFEST.md 2>/dev/null | wc -l | xargs echo "  - Plan05 경로 (services/) 참조:"

echo ""
echo "✅ 검증 완료!"
