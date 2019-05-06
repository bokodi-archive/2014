var canvas, ctx, bounce;

window.addEventListener('load', init, false);

function init() {
	canvas = id('canvas');
	ctx = canvas.getContext('2d');
	id('start').addEventListener('click', initBounce, false);
	id('stop').addEventListener('click', stopBounce, false);
	id('f').onchange = function() { bounce.fps = 60 / id('f').value; };
	id('w').onchange = function() {
		ctx.canvas.width = +id('w').value;
		bounce.width = +id('w').value;
		bounce.ball.x = Math.floor(id('w').value / 2);
		id('x').value = +id('w').value / 2;
	};
	id('h').onchange = function() { ctx.canvas.height = +id('h').value; bounce.height = +id('h').value; };
	id('b').onchange = function() { bounce.bg = id('b').value; };
	id('x').onchange = function() { bounce.ball.x = +id('x').value; };
	id('y').onchange = function() { bounce.ball.y = +id('y').value; };
	id('r').onchange = function() { bounce.ball.radius = +id('r').value; };
	id('s').onchange = function() { bounce.ball.speed = +id('s').value; };
	id('c').onchange = function() { bounce.ball.color = id('c').value; };
	if (!('ellipse' in CanvasRenderingContext2D.prototype)) {
		CanvasRenderingContext2D.prototype.ellipse = function ellipse(x, y, w, h) {
			var that = this,
				kappa = .5522848,
				ox = w * kappa,
				oy = h * kappa,
				xe = x + w,
				ye = y + h,
				xm = x,
				ym = y;
			x -= w; y -= h;
			
			that.moveTo(x, ym);
			that.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
			that.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
			that.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
			that.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		};
	}
}

function id(id) { return document.getElementById(id); }

function initBounce() {
	if (!bounce) {
		bounce = new game({
			table: ctx,
			fps: 60 / +id('f').value,
			width: +id('w').value,
			height: +id('h').value,
			bg: id('b').value,
			ball: new ball({
				x: +id('w').value / 2,
				y: 50,
				radius: +id('r').value,
				speed: +id('s').value,
				color: id('c').value,
				dir: 1,
				ovalX: 1,
				ovalY: 1,
				stretchRate: 0.01
			})
		});
		bounce.start();
	} else if (!bounce.run) {
		bounce.start();
	}
}

function stopBounce() {
	if (bounce) { bounce.stop(); }
}

function game(props) {
	for (var elem in props) {
		this[elem] = props[elem];
	}
	this.tick = 0;
	this.table.canvas.width = this.width;
	this.table.canvas.height = this.height;
}

game.prototype.start = function() {
	if (!this.run) {
		this.loop();
		this.run = true;
	}
};

game.prototype.stop = function() {
	if (this.run) {
		window.cancelAnimationFrame(this.animation);
		this.run = false;
	}
};

game.prototype.loop = function() {
	var that = this;
	that.animation = window.requestAnimationFrame(function() {that.loop();});
	that.update();
	that.render();
};

game.prototype.render = function() {
	this.clear();
	this.drawBg();
	this.drawBall();
	this.showPos();
};

game.prototype.update = function() {
	if (++this.tick >= this.fps) {
		this.ball.move();
		this.tick = 0;
	}
};

game.prototype.clear = function() {
	this.table.clearRect(0, 0, this.width, this.height);
};

game.prototype.drawBg = function() {
	this.table.fillStyle = this.bg;
	this.table.fillRect(0, 0, this.width, this.height);	
};

game.prototype.drawBall = function() {
	this.table.beginPath();
	if (this.ball.ovalX == 1 && this.ball.ovalY == 1) {
		this.table.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2, false);
	} else {
		this.table.ellipse(this.ball.x, this.ball.y, this.ball.radius * this.ball.ovalX, this.ball.radius * this.ball.ovalY, 0, 0, 2 * Math.PI, false);
	}
	this.table.fillStyle = this.ball.color;
	this.table.fill();
	this.table.stroke();
};

game.prototype.showPos = function() {
	this.table.fillStyle = '#000000';
	this.table.fillText('x: ' + Math.floor(this.ball.x), 15, 15);
	this.table.fillText('y: ' + Math.floor(this.ball.y), 15, 30);
};

function ball(props) {
	for (var elem in props) {
		this[elem] = props[elem];
	}
}

ball.prototype.move = function() {
	if (this.y >= bounce.height - this.radius * this.ovalY && this.speed > 0) {
		this.stretch();
		if (this.ovalX > 1.15) { this.dir = -1; }
		if (this.dir == -1 && this.ovalX <= 1) {
			this.speed *= -1;
			this.dir = 1;
		}
		this.y = bounce.height - this.radius * this.ovalY;
	} else if (this.y <= this.radius * this.ovalY && this.speed < 0) {
		this.stretch();
		if (this.ovalX > 1.15) { this.dir = -1; }
		if (this.dir == -1 && this.ovalX <= 1) {
			this.speed *= -1;
			this.dir = 1;
		}
		this.y = this.radius * this.ovalY;
	} else {
		this.y = this.speed > 0 ? 
			Math.min(this.y + this.speed, bounce.height - this.radius * this.ovalY)
		:
			this.y = Math.max(this.y + this.speed, this.radius * this.ovalY)
		;
	}
};

ball.prototype.stretch = function() {
	this.ovalX += this.stretchRate * Math.abs(this.speed) * this.dir;
	this.ovalY -= this.stretchRate * Math.abs(this.speed) * this.dir;
};