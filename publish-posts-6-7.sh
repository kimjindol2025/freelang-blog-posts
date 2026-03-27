#!/bin/bash
# Publish Posts 6-7 with rate limiting (5 second sleep)

set -e

echo "📤 Post 6 게시 중..."
node /data/data/com.termux/files/home/dev/blogger-automation/blogger-post-server-6-caching.js
sleep 5

echo ""
echo "📤 Post 7 게시 중..."
node /data/data/com.termux/files/home/dev/blogger-automation/blogger-post-server-7-async.js
sleep 2

echo ""
echo "✅ Posts 6-7 게시 완료!"
