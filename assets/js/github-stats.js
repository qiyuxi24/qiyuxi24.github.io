'use strict';

/**
 * github-stats.js — 从 GitHub API 拉取仓库动态数据
 *
 * 功能：
 *   1. 项目卡片（data-github-repo）→ 显示该仓库的 star / fork / 语言
 *   2. #github-overview → 显示用户总览（公开仓库数 / 关注者 / 总 star）
 *
 * 说明：
 *   - 未认证的 GitHub API 限流为 60 次/小时/IP，足够个人站使用。
 *   - 结果缓存到 localStorage（默认 1 小时），减少请求。
 *   - 若请求失败（限流/离线），静默保留静态内容，不影响页面。
 */

(function () {
  const USER = 'qiyuxi24';
  const CACHE_PREFIX = 'gh_stats_';
  const CACHE_TTL = 60 * 60 * 1000; // 1 小时

  // ---------- 工具：缓存读写 ----------
  const getCache = (key) => {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { t, data } = JSON.parse(raw);
      if (Date.now() - t > CACHE_TTL) return null;
      return data;
    } catch { return null; }
  };
  const setCache = (key, data) => {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), data }));
    } catch { /* 忽略存储失败 */ }
  };

  // ---------- 工具：fetch JSON ----------
  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return res.json();
  }

  // ---------- 1. 项目卡片数据 ----------
  async function loadRepoStats(repoName, el) {
    const cacheKey = 'repo_' + repoName;
    const cached = getCache(cacheKey);
    const repo = cached || (await fetchJson(`https://api.github.com/repos/${USER}/${repoName}`));
    if (!cached) setCache(cacheKey, repo);

    if (!repo || repo.private) return;

    const stats = el.querySelector('.github-repo-stats');
    if (stats) {
      stats.innerHTML =
        `<span class="gh-stat" title="Star">★ ${repo.stargazers_count ?? 0}</span>` +
        `<span class="gh-stat" title="Fork">⑂ ${repo.forks_count ?? 0}</span>` +
        (repo.language ? `<span class="gh-stat gh-lang">${repo.language}</span>` : '');
      stats.classList.add('loaded');
    }
  }

  // ---------- 2. 用户总览 ----------
  async function loadUserOverview() {
    const wrap = document.getElementById('github-overview');
    if (!wrap) return;

    const cacheKey = 'user';
    const cached = getCache(cacheKey);
    let data = cached;
    if (!cached) {
      try {
        const [user, repos] = await Promise.all([
          fetchJson(`https://api.github.com/users/${USER}`),
          fetchJson(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`),
        ]);
        data = {
          public_repos: user.public_repos ?? 0,
          followers: user.followers ?? 0,
          total_stars: repos.reduce((s, r) => s + (r.stargazers_count || 0), 0),
          top_langs: buildLangBreakdown(repos),
        };
        setCache(cacheKey, data);
      } catch (e) {
        // 失败：保留静态占位
        wrap.classList.add('gh-failed');
        return;
      }
    }

    // 组装总览卡片
    const statItem = (label, value) =>
      `<div class="gh-overview-item"><span class="gh-overview-value">${value}</span><span class="gh-overview-label">${label}</span></div>`;

    let html = statItem('公开仓库', data.public_repos)
             + statItem('关注者', data.followers)
             + statItem('累计 Star', data.total_stars);

    if (data.top_langs && data.top_langs.length) {
      const langBar = data.top_langs
        .slice(0, 5)
        .map((l) => `<span class="gh-lang-bar" style="width:${l.pct}%;background:${l.color}"></span>`)
        .join('');
      html += `<div class="gh-overview-langs" title="常用语言">
                <div class="gh-lang-track">${langBar}</div>
              </div>`;
    }

    wrap.innerHTML = html;
    wrap.classList.add('loaded');
  }

  // 从仓库列表估算语言占比（按字节，粗粒度）
  function buildLangBreakdown(repos) {
    const LANG_COLORS = {
      Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
      Rust: '#dea584', HTML: '#e34c26', CSS: '#563d7c', 'C++': '#f34b7d',
      C: '#555555', Vue: '#41b883', Go: '#00ADD8', Java: '#b07219',
    };
    const counts = {};
    let total = 0;
    for (const r of repos) {
      if (!r.language) continue;
      counts[r.language] = (counts[r.language] || 0) + 1;
      total++;
    }
    if (!total) return [];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, c]) => ({ lang, pct: Math.round((c / total) * 100), color: LANG_COLORS[lang] || '#8b8b8b' }));
  }

  // ---------- 启动 ----------
  function init() {
    // 项目卡片
    document.querySelectorAll('[data-github-repo]').forEach((el) => {
      const repoName = el.getAttribute('data-github-repo').replace(/^https?:\/\/github\.com\//, '');
      if (!repoName) return;
      // 先插入占位图标，再异步填充
      const stats = el.querySelector('.github-repo-stats');
      if (stats) {
        stats.innerHTML = '<span class="gh-stat gh-loading">···</span>';
      }
      loadRepoStats(repoName, el).catch(() => {
        if (stats) stats.classList.add('gh-failed');
      });
    });

    // 用户总览
    loadUserOverview().catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
