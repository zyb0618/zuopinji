// ========== 3D 场景：金色尘埃粒子 + 悬浮胶片卷轴 + 胶片飘带 ==========
import * as THREE from './vendor/three.module.js';

const canvas = document.getElementById('scene3d');
if (canvas) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isTouch });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ---------- 主题配色（随暗房模式切换）----------
    const PALETTE = {
        normal:   { gold: 0xc9a86c, dim: 0x7a6b52, rose: 0xa67b7b, dust: 0xd8bd8a },
        darkroom: { gold: 0x9a9a9a, dim: 0x555555, rose: 0x666666, dust: 0xaaaaaa },
    };
    let palette = PALETTE.normal;

    // ---------- 灯光 ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.PointLight(palette.gold, 60, 40);
    keyLight.position.set(4, 3, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(palette.rose, 18, 40);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    // ---------- 金色尘埃粒子 ----------
    const DUST_COUNT = isTouch ? 450 : 900;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(DUST_COUNT * 3);
    const seed = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 22;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        seed[i] = Math.random() * Math.PI * 2;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({
        color: palette.dust,
        size: 0.045,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ---------- 悬浮胶片卷轴（右侧）----------
    const reel = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
        color: palette.dim, metalness: 0.85, roughness: 0.35,
        transparent: true, opacity: 0.9,
    });
    const goldMat = new THREE.MeshStandardMaterial({
        color: palette.gold, metalness: 0.9, roughness: 0.25,
        transparent: true, opacity: 0.9,
    });

    // 两片法兰盘
    const flangeGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.06, 48);
    const flangeA = new THREE.Mesh(flangeGeo, metal);
    const flangeB = new THREE.Mesh(flangeGeo, metal);
    flangeA.position.y = 0.5;
    flangeB.position.y = -0.5;
    reel.add(flangeA, flangeB);

    // 中心轴 + 轮毂
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 24), goldMat);
    reel.add(hub);

    // 辐条
    const spokeGeo = new THREE.BoxGeometry(2.5, 0.05, 0.12);
    for (let i = 0; i < 3; i++) {
        const spoke = new THREE.Mesh(spokeGeo, goldMat);
        spoke.rotation.y = (i / 3) * Math.PI;
        reel.add(spoke);
    }

    // 缠绕的胶片（暗色圆柱）
    const filmRoll = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.05, 0.85, 48),
        new THREE.MeshStandardMaterial({ color: 0x14110d, metalness: 0.3, roughness: 0.7 })
    );
    reel.add(filmRoll);

    reel.rotation.z = Math.PI / 2.2;
    reel.rotation.x = 0.35;
    reel.position.set(3.6, 0.6, -1.5);
    reel.scale.setScalar(0.9);
    scene.add(reel);

    // ---------- 胶片飘带（沿曲线展开的暗色带子，缀以金色齿孔光点）----------
    const ribbonCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-7, -2.5, -3),
        new THREE.Vector3(-3.5, -1.2, -1),
        new THREE.Vector3(-1, -2.2, -2.5),
        new THREE.Vector3(2, -3.2, -4),
        new THREE.Vector3(6, -2.0, -5),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 120, 0.16, 6, false);
    const ribbonMat = new THREE.MeshStandardMaterial({
        color: palette.gold, metalness: 0.7, roughness: 0.4,
        transparent: true, opacity: 0.35,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    scene.add(ribbon);

    // ---------- 悬浮 3D 照片卡（真实作品素材贴图）----------
    const texLoader = new THREE.TextureLoader();
    const photoCards = [];
    const cardDefs = [
        { src: 'project1.jpg', x: -4.6, y: 1.3, z: -1.8, s: 1.05 },
        { src: 'project2.jpg', x: -3.2, y: -1.0, z: -0.6, s: 0.85 },
        { src: 'project3.jpg', x: -5.4, y: -0.5, z: -3.2, s: 0.95 },
        { src: 'project4.jpg', x: -2.4, y: 1.9, z: -2.6, s: 0.75 },
    ];
    cardDefs.forEach((def, i) => {
        const group = new THREE.Group();
        // 金色相框底板
        const frame = new THREE.Mesh(
            new THREE.PlaneGeometry(def.s * 1.1, def.s * 1.38),
            goldMat
        );
        group.add(frame);
        texLoader.load(def.src, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            const aspect = tex.image.width / tex.image.height;
            const h = def.s * 1.2;
            const w = h * Math.min(aspect, 1.45);
            const photo = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshBasicMaterial({ map: tex })
            );
            photo.position.z = 0.012;
            group.add(photo);
        });
        group.position.set(def.x, def.y, def.z);
        group.rotation.y = 0.45;
        scene.add(group);
        photoCards.push({ group, baseY: def.y, phase: i * 1.7 });
    });

    // ---------- 交互状态 ----------
    let mouseX = 0, mouseY = 0;
    let scrollFade = 1;
    let heroVisible = true;
    let burstEnergy = 0;

    window.addEventListener('pointermove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    // ---------- 点击 / 触摸互动：粒子迸发 + 卷轴加速 + 灯光脉冲 ----------
    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a, button')) return;
        if (window.scrollY < window.innerHeight * 0.8) {
            burstEnergy = Math.min(burstEnergy + 1, 2.5);
        }
    });

    // ---------- 陀螺仪视差（手机端）----------
    let gyroX = 0, gyroY = 0, gyroActive = false;

    function handleOrientation(e) {
        if (e.gamma === null || e.beta === null) return;
        gyroActive = true;
        // gamma 左右倾斜、beta 前后倾斜，映射到 [-1, 1]
        gyroX = Math.max(-1, Math.min(1, e.gamma / 30));
        gyroY = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
    }

    if (isTouch && typeof DeviceOrientationEvent !== 'undefined') {
        const gyroBtn = document.createElement('button');
        gyroBtn.className = 'gyro-toggle';
        gyroBtn.type = 'button';
        gyroBtn.textContent = '✦ 开启陀螺仪互动';
        document.body.appendChild(gyroBtn);

        gyroBtn.addEventListener('click', async () => {
            // iOS 13+ 需要用户手势内请求权限
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const res = await DeviceOrientationEvent.requestPermission();
                    if (res !== 'granted') {
                        gyroBtn.textContent = '未授权 · 可用手指滑动视角';
                        setTimeout(() => gyroBtn.classList.add('fade'), 2500);
                        return;
                    }
                } catch (err) {
                    gyroBtn.textContent = '不可用 · 可用手指滑动视角';
                    setTimeout(() => gyroBtn.classList.add('fade'), 2500);
                    return;
                }
            }
            window.addEventListener('deviceorientation', handleOrientation);
            gyroBtn.classList.add('active');
            gyroBtn.textContent = '✦ 陀螺仪已开启 · 转动手机试试';
            burstEnergy = 1.5;
            setTimeout(() => gyroBtn.classList.add('fade'), 3000);
        });
    }

    window.addEventListener('scroll', () => {
        const vh = window.innerHeight;
        scrollFade = Math.max(0, 1 - (window.scrollY / vh) * 1.1);
    }, { passive: true });

    new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(document.getElementById('home'));

    // 暗房模式联动
    new MutationObserver(() => {
        palette = document.body.getAttribute('data-theme') === 'darkroom'
            ? PALETTE.darkroom : PALETTE.normal;
        dustMat.color.setHex(palette.dust);
        metal.color.setHex(palette.dim);
        goldMat.color.setHex(palette.gold);
        ribbonMat.color.setHex(palette.gold);
        keyLight.color.setHex(palette.gold);
        rimLight.color.setHex(palette.rose);
    }).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // ---------- 尺寸 ----------
    function resize() {
        const hero = document.getElementById('home');
        const w = hero.clientWidth, h = hero.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // ---------- 动画循环 ----------
    const clock = new THREE.Clock();
    function tick() {
        requestAnimationFrame(tick);
        if (!heroVisible || scrollFade <= 0.01) return;

        const t = clock.getElapsedTime();
        const motion = prefersReduced ? 0.15 : 1;

        // 迸发能量衰减与特效
        burstEnergy *= 0.94;
        keyLight.intensity = 60 + burstEnergy * 90;
        dustMat.size = 0.045 + burstEnergy * 0.035;

        // 粒子缓慢上浮漂移（迸发时向外加速）
        const p = dustGeo.attributes.position.array;
        const driftBoost = 1 + burstEnergy * 6;
        for (let i = 0; i < DUST_COUNT; i++) {
            p[i * 3 + 1] += Math.sin(t * 0.4 + seed[i]) * 0.0012 * motion * driftBoost;
            p[i * 3]     += Math.cos(t * 0.25 + seed[i]) * 0.0008 * motion * driftBoost;
        }
        dustGeo.attributes.position.needsUpdate = true;
        dust.rotation.y = t * 0.02 * motion;

        // 卷轴自转（迸发时加速）+ 呼吸浮动
        reel.rotation.y += (0.004 + burstEnergy * 0.05) * motion;
        reel.position.y = 0.6 + Math.sin(t * 0.6) * 0.15 * motion;

        // 飘带轻摆
        ribbon.rotation.z = Math.sin(t * 0.3) * 0.03 * motion;

        // 悬浮照片卡：呼吸浮动 + 慢转，迸发时翻面旋转
        photoCards.forEach((c) => {
            c.group.position.y = c.baseY + Math.sin(t * 0.5 + c.phase) * 0.18 * motion;
            c.group.rotation.y = 0.45 + Math.sin(t * 0.3 + c.phase) * 0.12 * motion + burstEnergy * 0.5;
        });

        // 相机视差：手机陀螺仪优先，其次鼠标 / 手指滑动
        const inputX = gyroActive ? gyroX : mouseX;
        const inputY = gyroActive ? gyroY : mouseY;
        camera.position.x += (inputX * 1.0 * motion - camera.position.x) * 0.05;
        camera.position.y += (-inputY * 0.6 * motion - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        canvas.style.opacity = (scrollFade * 0.9).toFixed(3);
        renderer.render(scene, camera);
    }
    tick();
}
