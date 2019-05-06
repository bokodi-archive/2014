(function() {
	'use strict';
	
	var C = function() {
		this._entries = {};
		this.queue = new AnimationQueue();
	};
	
	C.prototype = {};
	C.prototype.constructor = C;
	
	C.prototype.eachEntry = function(callback) {
		var entryKey;
		
		for (entryKey in this._entries) callback.call(this, this._entries[entryKey]);
	};
	
	C.prototype.out = function(wrapper, config, callback) {
		var entryKey;
		
		this.wrapper = wrapper;
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		
		wrapper.appendChild(this.canvas);
		window.document.body.appendChild(wrapper);
		
		for (entryKey in config.entries) this._entries[entryKey] = new Entry(config.entries[entryKey]);
		
		callback.call(this);
	};
	
	C.prototype.start = function() {
		var _this = this;
		
		_this.animFrame = window.requestAnimationFrame(_this.loop.bind(_this));
	};
	
	C.prototype.loop = function() {
		var _this = this;
		
		_this.animFrame = window.requestAnimationFrame(_this.loop.bind(_this));
		
		_this.queue.tick();
		
		_this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
		_this.eachEntry(_this.perform);
	};
	
	C.prototype.perform = function(entry) {
		this.context.fillStyle = entry.background;
		this.context.fillRect(entry.x, entry.y, entry.width, entry.height);
	};
	
	C.prototype.randomize = function(entry) {
		entry.x = Math.random() * (this.canvas.width - entry.width) | 0;
		entry.y = Math.random() * (this.canvas.height - entry.height) | 0;
	};
	
	window.Chill = C;
}());
