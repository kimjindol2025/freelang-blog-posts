---
layout: default
title: FreeLang Blog Posts
---

# 🚀 FreeLang Blog Posts

기술 블로그 모음입니다. **메인 블로그**: [Blogger](https://bigwash2026.blogspot.com)

---

## 📚 포스트 목록

{% for file in site.static_files %}
  {% if file.path contains '.md' and file.path != '/_config.yml' %}
  - [{{ file.name }}]({{ file.path }})
  {% endif %}
{% endfor %}

---

**🔗 Links:**
- [GitHub Repository](https://github.com/kimjindol2025/freelang-blog-posts)
- [Main Blog (Blogger)](https://bigwash2026.blogspot.com)
- [FreeLang GitHub](https://github.com/kimjindol2025)
