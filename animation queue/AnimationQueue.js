(function() {
	'use strict';
	
	var Q = function() {
		this.taskList = [];
	};
	
	Q.prototype = {};
	Q.prototype.constructor = Q;
	
	Q.prototype.add = function(task) {
		this.taskList.push(task);
	};
	
	Q.prototype.remove = function(task) {
		var index = this.taskList.indexOf(task);
		
		if (index !== -1) this.taskList.splice(index, 1);
	};
	
	Q.prototype.removeAt = function(index) {
		this.taskList.splice(index, 1);
	};
	
	Q.prototype.each = function(callback) {
		var i = this.taskList.length - 1;

		for (; i >= 0; i--) callback.call(this, this.taskList[i]);
	};
	
	Q.prototype.tick = function() {
		this.each(this.perform);
	};
	
	Q.prototype.perform = function(task) {
		if (!task.execute()) this.remove(task);
	};
	
	window.AnimationQueue = Q;
}());
