// ========== 交互增强：自定义光标 / 磁吸导航 / 卡片 3D 倾斜 / 复制联系方式 ==========
(function () {
    'use strict';

    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- 自定义光标 ----------
    if (finePointer) {
        var dot = document.createElement('div');
        var ring = document.createElement('div');
        dot.className = 'cursor-dot';
        ring.className = 'cursor-ring';
        document.body.appendChild(dot);
        document.body.appendChild(ring);

        var mx = -100, my = -100, rx = -100, ry = -100;
        window.addEventListener('pointermove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
        });

        (function followRing() {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            ring.style.transform = 'translate(' + (rx - 17) + 'px,' + (ry - 17) + 'px)';
            requestAnimationFrame(followRing);
        })();

        document.querySelectorAll('a, button').forEach(function (el) {
            el.addEventListener('pointerenter', function () { ring.classList.add('is-hover'); });
            el.addEventListener('pointerleave', function () { ring.classList.remove('is-hover'); });
        });
    }

    // ---------- 导航磁吸效果 ----------
    if (finePointer && !prefersReduced) {
        document.querySelectorAll('.nav-links a, .darkroom-toggle').forEach(function (el) {
            el.addEventListener('pointermove', function (e) {
                var rect = el.getBoundingClientRect();
                var dx = e.clientX - (rect.left + rect.width / 2);
                var dy = e.clientY - (rect.top + rect.height / 2);
                el.style.transform = 'translate(' + dx * 0.18 + 'px,' + dy * 0.28 + 'px)';
            });
            el.addEventListener('pointerleave', function () {
                el.style.transform = '';
            });
        });
    }

    // ---------- 作品卡片 3D 倾斜 + 高光 ----------
    if (finePointer && !prefersReduced) {
        document.querySelectorAll('.project-card').forEach(function (card) {
            var shine = document.createElement('div');
            shine.className = 'card-shine';
            card.appendChild(shine);

            card.addEventListener('pointermove', function (e) {
                var rect = card.getBoundingClientRect();
                var px = (e.clientX - rect.left) / rect.width;
                var py = (e.clientY - rect.top) / rect.height;
                var rotY = (px - 0.5) * 6;
                var rotX = (0.5 - py) * 5;
                card.style.transform =
                    'perspective(1100px) rotateX(' + rotX.toFixed(2) + 'deg)' +
                    ' rotateY(' + rotY.toFixed(2) + 'deg) translateZ(4px)';
                shine.style.setProperty('--shine-x', (px * 100).toFixed(1) + '%');
                shine.style.setProperty('--shine-y', (py * 100).toFixed(1) + '%');
            });

            card.addEventListener('pointerleave', function () {
                card.style.transform = '';
            });
        });

        // ---------- 肖像框跟随倾斜 ----------
        var portrait = document.querySelector('.portrait-frame');
        if (portrait) {
            portrait.addEventListener('pointermove', function (e) {
                var rect = portrait.getBoundingClientRect();
                var px = (e.clientX - rect.left) / rect.width - 0.5;
                var py = (e.clientY - rect.top) / rect.height - 0.5;
                portrait.style.transform =
                    'perspective(900px) rotateY(' + (px * 8).toFixed(2) + 'deg)' +
                    ' rotateX(' + (-py * 8).toFixed(2) + 'deg)';
            });
            portrait.addEventListener('pointerleave', function () {
                portrait.style.transform = '';
            });
        }
    }

    // ---------- 复制联系方式 ----------
    var toast = document.createElement('div');
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
    var toastTimer = null;

    function showToast(text) {
        toast.textContent = text;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 1800);
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
            } catch (err) {
                reject(err);
            }
            document.body.removeChild(ta);
        });
    }

    document.querySelectorAll('.copy-chip').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var text = btn.getAttribute('data-copy');
            var label = btn.getAttribute('data-label') || '内容';
            copyText(text).then(function () {
                btn.classList.add('copied');
                showToast(label + '已复制 · COPIED');
                setTimeout(function () { btn.classList.remove('copied'); }, 1600);
            }).catch(function () {
                showToast('复制失败，请手动记录：' + text);
            });
        });
    });
})();

// ========== 胶片长廊：自动滚动 + 拖动浏览 + 灯箱放大 ==========
(function () {
    'use strict';

    // iOS Safari 禁用手势缩放（其忽略 viewport user-scalable=no）
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });

    var viewport = document.getElementById('galleryViewport');
    var track = document.getElementById('galleryTrack');
    if (!viewport || !track) return;

    // 复制内容实现无缝循环
    track.innerHTML += track.innerHTML;

    var paused = false;
    var resumeTimer = null;

    function autoStep() {
        if (!paused && !document.hidden) {
            viewport.scrollLeft += 0.55;
            var half = track.scrollWidth / 2;
            if (viewport.scrollLeft >= half) viewport.scrollLeft -= half;
        }
        requestAnimationFrame(autoStep);
    }
    requestAnimationFrame(autoStep);

    function pauseTemp() {
        paused = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () { paused = false; }, 2800);
    }
    ['pointerdown', 'wheel', 'touchstart'].forEach(function (ev) {
        viewport.addEventListener(ev, pauseTemp, { passive: true });
    });

    // ---------- 灯箱 ----------
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.innerHTML =
        '<div class="lightbox-close-hint">点击任意处关闭 ✕</div>' +
        '<div class="lightbox-frame"><img alt=""></div>' +
        '<div class="lightbox-caption"></div>';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector('img');
    var lbCaption = lightbox.querySelector('.lightbox-caption');

    function openLightbox(src, caption) {
        lbImg.src = src;
        lbCaption.textContent = caption || '';
        lightbox.classList.add('open');
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
    }

    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLightbox();
    });

    // 拖动与点击区分：位移超过阈值则不触发灯箱
    var downX = 0, downY = 0, dragged = false;
    viewport.addEventListener('pointerdown', function (e) {
        downX = e.clientX;
        downY = e.clientY;
        dragged = false;
    }, { passive: true });
    viewport.addEventListener('pointermove', function (e) {
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 10) dragged = true;
    }, { passive: true });

    track.addEventListener('click', function (e) {
        if (dragged) return;
        var item = e.target.closest('.gallery-item');
        if (!item) return;
        var img = item.querySelector('img');
        openLightbox(img.getAttribute('src'), item.getAttribute('data-caption'));
    });
})();
