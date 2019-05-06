'use strict';

var defaults = {
		rows: 10,
		cols: 10,
		rules: {
			base: 10,
			incoming: 3,
			required: 5,
			scorePerBall: 10,
			scoreMultiplier: 2,
			colors: [
				{
					colorId: 1,
					name: 'green',
					colorStops: {
						'1': {to: 0,	value: '#A7D30C'},
						'2': {to: 0.95,	value: '#019F62'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				},
				{
					colorId: 2,
					name: 'red',
					colorStops: {
						'1': {to: 0,	value: '#ff8c8c'},
						'2': {to: 0.95,	value: '#ff0000'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				},
				{
					colorId: 3,
					name: 'blue',
					colorStops: {
						'1': {to: 0,	value: '#52a0f8'},
						'2': {to: 0.95,	value: '#0f15ff'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				},
				{
					colorId: 4,
					name: 'yellow',
					colorStops: {
						'1': {to: 0,	value: '#ffff8a'},
						'2': {to: 0.95,	value: '#FCFC00'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				},
				{
					colorId: 5,
					name: 'grey',
					colorStops: {
						'1': {to: 0,	value: '#b8d8d8'},
						'2': {to: 0.95,	value: '#547875'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				},
				{
					colorId: 6,
					name: 'pink',
					colorStops: {
						'1': {to: 0,	value: '#ffe1ff'},
						'2': {to: 0.95,	value: '#ff80ff'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				},
				{
					colorId: 7,
					name: 'orange',
					colorStops: {
						'1': {to: 0,	value: '#ffd1a4'},
						'2': {to: 0.95,	value: '#ff8000'},
						'3': {to: 1,	value: 'rgba(255, 255, 255, 0)'}
					}
				}
			]
		},
		display: {
			bg: '#eeeeee',
			minBlock: 30,
			font: '14px Arial',
			line: {
				width: 1,
				color: '#888888'
			},
			balls: {
				line: {
					width: 0.3,
					color: 'rgba(0,0,0,0.2)'
				},
				shadow: {
					offX: 1,
					offY: 1,
					blur: 4,
					color: 'rgba(0,0,0,0.5)'
				},
				gradientPos: {
					x: 0.2,
					y: 0.2
				}
			}
		},
	}, game;

window.onload = init;
function init() {
	fixEllipse();
	var canvasBg = document.getElementById('canvasBg'),
		canvasContent = document.getElementById('canvasContent'),
		ctxBg = canvasBg.getContext('2d'),
		ctxContent = canvasContent.getContext('2d');
	game = new Game(defaults, {background: ctxBg, table: ctxContent});
	game.start();
	window.onresize = function() {
		game.resize();
		game.drawBackground();
		game.fillContent();
	};
	canvasContent.onclick = function(e) {
		if (!e) { var e = window.event; }
		if (!e.offsetX) {
			e.offsetX = e.layerX - e.currentTarget.offsetLeft;
			e.offsetY = e.layerY - e.currentTarget.offsetTop;
		}
		game.action(e.offsetX, e.offsetY);
	};
}

function Game(settings, canvases) {
	for (var key in settings) {
		this[key] = settings[key];
	}
	this.background = canvases.background;
	this.table = canvases.table;
	this.event = {};
	Ball.prototype = this.display.balls;
	this.display.balls.pos = function() {
		return {x: this.x * this.field + this.field / 2, y: this.y * this.field + this.field / 2};
	};
}

function Ball(settings) {
	for (var key in settings) {
		this[key] = settings[key];
	}
}

Game.prototype.start = function() {
	this.resize();
	this.drawBackground();
	this.content = [];
	this.score = 0;
	for (var i = 0; i < this.rows; i++) {
		this.content.push([]);
	}
	this.addBalls(this.rules.base);
};

Game.prototype.resize = function() {
	this.display.block = Math.max(Math.min(
		Math.floor(window.innerWidth / this.cols * 0.9),
		Math.floor(window.innerHeight / this.rows * 0.9)
	), this.display.minBlock);
	this.display.balls.radius = this.display.block * 0.44;
	this.display.balls.field = this.display.block;
	this.width = this.cols * this.display.block;
	this.height = this.rows * this.display.block;
	this.background.canvas.width = this.width;
	this.background.canvas.height = this.height;
	this.table.canvas.width = this.width;
	this.table.canvas.height = this.height;
	document.getElementById('game').style.width = game.width + 'px';
};

Game.prototype.drawBackground = function() {
	this.background.fillStyle = this.display.bg;
	this.background.fillRect(0, 0, this.width, this.height);
	this.grid();
};

Game.prototype.grid = function() {
	this.background.lineWidth = this.display.line.width;
	this.background.strokeStyle = this.display.line.color;
	this.background.beginPath();
	for (var i = 0; i <= this.width; i += this.display.block) {
		this.background.moveTo(i, 0);
		this.background.lineTo(i, this.height);
	}
	for (var i = 0; i <= this.height; i += this.display.block) {
		this.background.moveTo(0, i);
		this.background.lineTo(this.width, i);
	}
	this.background.closePath();
	this.background.stroke();
};

Game.prototype.addBalls = function(amount) {
	var pos;
	for (var i = 0; i < amount; i++) {
		do {
			pos = this.randomPos();
		} while (this.content[pos.x][pos.y]);
		this.content[pos.x][pos.y] = new Ball({
			x: pos.x,
			y: pos.y,
			color: this.randomColor()
		});
		this.drawBall(pos.x, pos.y);
		this.explode(this.content[pos.x][pos.y]);
	}
};

Game.prototype.drawBall = function(a, b) {
	var ball = this.content[a][b];
	if (ball) {
		this.table.beginPath();
		this.table.arc(ball.pos().x, ball.pos().y, ball.radius, 0, Math.PI * 2, false);
		this.setStyle(ball);
		this.table.fill();
		this.table.stroke();
		this.resetStyle();
	}
};

Game.prototype.fillContent = function() {
	for (var i = 0, j; i < this.content.length; i++) {
		for (j = 0; j < this.content[i].length; j++) {
			if (this.content[i][j]) { this.drawBall(i, j); }
		}
	}
};

Game.prototype.setStyle = function(ball) {
	this.table.lineWidth = ball.line.width;
	this.table.strokeStyle = ball.line.color;
	this.table.shadowBlur = ball.shadow.blur;
	this.table.shadowColor = ball.shadow.color;
	this.table.shadowOffsetY = ball.shadow.offX;
	this.table.shadowOffsetX = ball.shadow.offY;
	var grd = this.table.createRadialGradient(ball.pos().x + (ball.gradientPos.x - 0.5) * ball.radius, ball.pos().y + (ball.gradientPos.x - 0.5) * ball.radius, 0, ball.pos().x + ball.radius / 2, ball.pos().y + ball.radius / 2, ball.radius * 2);
	for (var key in ball.color.colorStops) {
		grd.addColorStop(ball.color.colorStops[key].to, ball.color.colorStops[key].value);
	}
	this.table.fillStyle = grd;
};

Game.prototype.resetStyle = function() {
	this.table.shadowBlur = 0;
	this.table.shadowColor = 'rgba(0, 0, 0, 0)';
};

Game.prototype.randomPos = function() {
	return {x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows)};
};

Game.prototype.randomColor = function() {
	return this.rules.colors[Math.floor(Math.random() * Object.keys(this.rules.colors).length)];
};

Game.prototype.action = function(mouseX, mouseY) {
	this.event.x = Math.floor(mouseX / this.display.block);
	this.event.y = Math.floor(mouseY / this.display.block);
	this.event.target = this.content[this.event.x][this.event.y];
	this.handleEvent();
};

Game.prototype.handleEvent = function() {
	if (this.event.selected) {
		if (this.event.selected == this.event.target) {
			this.deSelect();
		} else if (!this.event.target) {
			this.pathFind();
		} else {
			// engaged
		}
	} else if (this.event.target) {
		this.selectTarget();
	}
};

Game.prototype.selectTarget = function() {
	this.event.selected = this.event.target;
	this.table.fillStyle = 'white';
	this.table.beginPath();
	this.table.clearRect(this.event.selected.x * this.display.block, this.event.selected.y * this.display.block, this.display.block, this.display.block);
	this.table.fillRect(this.event.selected.x * this.display.block + this.display.line.width, this.event.selected.y * this.display.block + this.display.line.width, this.display.block - this.display.line.width * 2, this.display.block - this.display.line.width * 2);
	this.table.closePath();
	this.drawBall(this.event.selected.x, this.event.selected.y);
};

Game.prototype.deSelect = function() {
	this.table.beginPath();
	this.table.clearRect(this.event.selected.x * this.display.block, this.event.selected.y * this.display.block, this.display.block, this.display.block);
	this.table.closePath();
	this.drawBall(this.event.selected.x, this.event.selected.y);
	this.event.selected = false;
};

Game.prototype.explode = function(inspect) {
	var xx, yy, destroy = [], destroyTemp,
		sides = [ {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1}, {x: -1, y: 0} ];
	
	for (var i = 0; i < sides.length; i++) {
		destroyTemp = [{x: inspect.x, y: inspect.y}];

		xx = inspect.x; yy = inspect.y;
		while ((yy += sides[i].y) >= 0 && yy < this.rows && (xx += sides[i].x) >= 0 && xx < this.cols && (((this.content[xx] || {})[yy] || {}).color || {}).name == inspect.color.name) {
			destroyTemp.push({x: xx, y: yy});
		}
		xx = inspect.x; yy = inspect.y;
		while ((yy += sides[i].y * -1) >= 0 && yy < this.rows && (xx += sides[i].x * -1) >= 0 && xx < this.cols && (((this.content[xx] || {})[yy] || {}).color || {}).name == inspect.color.name) {
			destroyTemp.push({x: xx, y: yy});
		}

		if (destroyTemp.length >= this.rules.required) {
			destroy = destroy.concat(destroyTemp);
		}
	}
	if (destroy.length >= this.rules.required) {
		this.table.beginPath();
		for (var j = 0; j < destroy.length; j++) {
			this.table.clearRect(destroy[j].x * this.display.block, destroy[j].y * this.display.block, this.display.block, this.display.block);
			this.content[destroy[j].x][destroy[j].y] = null;
		}
		this.table.closePath();
		this.score += destroy.length * 10;
		document.getElementById('spanom').innerHTML = this.score;
		return true;
	} else {
		return false;
	}
};

Game.prototype.pathFind = function() {
	this.event.openList = [new cell(this.event.selected.x, this.event.selected.y, this.event.x, this.event.y)];
	this.event.openList[0].g = 0;
	this.event.closedList = [];
	var actual, lowest;
	do {
		lowest = {f: this.rows * this.cols, g: 0};
		for (var i = 0; i < this.event.openList.length; i++) {
			actual = this.event.openList[i];
			if (actual.f + actual.g <= lowest.f + lowest.g) { lowest = actual; }
		}
		
		var sides = [
			{x: lowest.x, y: lowest.y - 1},
			{x: lowest.x + 1, y: lowest.y},
			{x: lowest.x, y: lowest.y + 1},
			{x: lowest.x - 1, y: lowest.y}
		];

		for (var i = 0; i < sides.length; i++) {
			var xx = sides[i].x, yy = sides[i].y, stop = false, onopen = false;
			if (yy < 0 || yy >= this.rows || xx < 0 || xx >= this.cols || (this.content[xx] && this.content[xx][yy])) { continue; }
			for (var j = 0; j < this.event.closedList.length; j++) {
				if (this.event.closedList[j].x == xx && this.event.closedList[j].y == yy) { stop = true; }
			}
			if (stop) { continue; }
			for (var k = 0; k < this.event.openList.length; k++) {
				if (this.event.openList[k].x == xx && this.event.openList[k].y == yy) { onopen = true; }
			}
			if (!onopen) {
				var thisCell = new cell(xx, yy, this.event.x, this.event.y);
				thisCell.parent = lowest;
				thisCell.g = lowest.g + 1;
				this.event.openList.push(thisCell);
			}
		}
		this.event.closedList.push(this.event.openList.splice(this.event.openList.indexOf(lowest), 1)[0]);
	} while (this.event.openList.length && lowest.f)

	var path = game.event.closedList[game.event.closedList.length - 1];
	if (path.x != this.event.x || path.y != this.event.y) { return; }
	var ret = [{x: this.event.x, y: this.event.y}];
	while ((path = path.parent) && path.parent) {
		ret.unshift({x: path.x, y: path.y});
	}
	this.content[this.event.x][this.event.y] = this.content[this.event.selected.x][this.event.selected.y];
	var that = this;
	var interVal = setInterval(function() {
		var step;
		that.table.beginPath();
		if (step = ret.shift()) {
			that.event.selected.x = step.x;
			that.event.selected.y = step.y;
			that.setStyle(that.event.selected);
			that.table.arc(step.x * that.display.block + that.display.block / 2, step.y * that.display.block + that.display.block / 2, that.event.selected.radius, 0, Math.PI * 2, false);
			that.table.fill();
			that.table.stroke();
		} else {
			clearInterval(interVal);
			that.resetStyle();
			that.content[that.event.closedList[0].x][that.event.closedList[0].y] = null;
			that.event.selected = false;
			that.table.canvas.width = that.table.canvas.width;
			that.fillContent();
			if (!that.explode(that.content[that.event.x][that.event.y])) { that.addBalls(that.rules.incoming); }
		}
	}, 20);
};

function cell(x, y, tx, ty) {
	this.x = x;
	this.y = y;
	this.f = Math.abs(this.x - tx) + Math.abs(this.y - ty);
}

function fixEllipse() {
	if (!('ellipse' in CanvasRenderingContext2D.prototype)) {
		console.info('ellipse fixed');
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