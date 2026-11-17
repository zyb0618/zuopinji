/* ============ HERO 互动 3D：8mm 放映机 · 放映与彩蛋 ============ */
import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

const stage = document.getElementById('hero3dStage');
const canvas = document.getElementById('hero3dCanvas');
const statusLabel = document.getElementById('projectorStatus');
const star = document.getElementById('kodakStar');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let moment3DHook = null;
let momentTimer = 0;

/* ---- 全屏 Kodak Moment：星号与双击都可触发 ---- */
function showKodakMoment() {
    if (moment3DHook) moment3DHook();
    document.querySelectorAll('.kodak-moment').forEach((el) => el.remove());

    const moment = document.createElement('div');
    moment.className = 'kodak-moment';
    moment.setAttribute('aria-hidden', 'true');
    moment.innerHTML = '<div class="moment-card"><span class="moment-star">✳</span><b>KODAK<br>MOMENT</b><small>保持热爱 · 继续拍 / KEEP SHOOTING</small></div>';

    const colors = ['#FFC800', '#ED0000', '#141412', '#FAF9F6'];
    for (let i = 0; i < 42; i += 1) {
        const piece = document.createElement('i');
        piece.className = 'moment-confetti';
        piece.style.setProperty('--x', `${Math.random() * 100}vw`);
        piece.style.setProperty('--w', `${5 + Math.random() * 9}px`);
        piece.style.setProperty('--c', colors[i % colors.length]);
        piece.style.setProperty('--d', `${Math.random() * 0.35}s`);
        piece.style.setProperty('--r', `${360 + Math.random() * 900}deg`);
        piece.style.setProperty('--drift', `${-120 + Math.random() * 240}px`);
        moment.appendChild(piece);
    }
    document.body.appendChild(moment);
    window.clearTimeout(momentTimer);
    momentTimer = window.setTimeout(() => moment.remove(), reduceMotion ? 1400 : 2350);
}

if (star) star.addEventListener('click', showKodakMoment);

if (stage && canvas) {
    try {
        init();
    } catch (error) {
        stage.style.display = 'none';
        console.warn('3D 初始化失败', error);
    }
}

function init() {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.55, 6);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.HemisphereLight(0xfffdf4, 0x75643f, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.75);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff6e0, 0.65);
    fill.position.set(-3, 1, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffc800, 1.25);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const group = new THREE.Group();
    group.position.x = -0.3;
    scene.add(group);

    /* 柔和接触阴影：让模型悬浮但不失重 */
    function makeShadowTexture() {
        const shadow = document.createElement('canvas');
        shadow.width = shadow.height = 256;
        const ctx = shadow.getContext('2d');
        const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
        gradient.addColorStop(0, 'rgba(20,20,18,.32)');
        gradient.addColorStop(0.45, 'rgba(20,20,18,.13)');
        gradient.addColorStop(1, 'rgba(20,20,18,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(shadow);
    }
    const contactShadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeShadowTexture(), transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }));
    contactShadow.position.set(-0.3, -1.1, -0.35);
    contactShadow.scale.set(2.35, 0.52, 1);
    scene.add(contactShadow);

    const slides = [
        { src: 'project1.webp', title: '光影叙事', en: 'LIGHT NARRATIVE' },
        { src: 'project2.webp', title: '显影时间', en: 'DEVELOPING TIME' },
        { src: 'project3.webp', title: '帧间记忆', en: 'FRAME MEMORY' },
        { src: 'project4.webp', title: '城市显影', en: 'CITY IN FRAME' }
    ];
    const slideTextures = new Array(slides.length);
    let slideIndex = 0;
    let slidePulse = 0;
    let projecting = false;
    let projectMix = 0;
    let lastSlideAt = 0;
    let ready = false;
    let focusNode = null;
    let switchNode = null;
    let switchBase = 0;
    let spinRemaining = 0;
    let settleToLens = false;
    const reels = [];

    /* ---- 投影照片卡：真实作品 + 编辑式编号 ---- */
    const screenGroup = new THREE.Group();
    screenGroup.position.set(1.12, 0.58, 0.16);
    screenGroup.rotation.set(-0.055, -0.18, 0.025);
    scene.add(screenGroup);

    const backMaterial = new THREE.MeshBasicMaterial({ color: 0xffc800, transparent: true, opacity: 0, toneMapped: false });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 1.22), backMaterial);
    back.position.z = -0.018;
    screenGroup.add(back);

    const screenMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.0875), screenMaterial);
    screenGroup.add(screen);

    const tapeMaterial = new THREE.MeshBasicMaterial({ color: 0xed0000, transparent: true, opacity: 0, toneMapped: false });
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.085), tapeMaterial);
    tape.position.set(0.47, 0.565, 0.025);
    tape.rotation.z = -0.12;
    screenGroup.add(tape);
    screenGroup.visible = false;

    function drawCover(ctx, image, x, y, w, h) {
        const scale = Math.max(w / image.width, h / image.height);
        const sw = w / scale;
        const sh = h / scale;
        ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h);
    }

    function makeSlideTexture(image, slide, index) {
        const card = document.createElement('canvas');
        card.width = 800;
        card.height = 600;
        const ctx = card.getContext('2d');
        ctx.fillStyle = '#FAF9F6';
        ctx.fillRect(0, 0, 800, 600);
        drawCover(ctx, image, 0, 0, 800, 450);
        ctx.fillStyle = '#141412';
        ctx.fillRect(0, 449, 800, 3);
        ctx.fillStyle = '#ED0000';
        ctx.fillRect(32, 486, 10, 56);
        ctx.fillStyle = '#141412';
        ctx.font = '700 34px "Noto Serif SC", serif';
        ctx.fillText(slide.title, 64, 516);
        ctx.fillStyle = '#6E6C65';
        ctx.font = '18px "IBM Plex Mono", monospace';
        ctx.fillText(`${String(index + 1).padStart(2, '0')} / ${slide.en}`, 64, 552);
        ctx.fillStyle = '#FFC800';
        ctx.fillRect(690, 478, 76, 76);
        ctx.fillStyle = '#141412';
        ctx.font = '42px "Fraunces", serif';
        ctx.fillText('✳', 707, 532);
        const texture = new THREE.CanvasTexture(card);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        return texture;
    }

    function setSlide(index) {
        slideIndex = (index + slides.length) % slides.length;
        slidePulse = 1;
        if (projecting && statusLabel) statusLabel.textContent = `NOW SHOWING · ${String(slideIndex + 1).padStart(2, '0')}/04`;
        if (slideTextures[slideIndex]) {
            screenMaterial.map = slideTextures[slideIndex];
            screenMaterial.needsUpdate = true;
            return;
        }
        const requested = slideIndex;
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
            slideTextures[requested] = makeSlideTexture(image, slides[requested], requested);
            if (slideIndex === requested) {
                screenMaterial.map = slideTextures[requested];
                screenMaterial.needsUpdate = true;
            }
        };
        image.src = slides[requested].src;
    }

    /* ---- 光束、镜头光晕与胶片尘埃 ---- */
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd75e,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.035, 1, 32, 1, true), beamMaterial);
    scene.add(beam);
    beam.visible = false;

    function glowTexture() {
        const glow = document.createElement('canvas');
        glow.width = glow.height = 128;
        const ctx = glow.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.18, 'rgba(255,220,90,.9)');
        gradient.addColorStop(0.5, 'rgba(255,200,0,.28)');
        gradient.addColorStop(1, 'rgba(255,200,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(glow);
    }
    const flareMaterial = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const flare = new THREE.Sprite(flareMaterial);
    flare.scale.set(0.48, 0.48, 1);
    scene.add(flare);
    flare.visible = false;

    const dustCount = 72;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
        dustPositions[i * 3] = -0.15 + Math.random() * 1.35;
        dustPositions[i * 3 + 1] = -0.15 + Math.random() * 1.15;
        dustPositions[i * 3 + 2] = -0.35 + Math.random() * 0.8;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({ color: 0xffc800, size: 0.026, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    dust.visible = false;

    /* ---- 模型与可动部件 ---- */
    new GLTFLoader().load(
        'models/filmstrip_projector_8mm/filmstrip_projector_8mm_1k.gltf',
        (gltf) => {
            const model = gltf.scene;

            /* 无线展示版：先移除插头、电线和连接件，再计算主体比例 */
            const cableParts = new Set([
                'filmstrip_projector_8mm_schuko',
                'filmstrip_projector_8mm_cable',
                'filmstrip_projector_8mm_connector',
                'filmstrip_projector_8mm_cable_curve'
            ]);
            const cableNodes = [];
            model.traverse((node) => { if (cableParts.has(node.name)) cableNodes.push(node); });
            cableNodes.forEach((node) => { if (node.parent) node.parent.remove(node); });
            stage.dataset.cableRemoved = String(cableNodes.length > 0);

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            const scale = 2.85 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            group.add(model);
            group.rotation.set(0.18, 0.72, 0);

            ['filmstrip_projector_8mm_spool_takeup', 'filmstrip_projector_8mm_spool_feed'].forEach((name, index) => {
                const reel = model.getObjectByName(name);
                if (!reel || !reel.geometry) return;
                reel.geometry.computeBoundingBox();
                const bounds = reel.geometry.boundingBox.getSize(new THREE.Vector3());
                const axis = bounds.x <= bounds.y && bounds.x <= bounds.z ? 'x' : (bounds.y <= bounds.z ? 'y' : 'z');
                reels.push({ object: reel, axis, speed: index === 0 ? 0.07 : -0.07 });
            });
            focusNode = model.getObjectByName('filmstrip_projector_8mm_focus');
            switchNode = model.getObjectByName('filmstrip_projector_8mm_switch');
            if (switchNode) switchBase = switchNode.rotation.x;

            ready = true;
            stage.classList.add('ready');
            setSlide(0);
        },
        undefined,
        () => { stage.style.display = 'none'; }
    );

    /* ---- 状态与彩蛋联动 ---- */
    const clock = new THREE.Clock();
    let autoSpin = !reduceMotion;

    function setProjecting(on) {
        projecting = on;
        stage.classList.toggle('projecting', on);
        stage.setAttribute('aria-pressed', String(on));
        autoSpin = !on && !reduceMotion;
        settleToLens = on;
        if (on) {
            setSlide(slideIndex);
            lastSlideAt = clock.getElapsedTime();
        } else if (statusLabel) {
            statusLabel.textContent = 'STANDBY · 点击放映';
        }
    }

    moment3DHook = () => {
        if (!ready) return;
        if (!projecting) setProjecting(true);
        setSlide(0);
        settleToLens = false;
        if (!reduceMotion) spinRemaining += Math.PI * 2;
    };

    /* ---- 拖拽旋转、点击放映、双击彩蛋 ---- */
    let dragging = false;
    let moved = false;
    let suppressClick = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let velY = 0;
    let velX = 0;
    let clickTimer = 0;

    stage.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        dragging = true;
        moved = false;
        downX = lastX = event.clientX;
        downY = lastY = event.clientY;
        velY = 0;
        velX = 0;
        autoSpin = false;
        settleToLens = false;
        stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        if (Math.hypot(event.clientX - downX, event.clientY - downY) > 7) moved = true;
        velY = dx * 0.008;
        velX = dy * 0.005;
        group.rotation.y += velY;
        group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velX, -0.6, 0.8);
    });
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        if (moved) suppressClick = true;
        window.setTimeout(() => { if (!projecting) autoSpin = !reduceMotion; }, 2200);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('click', () => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        window.clearTimeout(clickTimer);
        clickTimer = window.setTimeout(() => { if (ready) setProjecting(!projecting); }, 250);
    });
    stage.addEventListener('dblclick', (event) => {
        event.preventDefault();
        window.clearTimeout(clickTimer);
        if (ready) showKodakMoment();
    });
    stage.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (ready) setProjecting(!projecting);
        }
    });

    function resize() {
        const width = stage.clientWidth || 300;
        const height = stage.clientHeight || 300;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(stage);
    resize();

    const lensPosition = new THREE.Vector3();
    const beamDirection = new THREE.Vector3();
    const yAxis = new THREE.Vector3(0, 1, 0);

    renderer.setAnimationLoop(() => {
        const time = clock.getElapsedTime();
        if (ready) {
            if (!dragging) {
                group.rotation.y += velY;
                group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velX, -0.6, 0.8);
                velY *= 0.94;
                velX *= 0.94;
                if (autoSpin) group.rotation.y += 0.0035;
                if (spinRemaining > 0) {
                    const step = Math.min(spinRemaining, 0.13);
                    group.rotation.y += step;
                    spinRemaining -= step;
                }
                if (projecting && settleToLens && spinRemaining === 0) {
                    const delta = Math.atan2(Math.sin(0.62 - group.rotation.y), Math.cos(0.62 - group.rotation.y));
                    group.rotation.y += delta * 0.055;
                }
            }

            if (projecting && !reduceMotion) {
                reels.forEach((reel) => { reel.object.rotation[reel.axis] += reel.speed; });
                if (time - lastSlideAt > 4.8) {
                    setSlide(slideIndex + 1);
                    lastSlideAt = time;
                }
            }
            if (switchNode) switchNode.rotation.x = THREE.MathUtils.lerp(switchNode.rotation.x, switchBase + (projecting ? 0.38 : 0), 0.12);

            group.position.y = reduceMotion ? 0 : Math.sin(time * 1.2) * 0.065 + (projecting ? Math.sin(time * 18) * 0.004 : 0);
            group.position.x = THREE.MathUtils.lerp(group.position.x, projecting ? -0.68 : -0.3, 0.06);
            contactShadow.position.x = group.position.x + 0.06;
            const shadowScale = 1 - (reduceMotion ? 0 : Math.sin(time * 1.2) * 0.035);
            contactShadow.scale.set(2.35 * shadowScale, 0.52 * shadowScale, 1);
        }

        projectMix = reduceMotion ? (projecting ? 1 : 0) : THREE.MathUtils.lerp(projectMix, projecting ? 1 : 0, 0.085);
        const effectsOn = projectMix > 0.012;
        screenGroup.visible = effectsOn;
        beam.visible = effectsOn;
        flare.visible = effectsOn;
        dust.visible = effectsOn;

        if (effectsOn) {
            screenMaterial.opacity = projectMix;
            backMaterial.opacity = projectMix;
            tapeMaterial.opacity = projectMix;
            beamMaterial.opacity = projectMix * (0.105 + Math.sin(time * 8) * 0.012);
            flareMaterial.opacity = projectMix * 0.82;
            dustMaterial.opacity = projectMix * 0.58;
            slidePulse *= 0.88;
            const cardScale = 0.7 + projectMix * 0.3 + slidePulse * 0.045;
            screenGroup.scale.setScalar(cardScale);
            screenGroup.position.y = 0.58 + (reduceMotion ? 0 : Math.sin(time * 1.4) * 0.035);
            dust.rotation.y = reduceMotion ? 0 : Math.sin(time * 0.3) * 0.08;

            if (focusNode) focusNode.getWorldPosition(lensPosition);
            else lensPosition.set(-0.2, 0.2, 0.5);
            beamDirection.subVectors(screenGroup.position, lensPosition);
            const beamLength = Math.max(0.01, beamDirection.length());
            beam.position.copy(lensPosition).addScaledVector(beamDirection, 0.5);
            beam.scale.set(1, beamLength, 1);
            beam.quaternion.setFromUnitVectors(yAxis, beamDirection.normalize());
            flare.position.copy(lensPosition);
            const flareScale = 0.43 + Math.sin(time * 7) * 0.035;
            flare.scale.set(flareScale, flareScale, 1);
        }
        renderer.render(scene, camera);
    });
}
