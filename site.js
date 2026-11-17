/* ============ 胶片档案 · 交互系统 ============ */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---- 走马轨道复制（无缝循环） ---- */
    ['stripTrack', 'marqueeTrack'].forEach(function (id) {
        var t = document.getElementById(id);
        if (t) t.innerHTML += t.innerHTML;
    });

    /* ---- 滚动揭示 ---- */
    var revealEls = document.querySelectorAll('.reveal, .reveal-clip');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        revealEls.forEach(function (el) { io.observe(el); });

        // 兜底：部分环境（后台标签页/内嵌浏览器）IO 初始回调不投递，
        // 加载后手动检查一次首屏元素
        setTimeout(function () {
            var vh = window.innerHeight || 10000; // 视口未知时直接显示，不藏内容
            revealEls.forEach(function (el) {
                if (el.classList.contains('in')) return;
                var r = el.getBoundingClientRect();
                if (r.top < vh * 0.94 && r.bottom > 0) {
                    el.classList.add('in');
                    io.unobserve(el);
                }
            });
        }, 1200);
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---- 导航状态 + 滚动进度 ---- */
    var header = document.getElementById('siteHeader');
    var progress = document.getElementById('scrollProgress');
    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            var y = window.scrollY;
            if (header) header.classList.toggle('scrolled', y > 40);
            var max = document.documentElement.scrollHeight - window.innerHeight;
            if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---- 当前区块导航高亮 ---- */
    var navLinks = document.querySelectorAll('.main-nav a');
    var sections = ['home', 'about', 'works', 'contact'].map(function (id) {
        return document.getElementById(id);
    });
    if ('IntersectionObserver' in window) {
        var navIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    navLinks.forEach(function (a) {
                        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -50% 0px' });
        sections.forEach(function (s) { if (s) navIO.observe(s); });
    }

    /* ---- 自定义光标 ---- */
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    if (dot && ring && finePointer && !reduceMotion) {
        var mx = -100, my = -100, rx = -100, ry = -100;
        document.addEventListener('mousemove', function (e) {
            mx = e.clientX; my = e.clientY;
            dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
        });
        (function loop() {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            var size = ring.classList.contains('hovering') ? 64 : 38;
            ring.style.transform = 'translate(' + (rx - size / 2) + 'px,' + (ry - size / 2) + 'px)';
            requestAnimationFrame(loop);
        })();
        document.querySelectorAll('a, button, .work-row').forEach(function (el) {
            el.addEventListener('mouseenter', function () { ring.classList.add('hovering'); });
            el.addEventListener('mouseleave', function () { ring.classList.remove('hovering'); });
        });
    } else {
        if (dot) dot.style.display = 'none';
        if (ring) ring.style.display = 'none';
    }

    /* ---- 磁吸按钮 ---- */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('.magnetic').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var x = e.clientX - r.left - r.width / 2;
                var y = e.clientY - r.top - r.height / 2;
                el.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.28 + 'px)';
            });
            el.addEventListener('mouseleave', function () {
                el.style.transform = '';
            });
        });
    }

    /* ---- 作品悬浮预览 ---- */
    var preview = document.getElementById('workPreview');
    if (preview && finePointer && !reduceMotion) {
        var pImg = preview.querySelector('img');
        var px = 0, py = 0, tx = 0, ty = 0, visible = false;
        document.querySelectorAll('.work-row').forEach(function (row) {
            row.addEventListener('mouseenter', function (e) {
                pImg.src = row.getAttribute('data-img');
                tx = e.clientX; ty = e.clientY;
                px = tx; py = ty;
                preview.classList.add('on');
                visible = true;
            });
            row.addEventListener('mousemove', function (e) {
                tx = e.clientX; ty = e.clientY;
            });
            row.addEventListener('mouseleave', function () {
                preview.classList.remove('on');
                visible = false;
            });
        });
        (function pLoop() {
            px += (tx - px) * 0.12;
            py += (ty - py) * 0.12;
            if (visible || preview.classList.contains('on')) {
                preview.style.left = (px + 36) + 'px';
                preview.style.top = (py - preview.offsetHeight / 2) + 'px';
            }
            requestAnimationFrame(pLoop);
        })();
    }

    /* ---- 复制 chips ---- */
    document.querySelectorAll('.copy-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
            var text = chip.getAttribute('data-copy');
            var valEl = chip.querySelector('.v');
            var original = valEl.textContent;
            function done() {
                chip.classList.add('copied');
                valEl.textContent = '已复制 ✓';
                setTimeout(function () {
                    chip.classList.remove('copied');
                    valEl.textContent = original;
                }, 1600);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(done);
            } else {
                var ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (e) {}
                document.body.removeChild(ta);
                done();
            }
        });
    });

})();


/* ============ 技能标签展开 + 证书 Lightbox ============ */
(function () {
    'use strict';

    /* ---- 技能标签 ---- */
    var skillList = document.getElementById('skillList');
    var detail = document.getElementById('skillDetail');
    if (skillList && detail) {
        var dTitle = document.getElementById('skillDetailTitle');
        var dDesc = document.getElementById('skillDetailDesc');
        var current = null;
        skillList.querySelectorAll('span').forEach(function (chip) {
            chip.setAttribute('role', 'button');
            chip.setAttribute('tabindex', '0');
            function toggle() {
                if (current === chip) {
                    chip.classList.remove('active');
                    detail.hidden = true;
                    current = null;
                    return;
                }
                if (current) current.classList.remove('active');
                current = chip;
                chip.classList.add('active');
                dTitle.textContent = chip.getAttribute('data-skill');
                dDesc.textContent = chip.getAttribute('data-desc');
                detail.hidden = false;
                // 重播展开动画
                detail.style.animation = 'none';
                void detail.offsetWidth;
                detail.style.animation = '';
            }
            chip.addEventListener('click', toggle);
            chip.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });
    }

    /* ---- 证书 Lightbox（主页与 awards.html 共用） ---- */
    var lb = document.getElementById('lightbox');
    if (lb) {
        var lbImg = document.getElementById('lightboxImg');
        var lbCap = document.getElementById('lightboxCaption');
        var activeCard = null;
        lb.setAttribute('aria-modal', 'true');
        function openLb(src, caption, card) {
            activeCard = card || null;
            lbImg.src = src;
            lbCap.textContent = caption || '';
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
            document.getElementById('lightboxClose').focus();
        }
        function closeLb() {
            lb.classList.remove('open');
            document.body.style.overflow = '';
            lbImg.src = '';
            if (activeCard) activeCard.focus();
        }
        document.querySelectorAll('.award-card').forEach(function (card) {
            var title = card.querySelector('figcaption b');
            var level = card.querySelector('.award-level');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', '放大查看 ' + (title ? title.textContent : '证书') + (level ? ' · ' + level.textContent : ''));
            function open() {
                var cap = '';
                if (title) cap += title.textContent;
                if (level) cap += ' · ' + level.textContent;
                openLb(card.getAttribute('data-full'), cap, card);
            }
            card.addEventListener('click', open);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            });
        });
        document.getElementById('lightboxClose').addEventListener('click', closeLb);
        lb.addEventListener('click', function (e) {
            if (e.target === lb) closeLb();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lb.classList.contains('open')) closeLb();
        });
    }
})();
