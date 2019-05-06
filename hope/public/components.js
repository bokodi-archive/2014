var a = document.createElement('audio'), t;
if (a.canPlayType('audio/ogg')) { t = 'ogg'; }
else if (a.canPlayType('audio/mp3')) { t = 'mp3'; }
else if (a.canPlayType('audio/wav')) { t = 'wav'; }

var
s = ['warrior', 'dennis', 'henry', 'itachi', 'rudolf', 'firzen', 'werewolf', 'witch', 'vampire', 'hunter', 'priest',
	'callitachi', 'callrudolf', 'callfirzen',
	'human_barrack', 'elf_barrack', 'dwarf_barrack', 'orc_barrack', 'undead_barrack', 'daemon_barrack',
	'hot', 'cold', 'fire', 'frost', 'shadow', 'smoke', 'wind', 'affliction', 'corruption'],
b = ['move', 'fastmove', 'wolfmove', 'strike', 'stab', 'claw', 'bite', 'execute', 'poison', 'choke', 'suck',
	'firebolt', 'frostbolt', 'frostfirebolt', 'hpsnatch', 'lesserheal', 'greaterheal', 'renew', 'treasure', 'aimedshot',
	'incstr', 'incdef', 'decstr', 'decstam', 'callwolf', 'callwitch', 'callvampire', 'curse', 'purify', 'explosiveshot'],
a = ['tobattle', 'gold', 'death', 'notice', 'message', 'tableselect', 'abilityselect', 'gamestart',
	'error', 'cooldown', 'faraway', 'engaged', 'invalidtarget', 'cantuse', 'no', 'expensive'],
cp = '<img src="/public/chat/smile',
cs = '.png" title="" alt=""/>',
chatMap = {
	':D':				cp + '01' + cs,
	':&rpar;':			cp + '02' + cs,
	':&lpar;':			cp + '03' + cs,
	':P':				cp + '04' + cs,
	':/':				cp + '05' + cs,
	'&lpar;Y&rpar;':	cp + '06' + cs,
	':3':				cp + '07' + cs,
	'/cry':				cp + '08' + cs,
	'<3':				cp + '09' + cs,
	'/poop':			cp + '10' + cs,
	'o&period;O':		cp + '11' + cs,
	'O&period;o':		cp + '12' + cs,
	':&ast;':			cp + '13' + cs,
	'/dislike':			cp + '14' + cs,
	'>&period;<':		cp + '15' + cs,
	'/coffee':			cp + '16' + cs,
	'/beer':			cp + '17' + cs,
	':O':				cp + '18' + cs,
	'/grat':			cp + '19' + cs,
	'/up':				cp + '20' + cs,
	'<':				'&lt;',
	'>':				'&gt;',
	
},
sprites = {}, audios = {};

for (var i = 0, l = s.length; i < l; i++) { sprites[s[i]] = '/public/images/' + s[i] + '.png'; }
for (var i = 0, l = a.length; i < l; i++) { audios[a[i]] = '/public/audio/' + t + '/' + a[i] + '.' + t; }
for (var i = 0, l = b.length; i < l; i++) {
	sprites[b[i]] = '/public/images/' + b[i] + '.png';
	audios[b[i]] = '/public/audio/' + t + '/' + b[i] + '.' + t;
}

var heroProfiles = {
	Warrior: {
		icon: sprites['warrior'],
		desc: 'Warriors are melee fighters highly trained in the arts of weaponry.',
		alt: 'Strength'
	},
	Mage: {
		icon: sprites['dennis'],
		desc: 'The mage is a DPS caster that specializes in burst damage and area of effect spells.',
		alt: 'Magic'
	},
	Assasin: {
		icon: sprites['henry'],
		desc: 'Free from the constraints of a conscience, these mercenaries rely on brutal and efficient tactics.',
		alt: 'Agility'
	},
	Priest: {
		icon: sprites['priest'],
		desc: 'The priest is the master of healing and preservation, restoring his wounded allies, shielding them in battle.',
		alt: 'Spell'
	},
	Hunter: {
		icon: sprites['hunter'],
		desc: 'Masters of their environment, they are able to slip like ghosts through the trees and lay traps in the paths of their enemies.',
		alt: 'Ranged'
	},
};