// Interactive snow canvas + toggle on home page
(function () {
	const canvas = document.getElementById('snowCanvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	let width = window.innerWidth;
	let height = window.innerHeight;
	let flakes = [];
	let mouse = { x: -9999, y: -9999 };
	let snowOn = true;
	let count = 600; // default number of flakes
	let maxFlakes = 2000;
	let lastTime = 0;

	function setSize() {
		width = window.innerWidth;
		height = window.innerHeight;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.floor(width * dpr));
		canvas.height = Math.max(1, Math.floor(height * dpr));
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function random(min, max) { return Math.random() * (max - min) + min; }

	class Flake {
		constructor() { this.reset(true); }
		reset(init = false) {
			this.x = random(0, width);
			this.y = init ? random(0, height) : -random(0, 50);
			this.radius = random(1, 4);
			this.speed = random(0.3, 1.0);
			this.wind = random(-0.4, 0.9);
			this.opacity = random(0.4, 0.95);
			this.tilt = random(-Math.PI, Math.PI);
			this.rotateSpeed = random(-0.01, 0.01);
		}
		update(delta) {
			this.tilt += this.rotateSpeed * delta * 0.06;
			this.x += this.wind * delta * 0.06;
			this.y += this.speed * delta * 0.06 + Math.sin(this.tilt) * 0.3;

			const dx = this.x - mouse.x;
			const dy = this.y - mouse.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (mouse.x > -1 && dist < 100) {
				const force = (100 - dist) / 100 * 6;
				this.x += (dx / (dist || 1)) * force * delta * 0.02;
				this.y += (dy / (dist || 1)) * force * delta * 0.02;
			}

			if (this.x > width + 50 || this.x < -50 || this.y > height + 50) this.reset(false);
		}
		draw() {
			ctx.beginPath();
			ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function initFlakes(n) {
		flakes = [];
		const realCount = Math.max(50, Math.min(n, maxFlakes));
		for (let i = 0; i < realCount; i++) flakes.push(new Flake());
	}

	function frame(time) {
		const delta = Math.min(32, time - lastTime) || 16;
		lastTime = time;
		ctx.clearRect(0, 0, width, height);
		if (snowOn) {
			for (let i = 0; i < flakes.length; i++) {
				flakes[i].update(delta);
				flakes[i].draw();
			}
		}
		requestAnimationFrame(frame);
	}

	function bindEvents() {
		window.addEventListener('resize', () => { setSize(); initFlakes(count); });
		window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
		window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
		window.addEventListener('touchmove', (e) => {
			if (e.touches && e.touches.length) {
				mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
			}
		}, { passive: true });
		window.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

		const toggleBtn = document.getElementById('toggleSnow');
		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => {
				snowOn = !snowOn;
				toggleBtn.textContent = snowOn ? 'Disattiva Neve' : 'Attiva Neve';
				toggleBtn.setAttribute('aria-pressed', snowOn ? 'true' : 'false');
			});
		}
	}

	function start() {
		setSize();
		initFlakes(count);
		bindEvents();
		lastTime = performance.now();
		requestAnimationFrame(frame);
	}

	document.addEventListener('DOMContentLoaded', start);
})();
