module.exports.room = room;
module.exports.player = player;

var userIndex = 100, roomIndex = 100,
	objectId = 0, spellId = 0,
	minionList = {}, abilityList = {},
	config = require('./gameConfig.js').config,
	bdatas = config.bdatas,
	hdatas = config.hdatas,
	abilityMap = config.abilityMap,
	formulasConfig = config.formulasConfig;

function room() {
	this.id = 'r' + ++roomIndex;
	this.name = 'room ' + this.id.substr(1);
	this.players = {};
	this.playersLength = 0;
	this.table = {};
	this.password = '';
	this.turn = 1;
	this.actualPlayer = 1;
	this.mana = 1;
	this.on = false;
}

room.prototype.rename = function(newName) {
	this.name = newName;
};

room.prototype.addNewPlayer = function(player, isAdmin) {
	player.rights = isAdmin;
	player.ready = false;
	this.players[player.id] = player;
	this.playersLength++;
};

room.prototype.removePlayer = function(id) {
	for (var elem in this.players) {
		if (this.players[elem].turn > this.players[id].turn) { this.players[elem].turn--; }
	}
	var newAdmin = --this.playersLength && this.players[id].rights;
	delete this.players[id];
	if (newAdmin) {
		var first = this.players[Object.keys(this.players)[0]];
		first.rights = true;
	}
	return newAdmin ? first.sid : false;
};

room.prototype.setPass = function(newPass) {
	this.password = newPass;
};

room.prototype.nextPlayer = function() {
	this.actualPlayer == this.playersLength ? this.actualPlayer = 1 : this.actualPlayer++;
	if (this.turn < 15 && this.turn % 2 == 0) { this.mana++; }
	for (var e in this.players) {
		if (this.players[e].turn == this.actualPlayer) { this.players[e].mana = this.mana; return e; }
	}
};

room.prototype.readyPlayers = function(players) {
	var readyToPlay = 0;
	for (var player in players) {
		if (players[player].ready) { readyToPlay++ }
	}
	return readyToPlay;
};

room.prototype.randomizePlayers = function() {
	var order = [1, 2, 3, 4, 5], colors = ['#FFFF33', '#0088FF', '#55FF00', '#FF3333'];
	var keys = Object.keys(this.players);
	for (var rnd, x, i = keys.length; i; rnd = parseInt(Math.random() * i), x = order[--i], order[i] = order[rnd], order[rnd] = x);
	for (var i = 0; i < keys.length; i++) {
		this.players[keys[i]].turn = order[i];
		this.players[keys[i]].color = colors[i];
		if (order[i] == 1) { var fp = this.players[keys[i]].id; }
	}
	return fp;
};

room.prototype.start = function() {
	this.on = true;
	this.table = new gameTable();
	this.table.fill(this.players);
	return this.randomizePlayers();
};

function player(socketId) {
	this.sid = socketId;
	this.id = 'u' + ++userIndex;
	this.name = 'user ' + this.id.substr(1);
	this.race = ['Human', 'Elf', 'Dwarf', 'Orc', 'Undead', 'Daemon'][Math.floor(Math.random() * 6)];
	this.hero = ['Warrior', 'Mage', 'Assasin'][Math.floor(Math.random() * 3)];
	this.mana = 1;
}

player.prototype.rename = function(newName) {
	this.name = newName;
};

player.prototype.raceChange = function(newRace) {
	this.race = newRace;
};

player.prototype.heroChange = function(newHero) {
	this.hero = newHero;
};

function gameTable() {
	this.rows = 12;
	this.columns = 16;
	this.rcIndex = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
	this.entries = {};
	this.authorList = {};
	this.content = {};
	this.overTimes = {};
	this.barracks = {};
	this.formulas = formulasConfig;
}

gameTable.prototype.fill = function(players) {
	var i = 0, fillCoords = randomFill(this.rows, this.columns, Object.keys(players).length);
	for (var player in players) {
		var p = players[player], x = fillCoords.coordX[i], y = fillCoords.coordY[i];
		this.authorList[p.id] = [];
		this.newContent(new field(hdatas[p.hero], p.id, p.race, x + 1, y));
		var bid = this.newContent(new field(bdatas[p.race], p.id, p.race, x, y));
		this.barracks[p.id] = bid; i++;
	}
};

function randomFill(rows, columns, length) {
	var x = [], y = [], distance = 2;
	for (var j = 0; j < length; j++) {
		do {
			var again = false,
				r = Math.floor(Math.random() * (rows - 1)),
				c = Math.floor(Math.random() * (columns - 2));
			for (var i = 0; i < x.length; i++) {
				if (Math.abs(x[i] - c) < distance || Math.abs(y[i] - r) < distance) { again = true; }
			}
			if (!again) { x.push(c); y.push(r); }
		} while(again)
	}
	return {coordX: x, coordY: y};
}

gameTable.prototype.newContent = function(obj) {
	this.entries[this.rcIndex[obj.x] + this.rcIndex[obj.y]] = obj.id;
	this.authorList[obj.author].push(obj.id);
	this.content[obj.id] = obj;
	if ('gold' in obj) { return obj.id; }
};

gameTable.prototype.removeAbilityCooldown = function(playerId) {
	for (var elem in this.authorList[playerId]) {
		for (var ability in this.content[this.authorList[playerId][elem]].abilities) {
			this.content[this.authorList[playerId][elem]].abilities[ability].used = false;
		}
	}
};

gameTable.prototype.increaseGold = function(playerId) {
	var b = this.content[this.barracks[playerId]];
	if (b) { b.gold += this.content[this.barracks[playerId]].goldPerMyTurn; }
};

gameTable.prototype.rollTreasureBox = function() {
	if (Math.random() < 0.2) {
		var maxTry = 10;
		do {
			var again = false,
				x = Math.floor(Math.random() * this.rows),
				y = Math.floor(Math.random() * this.columns);
				if (this.entries[this.rcIndex[x] + this.rcIndex[y]]) { again = true; }
				else {
					var o = 't' + ++objectId, l = Math.ceil(Math.random() * 9) + 1;
					this.content[o] = { x: x, y: y, bg: 'treasure', sound: 'treasure', loot: l, boxId: o };
					this.entries[this.rcIndex[x] + this.rcIndex[y]] = o;
				}
			maxTry--;
		} while (again && maxTry)
		return o;
	} return false;
};

gameTable.prototype.doOverTimes = function() {
	var died = [];
	for (var elem in this.overTimes) {
		var target = this.content[this.overTimes[elem].target];
		target.hp = Math.min(target.hp + this.overTimes[elem].amount, target.maxHp);
		this.overTimes[elem].times--;
		if (this.overTimes[elem].times <= 0) {
			delete this.overTimes[elem];
			target.overTimes.splice(target.overTimes.indexOf(elem), 1);
		}
		if (target.hp <= 0) {
			for (var elem in target.overTimes) { delete this.overTimes[target.overTimes[elem]]; }
			died.push(target.id);
			delete this.overTimes[elem];
//			target.overTimes.splice(target.overTimes.indexOf(elem), 1);
			this.authorList[target.author].splice(this.authorList[target.author].indexOf(target.id), 1);
			delete this.entries[this.rcIndex[target.x] + this.rcIndex[target.y]];
			delete this.content[target.id];
		}
	}
	return died;
};

gameTable.prototype.target = function(target) {
	return this.entries[this.rcIndex[target.x] + this.rcIndex[target.y]];
};

gameTable.prototype.destroyObject = function(object, target, takePos) {
	if (takePos) {
		this.entries[this.rcIndex[target.x] + this.rcIndex[target.y]] = this.entries[this.rcIndex[object.x] + this.rcIndex[object.y]];
		delete this.entries[this.rcIndex[object.x] + this.rcIndex[object.y]];
		object.x = target.x; object.y = target.y;
	} else {
		delete this.entries[this.rcIndex[target.x] + this.rcIndex[target.y]];
	}
	this.authorList[target.author].splice(this.authorList[target.author].indexOf(target.id),1);
	for (var elem in this.content[target.id].overTimes) {
		delete this.overTimes[this.content[target.id].overTimes[elem]];
	}
	delete this.content[target.id];
};

function field(data, author, race, x, y) {
	this.id = 'o' + ++objectId;
	this.author = author;
	this.race = race;
	this.x = x;
	this.y = y;
	this.overTimes = [];
	this.abilities = {};
	for (var elem in data) { this[elem] = data[elem]; }
	for (var i = 0; i < this.specials.length; i++) {
		var ss = this.specials[i], aa = abilityMap[ss];
		this.abilities[ss] = new abilityList[aa.id](aa.data, ss);
	}
}

abilityList['move'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.description = 'Move ' + this.range + ' field(s)';
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (target.id) {
			callback('Can\'t move there!', ['engaged', 'no']);
		} else {
			delete table.entries[table.rcIndex[object.x] + table.rcIndex[object.y]];
			table.entries[table.rcIndex[target.x] + table.rcIndex[target.y]] = object.id;
			object.x = target.x; object.y = target.y;
			if (target.loot) {
				var bid = table.barracks[object.author], add = {}, sound = 'treasure';
				table.content[bid].gold += target.loot;
				add[bid] = table.content[bid];
				delete table.content[target.boxId];
			} else { var sound = this.sound; }
			this.used = true;
			callback(false, sound, object, target, false, add);
		}	
    };
};

abilityList['melee'] = function(data, id) {
	this.id = id;
	this.icon = data.icon;
	this.log = data.log;
	this.name = data.name;
	this.description = 'Melee strike, deals a ' + data.kind + ' damage, range: 1';
	this.sound = data.sound;
	this.baseDeal = data.base;
	this.used = false;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > 1 || Math.abs(object.y - target.y) > 1 ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Inavlid target!', ['invalidtarget', 'no']);
		} else {
			var damageDeal = damageCalculator(this.baseDeal, object.strength, target.defense, object.agility, object.hit);
			if (damageDeal < 0) { damageDeal = 0; }
			target.hp -= damageDeal;
			if (target.hp <= 0) { table.destroyObject(object, target, true); }
			this.used = true;
			callback(false, this.sound, object, target, -damageDeal);
		}
    };
};

abilityList['execute'] = function(data, id) {
	this.id = id;
	this.icon = data.icon;
	this.log = data.log;
	this.name = data.name;
	this.description = 'Executes the target. Only usable on enemies that have less than ' + data.requirement + '% health, range: 1';
	this.sound = data.sound;
	this.requirement = data.requirement;
	this.used = false;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > 1 || Math.abs(object.y - target.y) > 1 ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target!', ['invalidtarget', 'no']);
		} else if (target.hp > target.maxHp * this.requirement / 100) {
			callback('The health of the target must be less than ' + this.requirement + '%!', ['invalidtarget', 'cantuse']);
		} else {
			var damageDeal = target.hp;
			target.hp -= damageDeal;
			table.destroyObject(object, target, true);
			this.used = true;
			callback(false, this.sound, object, target, -damageDeal);
		}
    };
};

abilityList['magic'] = function(data, id) {
	this.id = id;
	for (var e in data) { this[e] = data[e]; }
	this.used = false;
	this.log += ' fired';
	this.description = this.name + ' spell, range: ' + this.range;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target', ['invalidtarget', 'no']);
		} else {
			var offsetDeal = Math.ceil(this.base * (100 + Math.random() * formulasConfig.magicOffset) / 100);
			if (Math.random() < formulasConfig.agiRate) { offsetDeal *= 2; }
			target.hp -= offsetDeal;
			if (target.hp <= 0) { table.destroyObject(object, target, false); }
			else if (this.ae) {
				var o = 's' + ++spellId;
				table.overTimes[o] = {
					name: this.ae.name, description: this.ae.kind + ', ' + this.ae.rounds + ' turns remaining, ' + this.ae.amount + ' ' +(this.ae.amount < 0 ? 'damage' : 'health') + ' in each turn!',
					target: target.id, amount: this.ae.amount, times: this.ae.rounds
				};
				target.overTimes.push(o);
			}
			this.used = true;
			callback(false, this.sound, object, target, -offsetDeal);
		}
    };
};

abilityList['heal'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.description = 'Healing, range: ' + this.range;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target!', ['invalidtarget', 'no']);
		} else {
			var offsetHeal = Math.ceil(this.base * (100 + Math.random() * formulasConfig.healOffset) / 100);
			target.hp = Math.min(target.hp + offsetHeal, target.maxHp);
			this.used = true;
			callback(false, this.sound, object, target, offsetHeal);
		}
    };
};

abilityList['attr'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.description = 'Modifies the target\'s ' + this.which + ' attribute by ' + this.amount + ', range: ' + this.range;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target!', ['invalidtarget', 'no']);
		} else if (!target[this.which] || target[this.which] <= 0) {
			callback('The target does not have ' + this.which + ' attribute!', ['invalidtarget', 'cantuse']);
		} else {
			target[this.which] += this.amount;
			if (target.maxHp < target.hp) { target.hp = target.maxHp; }
			if (target.hp <= 0) { table.destroyObject(object, target, false); }
			this.used = true;
			callback(false, this.sound, object, target, this.amount);
		}
    };
};

abilityList['minion'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.log = 'Produced a unit (' + this.index + ')';
	this.description = 'Produces a unit: ' + this.index;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > 1 || Math.abs(object.y - target.y) > 1 ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (target.id) {
			callback('Invalid field!', ['engaged', 'no']);
		} else if (object.gold < this.cost) {
			callback('Not enough gold!', ['expensive', 'gold']);
		} else {
			var myMinion = new field(hdatas[this.index], object.author, object.race, target.x, target.y),
			add = {}, sound;
			table.newContent(myMinion);
			object.gold -= this.cost;
			if (target.loot) {
				sound = 'treasure';
				object.gold += target.loot;
				add[target.boxId] = {id: false};
				delete table.content[target.boxId];
			} else { sound = this.sound; }
			this.used = true;
			callback(false, sound, object, myMinion, false, add);
		}
	}
};

abilityList['ota'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.description = this.kind + ' for ' + this.rounds + ' rounds, ' + this.amount + ' in each turn' + ', range: ' + this.range;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target!', ['invalidtarget', 'no']);
		} else {
			var o = 's' + ++spellId;
			table.overTimes[o] = {
				name: this.name, description: this.description,
				target: target.id, amount: this.amount, times: this.rounds
			};
			target.overTimes.push(o);
			this.used = true;
			callback(false, this.sound, object, target, this.name);
		}
    };
};

abilityList['purify'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.description = 'Removes a harmful effect, range: ' + this.range;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target!', ['invalidtarget', 'no']);
		} else {
			for (var i = 0; i < target.overTimes.length; i++) {
				if (table.overTimes[target.overTimes[i]] && table.overTimes[target.overTimes[i]].amount < 0) {
					delete table.overTimes[target.overTimes[i]];
					target.overTimes.splice(i, 1);
					this.used = true;
					callback(false, this.sound, object, target, this.name);
					return false;
				}
			}
			callback('There are no harmful effect on the target!', ['cantuse', 'no']);
		}
    };
};

abilityList['drain'] = function(data, id) {
	this.id = id;
	this.used = false;
	for (var e in data) { this[e] = data[e]; }
	this.description = 'Steals the target\'s ' + this.which + ' attribute by ' + Math.abs(this.amount) + ', range: ' + this.range;
	this.use = function(table, object, target, callback) {
		if (Math.abs(object.x - target.x) > this.range || Math.abs(object.y - target.y) > this.range ) {
			callback('Too far away!', ['faraway', 'no']);
		} else if (!target.id) {
			callback('Invalid target!', ['invalidtarget', 'no']);
		} else if (!target[this.which] || target[this.which] <= 0) {
			callback('The target does not have ' + this.which + ' attribute!', ['invalidtarget', 'cantuse']);
		} else {
			target[this.which] += this.amount;
			object[this.which] -= this.amount;
			if (target.maxHp < target.hp) { target.hp = target.maxHp; }
			if (object.maxHp < object.hp) { object.hp = object.maxHp; }
			if (target.hp <= 0) { table.destroyObject(object, target, false); }
			this.used = true;
			callback(false, this.sound, object, target, this.amount);
		}
    };
};

function damageCalculator(base, str, def, agi, hit) {
	var dmg = base + str / formulasConfig.strRate - def / formulasConfig.defRate,
		offset = Math.random() / formulasConfig.meleeOffset * dmg,
		crit = agi / formulasConfig.agiRate > Math.random(),
		ifhit = hit / formulasConfig.hitRate > Math.random();
	if (crit) { return Math.floor(2 * (dmg + offset)); }
	else if (!ifhit) { return 0; }
	else { return Math.floor(dmg + offset); }
}