/* ========== 开场 Intro 播放逻辑 · 胶片档案 ========== */
(function () {
    'use strict';

    var layer = document.getElementById('introLayer');
    if (!layer) return;

    var video = document.getElementById('introVideo');
    var playBtn = document.getElementById('introPlayBtn');
    var soundBtn = document.getElementById('introSoundBtn');
    var skipBtn = document.getElementById('introSkipBtn');
    var progressFill = document.getElementById('introProgressFill');
    var hint = document.getElementById('introHint');

    var finished = false;
    var FAILSAFE_MS = 10000;

    // 锁定页面滚动
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function unlockScroll() {
        document.body.style.overflow = prevOverflow || '';
    }

    // 播完 / 跳过 → 淡出融入背景
    function finishIntro() {
        if (finished) return;
        finished = true;

        try { video.pause(); } catch (e) {}

        layer.classList.add('leaving');

        var removed = false;
        function removeLayer() {
            if (removed) return;
            removed = true;
            if (layer.parentNode) layer.parentNode.removeChild(layer);
            unlockScroll();
            document.dispatchEvent(new CustomEvent('intro:finished'));
        }

        layer.addEventListener('transitionend', function onEnd(e) {
            if (e.target === layer) removeLayer();
        });
        // 兜底：transitionend 未触发时强制移除
        setTimeout(removeLayer, 2000);
    }

    // 播放进度 → 片带进度条
    function updateProgress() {
        if (!video.duration) return;
        var pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = pct.toFixed(2) + '%';
    }

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', finishIntro);
    video.addEventListener('error', finishIntro);

    skipBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        finishIntro();
    });

    // 打开声音
    function enableSound() {
        video.muted = false;
        video.volume = 1;
        soundBtn.textContent = 'SOUND ON';
        soundBtn.setAttribute('aria-label', '关闭声音');
        soundBtn.classList.remove('attention');
        if (hint) hint.classList.remove('show');
    }

    function disableSoundUI() {
        soundBtn.textContent = 'SOUND OFF';
        soundBtn.setAttribute('aria-label', '开启声音');
    }

    soundBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (video.muted) {
            enableSound();
        } else {
            video.muted = true;
            disableSoundUI();
        }
    });

    // 声音被浏览器拦截时：轻触画面任意处即可开声（一次性）
    layer.addEventListener('click', function () {
        if (!finished && video.muted && !video.paused) {
            enableSound();
        }
    });

    function showSoundFallback() {
        // 有声自动播放被拦截 → 静音播放 + 引导用户开声
        video.muted = true;
        disableSoundUI();
        soundBtn.classList.add('attention');
        if (hint) hint.classList.add('show');
        video.play().catch(function () {
            playBtn.classList.add('visible');
        });
    }

    // 优先尝试「带声音」自动播放
    function tryPlay() {
        soundBtn.classList.add('show');
        skipBtn.classList.add('show');

        video.muted = false;
        video.volume = 1;
        var p = video.play();
        if (p && typeof p.catch === 'function') {
            p.then(function () {
                // 带声播放成功
                enableSound();
            }).catch(function () {
                showSoundFallback();
            });
        } else {
            // 老浏览器无 Promise：假设成功，error 事件兜底
            enableSound();
        }
    }

    playBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        playBtn.classList.remove('visible');
        // 用户手势后可以放心带声音播放
        enableSound();
        video.play().catch(finishIntro);
    });

    // 兜底：视频迟迟无法开始播放则直接进入网站
    var failsafe = setTimeout(function () {
        if (!finished && video.currentTime < 0.5 && video.paused) {
            finishIntro();
        }
    }, FAILSAFE_MS);

    video.addEventListener('playing', function () {
        clearTimeout(failsafe);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryPlay);
    } else {
        tryPlay();
    }
})();
