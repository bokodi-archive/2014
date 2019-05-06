var config = {};
config.bdatas = {
	Human: {
		entry: 1, name: 'Human barrack', bg: 'human_barrack',
		hp: 150, maxHp: 150, defense: 80, gold: 10, goldPerMyTurn: 6,
		specials: ['a1101', 'a1102', 'a1103', 'a1104', 'a1105']
	},
	Elf: {
		entry: 2, name: 'Elf barrack', bg: 'elf_barrack',
		hp: 180, maxHp: 180, defense: 100, gold: 20, goldPerMyTurn: 5,
		specials: ['a1100', 'a1102', 'a1103', 'a1104', 'a1105']
	},
	Dwarf: {
		entry: 3, name: 'Dwarf barrack', bg: 'dwarf_barrack',
		hp: 200, maxHp: 200, defense: 150, gold: 0, goldPerMyTurn: 7,
		specials: ['a1100', 'a1101', 'a1103', 'a1104', 'a1105']
	},
	Orc: {
		entry: 4, name: 'Orc barrack', bg: 'orc_barrack',
		hp: 100, maxHp: 100, defense: 60, gold: 25, goldPerMyTurn: 5,
		specials: ['a1101', 'a1102', 'a1103', 'a1104', 'a1105']
	},
	Undead: {
		entry: 5, name: 'Undead barrack', bg: 'undead_barrack',
		hp: 160, maxHp: 160, defense: 20, gold: 40, goldPerMyTurn: 4,
		specials: ['a1100', 'a1102', 'a1103', 'a1104', 'a1105']
	},
	Daemon: {
		entry: 6, name: 'Daemon barrack', bg: 'daemon_barrack',
		hp: 190, maxHp: 190, defense: 100, gold: 15, goldPerMyTurn: 5,
		specials: ['a1100', 'a1101', 'a1103', 'a1104', 'a1105']
	}
};
config.hdatas = {
	Warrior: {
		entry: 10, name: 'Warrior', bg: 'warrior',
		hp: 80, maxHp: 80, defense: 50, strength: 12, agility: 5, hit: 17,
		specials: ['a1001', 'a1010', 'a1020', 'a1050']
	},
	Mage: {
		entry: 11, name: 'Mage', bg: 'dennis',
		hp: 60, maxHp: 60, defense: 20,
		specials: ['a1000', 'a1033', 'a1040', 'a1062']
	},
	Assasin: {
		entry: 12, name: 'Assasin (hero)', bg: 'henry',
		hp: 65, maxHp: 65, defense: 40, strength: 3, agility: 18, hit: 16,
		specials: ['a1000', 'a1011', 'a1034']
	},
	Werewolf: {
		entry: 13, name: 'Werewolf (hero)', bg: 'werewolf',
		hp: 60, maxHp: 60, defense: 50, strength: 10, agility: 11, hit: 13,
		specials: ['a1002', 'a1012', 'a1013']
	},
	Witch: {
		entry: 14, name: 'Witch (hero)', bg: 'witch',
		hp: 55, maxHp: 55, defense: 10,
		specials: ['a1000', 'a1032', 'a1052', 'a1053']
	},
	Vampire: {
		entry: 15, name: 'Vampire (hero)', bg: 'vampire',
		hp: 55, maxHp: 55, defense: 70, strength: 16, agility: 9, hit: 19,
		specials: ['a1000', 'a1014', 'a1070']
	},
	Hunter: {
		entry: 16, name: 'Hunter (hero)', bg: 'hunter',
		hp: 70, maxHp: 70, defense: 35, strength: 8, agility: 12, hit: 15,
		specials: ['a1000', 'a1035', 'a1060', 'a1020']
	},
	Priest: {
		entry: 17, name: 'Priest (hero)', bg: 'priest',
		hp: 60, maxHp: 60, defense: 20,
		specials: ['a1000', 'a1040', 'a1061', 'a1080']
	},
	Itachi: {
		entry: 99, name: 'Itachi (minion)', bg: 'itachi',
		hp: 80, maxHp: 80, defense: 75, strength: 4, agility: 3, hit: 14,
		specials: ['a1000', 'a1010', 'a1051']
	},
	Rudolf: {
		entry: 98, name: 'Rudolf (minion)', bg: 'rudolf',
		hp: 55, maxHp: 55, defense: 50,
		specials: ['a1030', 'a1041', 'a1061', 'a1080']
	},
	Firzen: {
		entry: 97, name: 'Firzen (minion)', bg: 'firzen',
		hp: 45, maxHp: 45, defense: 25,
		specials: ['a1000', 'a1031', 'a1060']
	},		
};
config.abilityMap = {
	'a1000': {id: 'move',		data: { name: 'Move', icon: 'move', sound: 'move', sprite: 'wind', log: 'moved', range: 1 }},
	'a1001': {id: 'move',		data: { name: 'Riding', icon: 'fastmove', sound: 'fastmove', sprite: 'smoke', log: 'moved', range: 4 }},
	'a1002': {id: 'move',		data: { name: 'Dash', icon: 'wolfmove', sound: 'wolfmove', sprite: 'wind', log: 'moved', range: 2 }},
	'a1010': {id: 'melee',		data: { name: 'Strike', icon: 'strike', sound: 'strike', kind: 'great', log: 'striked', base: 12, range: 1}},
	'a1011': {id: 'melee',		data: { name: 'Stab', icon: 'stab', sound: 'stab', kind: 'small', log: 'stabbed', base: 7, range: 1}},
	'a1012': {id: 'melee',		data: { name: 'Bite', icon: 'bite', sound: 'bite', kind: 'small', log: 'bited', base: 6, range: 1}},
	'a1013': {id: 'melee',		data: { name: 'Claw', icon: 'claw', sound: 'claw', kind: 'small', log: 'clawed', base: 5, range: 1}},
	'a1014': {id: 'melee',		data: { name: 'Choke', icon: 'choke', sound: 'choke', kind: 'small', log: 'choked', base: 8, range: 1}},
	'a1020': {id: 'execute',	data: { name: 'Execute', icon: 'execute', sound: 'execute', log: 'executed', requirement: 15, range: 1 }},
	'a1030': {id: 'magic',		data: { name: 'Firebolt', icon: 'firebolt', sound: 'firebolt', sprite: 'fire', log: 'shot', base: 6, range: 4, ae: {name: 'Burn', kind: 'burn', amount: -1, rounds: 3} }},
	'a1031': {id: 'magic',		data: { name: 'Frostbolt', icon: 'frostbolt', sound: 'frostbolt', sprite: 'frost', log: 'shot', base: 4, range: 3 }},
	'a1032': {id: 'magic',		data: { name: 'Snatch', icon: 'hpsnatch', sound: 'hpsnatch', sprite: 'affliction', log: 'shot', base: 5, range: 5 }},
	'a1033': {id: 'magic',		data: { name: 'Frostfirebolt', icon: 'frostfirebolt', sound: 'frostfirebolt', sprite: 'corruption', log: 'shot', base: 7, range: 4 }},
	'a1034': {id: 'magic',		data: { name: 'Explosive shot', icon: 'explosiveshot', sound: 'explosiveshot', sprite: 'wind', log: 'shot', base: 4, range: 6 }},
	'a1035': {id: 'magic',		data: { name: 'Aimed shot', icon: 'aimedshot', sound: 'aimedshot', sprite: 'wind', log: 'shot', base: 3, range: 7 }},
	'a1040': {id: 'heal',		data: { name: 'Greaterheal', icon: 'greaterheal', sound: 'greaterheal', sprite: 'hot', log: 'healed', base: 12, range: 4 }},
	'a1041': {id: 'heal',		data: { name: 'Lesserheal', icon: 'lesserheal', sound: 'lesserheal', sprite: 'cold', log: 'healed', base: 7, range: 5 }},
	'a1050': {id: 'attr',		data: { name: 'Might', icon: 'incstr', sound: 'incstr', sprite: 'hot', log: 'increased strength', which: 'strength', amount: 1, range: 1 }},
	'a1051': {id: 'attr',		data: { name: 'Sanctuary', icon: 'incdef', sound: 'incdef', sprite: 'hot', log: 'increased defense', which: 'defense', amount: 4, range: 1 }},
	'a1052': {id: 'attr',		data: { name: 'Stultify', icon: 'decstr', sound: 'decstr', sprite: 'shadow', log: 'decreased strength', which: 'strength', amount: -2, range: 3 }},
	'a1053': {id: 'attr',		data: { name: 'Plague', icon: 'decstam', sound: 'decstam', sprite: 'shadow', log: 'decreased stamina', which: 'maxHp', amount: -5, range: 3 }},
	'a1060': {id: 'ota',		data: { name: 'Poison', icon: 'poison', sound: 'poison', kind: 'poison', log: 'poisoned', amount: -5, range: 1, rounds: 5 }},
	'a1061': {id: 'ota',		data: { name: 'Renew', icon: 'renew', sound: 'renew', sprite: 'hot', kind: 'blessing', log: 'blessed', amount: 4, range: 3, rounds: 3 }},
	'a1062': {id: 'ota',		data: { name: 'Curse', icon: 'curse', sound: 'curse', sprite: 'shadow', kind: 'curse', log: 'cursed', amount: -3, range: 5, rounds: 4 }},
	'a1070': {id: 'drain',		data: { name: 'Blood suck', icon: 'suck', sound: 'suck', log: 'drained', which: 'hp', amount: -7, range: 1 }},
	'a1080': {id: 'purify',		data: { name: 'Purify', icon: 'purify', sound: 'purify', sprite: 'hot', log: 'purified', range: 3 }},
	'a1100': {id: 'minion',		data: { name: 'Produce unit Itachi', icon: 'callitachi', sound: 'tobattle', sprite: 'wind', index: 'Itachi', cost: 8, range: 1 }},
	'a1101': {id: 'minion',		data: { name: 'Produce unit Rudolf', icon: 'callrudolf', sound: 'tobattle', sprite: 'wind', index: 'Rudolf', cost: 12, range: 1 }},
	'a1102': {id: 'minion',		data: { name: 'Produce unit Firzen', icon: 'callfirzen', sound: 'tobattle', sprite: 'wind', index: 'Firzen', cost: 14, range: 1 }},
	'a1105': {id: 'minion',		data: { name: 'Produce unit Vampire', icon: 'callvampire', sound: 'callvampire', sprite: 'wind', index: 'Vampire', cost: 15, range: 1 }},
	'a1103': {id: 'minion',		data: { name: 'Produce unit Werewolf', icon: 'callwolf', sound: 'callwolf', sprite: 'wind', index: 'Werewolf', cost: 17, range: 1 }},
	'a1104': {id: 'minion',		data: { name: 'Produce unit Witch', icon: 'callwitch', sound: 'callwitch', sprite: 'wind', index: 'Witch', cost: 22, range: 1 }},
};
config.formulasConfig = {
	strRate: 2,
	defRate: 10,
	agiRate: 20,
	hitRate: 20,
	meleeOffset: 10,
	magicOffset: 20,
	healOffset: 30
};

module.exports.config = config;