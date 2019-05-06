(function() {
	'use strict';

	var E = function(props) {
		for (var key in props) if (Object.prototype.hasOwnProperty.call(props, key)) this[key] = props[key];
	};

	E.prototype = {};
	E.prototype.constructor = E;
	
	E.prototype.x = 0;
	E.prototype.y = 0;
	
	E.prototype.width = 20;
	E.prototype.height = 30;
	
	E.prototype.background = '#000000';
	
	E.prototype.animate = function(options, duration) {
		
	};

	window.Entry = E;
}());
