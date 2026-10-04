/**
 * hero-scene.js
 * -------------------------------------------------------------
 * Clean Hero Scene
 * - No wireframe
 * - No orbit
 * - No mouse rotation
 * - No particles
 * - No scroll movement
 * - Does NOT move or tilt the profile image
 * -------------------------------------------------------------
 */

(function heroSceneModule() {

    const canvas = document.getElementById('heroCanvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        width = canvas.clientWidth || canvas.offsetWidth;
        height = canvas.clientHeight || canvas.offsetHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        clear();

    }


    function clear() {

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

    }


    /* ---------------------------------------------------------
       IMPORTANT:
       Canvas stays completely empty.
       This prevents old 3D objects, rings and particles
       from appearing behind the photo.
       --------------------------------------------------------- */

    function draw() {

        clear();

    }


    window.addEventListener(
        'resize',
        resize,
        { passive: true }
    );


    resize();

    draw();


})();