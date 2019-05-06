var
	doc = window.document,
	canvas = doc.getElementById('canvas'),
	ctx = canvas.getContext('2d'),

	chill = new Chill(),
	chill2 = new Chill(),
	
	wrapper = document.createElement('div'),
	wrapper2 = document.createElement('div'),
	config = {},
	
	anim
;

window._requestAnimationFrame =
	window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	window.oRequestAnimationFrame;

window.addEventListener('resize', onWindowResize)

function onWindowResize() {
	canvas.width = doc.body.offsetWidth;
	canvas.height = doc.body.offsetHeight;
}

wrapper.id = 'wrapper';
wrapper2.id = 'wrapper2';

config.entries = {
	foo: { background: 'red' },
	bar: { background: 'blue' },
	baz: { background: 'green' }
};

for (var i = 0; i < 100; i++) {
	config.entries['_' + i] = {
		background: 'rgb(' + rand(0, 255) + ', ' + rand(0, 255) + ', ' + rand(0, 255) + ')'
	};
}

chill.out(wrapper, config, function() {
	this.start();
	
	var task = new Task();
	task.execute = (function() {
		this.eachEntry(this.randomize);
		
		return true;
	}).bind(this);
	
	this.queue.add(task);
});

chill2.out(wrapper2, { entries: { item: { background: 'grey' } } }, function() {
	this.start();
	
	var task = new Task(
		this._entries['item'],
		{
			x: 200,
			y: 100,
			width: 80,
			height: 10
		},
		1000
	);
	
	this.queue.add(task);
});

onWindowResize();

function rand(min, max) {
	return Math.random() * (max - min) | 0 + min + 1; 
}
