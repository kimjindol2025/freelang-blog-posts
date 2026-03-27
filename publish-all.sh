#!/bin/bash

# FreeLang v6 블로그 시리즈 자동 게시 스크립트
# 모든 10개 포스트를 순차적으로 게시합니다

set -e

echo "📝 FreeLang v6 블로그 시리즈 자동 게시 시작..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 디렉토리 확인
if [ ! -f "blogger-post-freelang-1-intro.js" ]; then
    echo "❌ 오류: blogger-post-freelang-*.js 파일을 찾을 수 없습니다"
    echo "   이 스크립트는 blogger-automation 디렉토리에서 실행해야 합니다"
    exit 1
fi

# 포스트 게시
posts=(
    "blogger-post-freelang-1-intro.js"
    "blogger-post-freelang-2-bugs.js"
    "blogger-post-freelang-3-typesafety.js"
    "blogger-post-freelang-4-architecture.js"
    "blogger-post-freelang-5-errors.js"
    "blogger-post-freelang-6-p0improvements.js"
    "blogger-post-freelang-7-codeexamples.js"
    "blogger-post-freelang-8-performance.js"
    "blogger-post-freelang-9-applythis.js"
    "blogger-post-freelang-10-roadmap.js"
)

total=${#posts[@]}
count=0

for post in "${posts[@]}"; do
    count=$((count + 1))
    echo -e "${BLUE}[$count/$total]${NC} $post 게시 중..."

    if node "$post"; then
        echo -e "${GREEN}✅ 완료${NC}\n"
    else
        echo -e "❌ 실패: $post"
        exit 1
    fi

    # 포스트 간 지연 (API 제한 회피)
    if [ $count -lt $total ]; then
        sleep 2
    fi
done

echo ""
echo -e "${GREEN}✅ 모든 10개 포스트 게시 완료!${NC}"
echo ""
echo "📊 게시된 포스트:"
echo "   1. We Built Our Own Programming Language - Here's Why"
echo "   2. The Bugs That Forced Us to Build Our Own Language"
echo "   3. Type Safety Prevents 80% of Our Bugs"
echo "   4. How We Designed FreeLang: The Architecture"
echo "   5. Error Handling System: Making Bugs Traceable"
echo "   6. P0 Improvements: Making Our APIs Consistent"
echo "   7. Real Code Examples: FreeLang in Production"
echo "   8. Performance Benchmarks: Where FreeLang Gets 3x-6x Faster"
echo "   9. These Patterns Work for Your Project Too"
echo "  10. What's Next: FreeLang Roadmap and Our Vision"
echo ""
echo "🔗 블로그: https://bigwash2026.blogspot.com"
