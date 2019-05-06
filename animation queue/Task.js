(function() {
	'use strict';
	
	var T = function(target, props, duration) {
		this.target = target;
		this._getProps(target, props);
		this.duration = duration;
		
		this.startTime = this._getTime();
		this.lastTime = this.startTime;
		this.endTime = this.startTime + this.duration;
	};
	
	T.prototype = {};
	T.prototype.constructor = T;
	
	T.prototype.stopped = false;
	
	T.prototype.execute = function() {
		var now = this._getTime(),
			time = now - this.startTime,
			process = Math.min(time / this.duration, 1),
			key;
		
		for (key in this.initProps) {
			if (Object.prototype.hasOwnProperty.call(this.initProps, key))
				this.target[key] = this.initProps[key] + this.diffProps[key] * process;
		}
		
		this.lastTime = now;
		
		return this.endTime > now;
	};
	
	T.prototype._getTime = function() {
		return new Date().getTime();
	};
	
	T.prototype._getProps = function(target, props) {
		var key;
		
		this.initProps = {};
		this.diffProps = {};
		
		for (key in props) {
			if (Object.prototype.hasOwnProperty.call(props, key)) {
				this.initProps[key] = target[key];
				this.diffProps[key] = props[key] - target[key];
			}
		}
	}

	window.Task = T;
}());
