process.EventEmitter = require('events'); // added later in order to work with newer versions of nodejs.

var express = require('express'),
	fs = require('fs'),
	game = require('./game.js'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server, { log: false }),
	server_config = JSON.parse(fs.readFileSync(__dirname + '/config.json')),
	host = server_config.host,
	port = server_config.port,
	rooms = {};

server.listen(port, host, function() {
	console.log('server running at ' + host + ':' + port);
});

app.use(express.static(__dirname, {maxAge: 86400000}));
app.get('/', function(request, response) {
	response.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
	
	socket.player = new game.player(socket.id);
	socket.join('available');
	socket.emit('welcome', socket.player);
	
	socket.on('greetings', function(data) {
		if (socket.player) {
			socket.player.name = data.name;
			socket.player.race = data.race;
			socket.player.hero = data.hero;
		}
	});
	
	socket.on('create room', function(callback) {
		socket.room = new game.room();
		socket.room.addNewPlayer(socket.player, true);
		socket.join(socket.room.id);
		socket.leave('available');
		rooms[socket.room.id] = socket.room;
		socket.broadcast.to('available').emit('append room', socket.room.id);
		callback({roomName: socket.room.name, myName: socket.player.name, race: socket.player.race, hero: socket.player.hero});
	});
	
	socket.on('connect room', function(data, callback) {
		if (!rooms[data.id]) { socket.emit('notifications', 'The room does not exist!'); }
		else if (rooms[data.id].playersLength >= 4) { socket.emit('notifications', 'The room is full!'); }
		else if (rooms[data.id].on) { socket.emit('notifications', 'The game has already started!'); }
		else if (rooms[data.id].password.length && !data.pass) { socket.emit('ask password', data.id); }
		else if (rooms[data.id].password.length && data.pass != rooms[data.id].password) { socket.emit('notifications', 'Wrong password!'); }
		else if (socket.room) { socket.emit('notifications', 'You are already in a room!'); }
		else {
			socket.room = rooms[data.id];
			socket.room.addNewPlayer(socket.player, false);
			socket.join(data.id);
			socket.leave('available');
			io.sockets.in(data.id).emit('room enemy', {players: socket.room.players, player: socket.player.name});
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: 'length', value: socket.room.playersLength});
			callback({roomName: socket.room.name, roomPass: socket.room.password, myName: socket.player.name, race: socket.player.race, hero: socket.player.hero});
		}
	});
	
	socket.on('leave room', function() {
		if (!socket.room) { return false; }
		socket.leave(socket.room.id);
		socket.join('available');
		var adminLeft = socket.room.removePlayer(socket.player.id);
		if (adminLeft) { io.sockets.socket(socket.room.players[adminLeft].sid).emit('youAreTheChoosenOne'); }
		if (!socket.room.playersLength) {
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: false, value: false});
			delete rooms[socket.room.id];
		} else {
			socket.broadcast.to(socket.room.id).emit('room enemy', {players: socket.room.players});
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: 'length', value: socket.room.playersLength});
		}
		delete socket.room;
	});
	
	socket.on('list rooms', function() {
		socket.emit('room list', publicRoomData());
	});
	
	socket.on('invite players', function() {
		if (socket.room) { socket.broadcast.to('available').emit('invite', {id: socket.room.id, name: socket.room.name, who: socket.player.name}); }
	});
	
	socket.on('new message', function(data) {
		if (socket.room) { io.sockets.in(socket.room.id).emit('receive messages', {message: data, sender: socket.player.name, id: socket.player.id}); }
	});
	
	socket.on('new game_message', function(data) {
		if (socket.room) { io.sockets.in(socket.room.id).emit('receive game_messages', {message: data, sender: socket.player.name, id: socket.player.id}); }
	});
	
	socket.on('set pass', function(data) {
		if (socket.room && socket.player.rights) {
			socket.room.setPass(data);
			socket.broadcast.to(socket.room.id).emit('new pass', data);
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: 'pwClass', value: !!data});
		}
	});
	
	socket.on('rename room', function(data) {
		if (socket.room && socket.player.rights) {
			socket.room.rename(data);
			socket.broadcast.to(socket.room.id).emit('new roomname', data);
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: 'name', value: data});
		}
	});
	
	socket.on('rename user', function(data) {
		if (!socket.room) { return false; }
		socket.player.rename(data);
		socket.broadcast.to(socket.room.id).emit('room enemy', {players: socket.room.players});
	});

	socket.on('race change', function(data) {
		if (!socket.room) { return false; }
		socket.player.raceChange(data);
		socket.broadcast.to(socket.room.id).emit('room enemy', {players: socket.room.players});
	});
	
	socket.on('hero change', function(data) {
		if (!socket.room) { return false; }
		socket.player.heroChange(data);
		socket.broadcast.to(socket.room.id).emit('room enemy', {players: socket.room.players});
	});
	
	socket.on('iam ready', function() {
		if (!socket.room) { return false; }
		socket.player.ready = !socket.player.ready;
		socket.emit('nick ready', socket.player);
		socket.broadcast.to(socket.room.id).emit('room enemy', {players: socket.room.players});
	});
	
	socket.on('game start', function() {
		if (!socket.room) { return false; }
		if (socket.room.on) { socket.emit('notifications', 'The game has already started!'); }
		else if (!socket.player.rights) { socket.emit('notifications', 'You are not the admin of this room!'); }
		else if(socket.room.playersLength < 2) { socket.emit('notifications', 'There are not enough players in the room!'); }
		else if (socket.room.readyPlayers(socket.room.players) != socket.room.playersLength) { socket.emit('notifications', 'The players arent ready yet!'); }
		else {
			var f = socket.room.start();
			io.sockets.in(socket.room.id).emit('play game', { room: socket.room, first: f });
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: 'onClass', value: 'started'});
		}
	});
	
	socket.on('my turn', function(data) {
		if (!socket.room) { return false; }
		var initator = socket.room.table.content[data.id];
		if (socket.player.turn != socket.room.actualPlayer) { return false; }
		else if (!socket.player.mana) { socket.emit('turn fail', {error: 'You don\'t have enough mana!', sound: ['cantuse']}); }
		else if (!initator) { socket.emit('turn fail', {error: 'There is no selected unit!', sound: ['cantuse']}); }
		else if (!initator.abilities[data.ability]) { socket.emit('turn fail', {error: 'There is no selected ability!', sound: ['cantuse']}); }
		else if (initator.abilities[data.ability].used) { socket.emit('cooldown'); }
		else {
			if (socket.room.table.target(data.target)) { data.target = socket.room.table.content[socket.room.table.target(data.target)]; }
			initator.abilities[data.ability].use(socket.room.table, initator, data.target, function(error, sound, initator, sufferer, effect, additional) {
				if (!error) {
					socket.player.mana--;
					io.sockets.in(socket.room.id).emit('refresh', socket.room.table.entries, socket.room.table.overTimes,
					initator, sufferer, sound, data.ability, effect, socket.player.mana, additional); // initator.abilities[data.ability].log
				} else { socket.emit('turn fail', {error: error, sound: sound}); }
			});
		}
	});
	
	socket.on('end turn', function() {
		if (socket.room && socket.player.turn == socket.room.actualPlayer) {
			socket.room.turn++;
			var nextPlayer = socket.room.nextPlayer(),
				dead = socket.room.table.doOverTimes();
			socket.room.table.removeAbilityCooldown(nextPlayer);
			socket.room.table.increaseGold(nextPlayer);
			var box = socket.room.table.rollTreasureBox();
			io.sockets.in(socket.room.id).emit('new turn',
				{turn: socket.room.turn, actualPlayer: socket.room.actualPlayer, authorList: socket.room.table.authorList, dead: dead, entries: socket.room.table.entries,
				content: socket.room.table.content, overTimes: socket.room.table.overTimes, next: socket.room.players[nextPlayer].name, treasure: box}
			);
			io.sockets.socket(socket.room.players[nextPlayer].sid).emit('your turn', socket.room.players[nextPlayer].mana);
		}
	});
	
	socket.on('disconnect', function() {
		if (!socket.room) { return false; }
		var adminLeft = socket.room.removePlayer(socket.player.id);
		if (adminLeft) { io.sockets.socket(adminLeft).emit('youAreTheChoosenOne'); }
		if (!socket.room.playersLength) {
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: false, value: false});
			delete rooms[socket.room.id];
		} else {
			socket.broadcast.to(socket.room.id).emit('room enemy', {players: socket.room.players});
			socket.broadcast.to('available').emit('refresh room list', {id: socket.room.id, key: 'length', value: socket.room.playersLength});
		}
	});
	
	function publicRoomData() {
		var p = {};
		for (var r in rooms) {
			var a = rooms[r];
			p[r] = { id: a.id, name: a.name, pw: !!a.password, on: a.on, length: a.playersLength };
		}
		return p;
	}
	
	socket.on('debug', function(n) {
		if (socket.room) {
			if (n == 1) { console.log(socket.room); }
			else { console.log(socket.room.table.content); }
		}
	});
	
});