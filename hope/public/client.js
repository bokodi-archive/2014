$(document).ready(function() {

	var socket = io.connect(),
		player = {}, room = {}, activities = {}, notify = true, busy = false,
		loadedImages = {}, loadedAudios = {}, loadedAllComponents = false,
		keybinds = [48, 49, 50, 51, 52], chatLog = [], chatMark, aeld, requestId,
		tc = $('#tableContent')[0].getContext('2d'),
		tf = $('#tableForeground')[0].getContext('2d'),
		ta = $('#tableAnimations')[0].getContext('2d'),
		coordX = coordY	= -1, block = calcBrowserSize();
	
	// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
	// MIT license
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] 
			|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) { clearTimeout(id); };
	}
	
	socket.on('welcome', function(data) { initPlayer(data); });
	socket.on('new roomname', function(data) { $('#roomName').val(data); });
	socket.on('new pass', function(data) { $('#roomPass').val(data); });
	socket.on('new username', function(data) { $('#playerName').val(data); });
	socket.on('invite', function(data) { responseToInvite(data); });
	socket.on('ask password', function(data) { busy = true; $('#tryEnter').fadeIn('fast'); $('.tryJoin')[0].id = data; $('#tryPass').focus(); });
	socket.on('nick ready', function(data) { player = data; player.ready ? $('#playerReady').html('undo') : $('#playerReady').html('ready'); });
	socket.on('receive messages', function(data) { receiveNewRoomMessage(data); });
	socket.on('receive game_messages', function(data) { receiveNewGameMessage(data); });
	socket.on('room enemy', function(data) { newRoomEnemy(data) });
	socket.on('room list', function(data) { listAllRooms(data); });
	socket.on('append room', function(data) { appendRoom(data); });
	socket.on('refresh room list', function(data) { refreshRoomList(data); });
	socket.on('notifications', function(data) { showRoomWarning(data); });
	socket.on('youAreTheChoosenOne', function() { choosenOne(); });
	socket.on('play game', function(data) { room = data.room; player = room.players[player.id]; gameStart(data.first); });
	socket.on('turn fail', function(data) { loadedAudios[data.sound[Math.floor(Math.random() * data.sound.length)]].play(); showGameWarning(data.error, false); });
	socket.on('cooldown', function() { loadedAudios['cooldown'].play(); showGameWarning('cooldown!', false); });
	socket.on('your turn', function(mana) { loadedAudios['notice'].play(); showGameWarning('your turn', true); $('#mana span').html(mana); });
	socket.on('new turn', function(data) { loadNewTurnData(data); });
	socket.on('refresh', function(e, o, i, s, snd, abi, efc, mana, add) {
		room.table.entries = e; room.table.overTimes = o;
		reDrawTable(i, s, snd, abi, efc, add);
		if (ifMyTurn()) { $('#mana span').html(mana); }
	});
	
	window.onresize = function() { block = calcBrowserSize(); grid(0.6); };
	window.onkeyup = function(e) { useKeyBind(e); };
	$('#createRoom').click(function() { createNewRoom(); });
	$('#showInfo').click(function() { showInfoMenu(); });
	$('.back').click(function() { busy = false; $('#wrapper section').hide(); $('#menu').fadeIn('slow'); });
	$('#leaveRoom').click(function() { busy = false; socket.emit('leave room'); $('#roomEnemies ul li').html(''); $('#roomConversation').html('<p>Room chat...</p>'); });
	$('#invite').click(function() { socket.emit('invite players'); });
	$('.invAccept').click(function() { busy = false; joinToRoom(this.id, false); $('#inviteBox').fadeOut('fast'); this.id = ''; });
	$('.tryJoin').click(function() { busy = false; if ($('#tryPass').val()) { joinToRoom(this.id, $('#tryPass').val()); $('#tryEnter').fadeOut('fast'); $('#tryPass').val(''); this.id = ''; } });
	$('#disableNotifactions').click(function() { busy = false; dontNotifyMe(); });
	$('#invBoxClose').click(function() { busy = false; $('#inviteBox').fadeOut('fast'); });
	$('#tryBoxClose').click(function() { busy = false; $('#tryEnter').fadeOut('fast'); });
	$('#listRooms').click(function() { socket.emit('list rooms'); $('#wrapper section').hide(); $('#roomList').fadeIn('slow'); });
	$('#race').change(function() { playerRaceChange($(this).val()); });
	$('#hero').change(function() { playerHeroChange($(this).val()); });
	$('#playerName').focusout(function() { playerNameChange($(this).val()); });
	$('#roomName').focusout(function() { socket.emit('rename room', $(this).val()); });
	$('#roomPass').focusout(function() { socket.emit('set pass', $(this).val()); });
	$('.focusout').keyup(function(e) { if ((e.keyCode || e.which) == 13) { this.blur(); } });
	$('#roomMessage').keyup(function(e) { var p = e.keyCode || e.which; if (p == 13) { $('#roomSend').click(); } else { msgMark(p, 'roomMessage'); } });
	$('#gameMessage').keyup(function(e) { var p = e.keyCode || e.which; if (p == 13) { $('#gameSend').click(); } else { msgMark(p, 'gameMessage'); } });
	$('#tryPass').keyup(function(e) { if ((e.keyCode || e.which) == 13) { $('.tryJoin').click(); } });
	$('#roomSend').click(function() { sendNewRoomMessage(); });
	$('#gameSend').click(function() { sendNewGameMessage(); });
	$('#playerReady').click(function() { resourceLoader(sprites, audios); });
	$('#start').click(function() { socket.emit('game start'); });
	$('#endTurn').click(function() { if (ifMyTurn()) { socket.emit('end turn'); $('#mana span').html('mana'); } });
	
	function useKeyBind(event) {
		var key = event.keyCode || event.which;
		if (key == 27) {
			if ($('#inviteBox').is(':visible')) { $('#invBoxClose').click(); }
			if ($('#inviteBox').is(':visible')) { $('#tryBoxClose').click(); }
		}
		if (key == 118) { console.dir(room); socket.emit('debug', 1); }
		if (key == 119) { console.dir(room); socket.emit('debug', 2); }
		if (key == 120) { console.dir(player); }
		for (var i = 0; i < keybinds.length; i++) {
			if (key == keybinds[i]) { $('#abilities li').eq(i).click(); }
		}
	}
	
	function initPlayer(playerObject) {
		player = playerObject;
		if (typeof(localStorage) != 'undefined') {
			if (localStorage.on && localStorage.changed) {
				socket.emit('greetings', {name: localStorage.name, race: localStorage.race, hero: localStorage.hero});
				player.name = localStorage.name; $('#playerName').val(localStorage.name);
				player.race = localStorage.race; $('#race').val(localStorage.race);
				player.hero = localStorage.hero; $('#hero').val(localStorage.hero);
				$('.mainDesc p').html(heroProfiles[localStorage.hero].desc);
				$('.altDesc p').html(heroProfiles[localStorage.hero].alt);
				$('#profilePicture').attr('src', heroProfiles[localStorage.hero].icon);
				$('#playerProfile figcaption').html(localStorage.hero);
			} else { localStorage.on = true; localStorage.changed = ''; localStorage.notifications = true; }
		}
	}
	
	function createNewRoom() {
		$('#wrapper section').hide();
		$('#room').fadeIn('slow');
		socket.emit('create room', function(data) { newRoomMember(data); });
		$('#start')[0].style.display = 'block';
	}
	
	function joinToRoom(roomId, pw) {
		$('#start')[0].style.display = 'none';
		socket.emit('connect room', {id: roomId, pass: pw}, function(data) {if (data) {
			$('#wrapper section').hide();
			$('#room').fadeIn('slow');
			$('#roomName')[0].disabled = true;
			$('#roomPass')[0].disabled = true;
			newRoomMember(data);
		}});
	}

	function newRoomMember(memberInfo) {
		$('#playerReady').html('ready');
		$('#roomName').val(memberInfo.roomName);
		$('#playerName').val(memberInfo.myName);
		$('#race').val(memberInfo.race);
		$('#hero').val(memberInfo.hero);
		if (memberInfo.roomPass) { $('#roomPass').val(memberInfo.roomPass); }
		$('.mainDesc p').html(heroProfiles[memberInfo.hero].desc);
		$('.altDesc p').html(heroProfiles[memberInfo.hero].alt);
		$('#profilePicture').attr('src', heroProfiles[memberInfo.hero].icon);
		$('#playerProfile figcaption').html(memberInfo.hero);
	}
	
	function choosenOne() {
		showRoomWarning('Admin left! You are the new admin!');
		$('#roomName')[0].disabled = false;
		$('#roomPass')[0].disabled = false;
		$('#start')[0].style.display = 'block';
	}
	
	function showInfoMenu() {
		$('#wrapper section').hide();
		$('#info').fadeIn('slow');
	}
	
	function responseToInvite(askData) {
		if (typeof(localStorage) != 'undefined') { var b = localStorage.notifications; }
		else { var b = notify; }
		if (b && !busy) {
			$('#invRoomName').html(askData.name + ', from: ' + askData.who);
			$('.invAccept')[0].id = askData.id;
			$('#inviteBox').fadeIn('fast');
			busy = true;
		}
	}
	
	function dontNotifyMe() {
		if (typeof(localStorage) != 'undefined') { localStorage.notifications = ''; }
		notify = false;
		$('#inviteBox').fadeOut('fast');
	}
	
	function playerRaceChange(value) {
		if (typeof(localStorage) != 'undefined' && localStorage.on && localStorage.changed) { localStorage.race = value; }
		socket.emit('race change', value);
	}

	function playerHeroChange(value) {
		if (typeof(localStorage) != 'undefined' && localStorage.on && localStorage.changed) { localStorage.hero = value; }
		$('#profilePicture').attr('src', heroProfiles[value].icon);
		$('#playerProfile figcaption').html(value);
		$('.mainDesc p').html(heroProfiles[value].desc);
		$('.altDesc p').html(heroProfiles[value].alt);
		socket.emit('hero change', value);
	}

	function playerNameChange(value) {
		if (!/^[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]{4,22}$/.test(value)) {
			$('#playerName').val('Anonymous');
			socket.emit('rename user', 'Anonymous');
		} else {
			socket.emit('rename user', value);
			if (typeof(localStorage) != 'undefined' && localStorage.on) {
				localStorage.changed = true;
				localStorage.name = value;
				localStorage.race = $('#race').val() ? $('#race').val() : 'Human';
				localStorage.hero = $('#hero').val() ? $('#hero').val() : 'Warrior';
			}
		}
	}

	function sendNewRoomMessage() {
		var msg = $('#roomMessage').val();
		if (msg.length) {
			socket.emit('new message', msg);
			$('#roomMessage').val('');
			$('#roomMessage').focus();
			chatLog.push(msg);
			chatMark = false;
		}
	}

	function sendNewGameMessage() {
		var msg = $('#gameMessage').val();
		if (msg.length) {
			socket.emit('new game_message', msg);
			$('#gameMessage').val('');
			$('#gameMessage').focus();
			chatLog.push(msg);
			chatMark = false;
		}
	}
	
	function msgMark(key, input) {
		if (!chatMark) { chatMark = chatLog.length; }
		if (key == 38 && chatLog[chatMark - 1]) {
			$('#' + input).val(chatLog[--chatMark]);
		} else if (key == 40  && chatLog[chatMark + 1]) {
			$('#' + input).val(chatLog[++chatMark]);
		}
	}
	
	function receiveNewRoomMessage(msg) {
		$('#roomConversation').append(convertToChat(msg.sender, msg.message));
		$('#roomConversation').stop().animate({ scrollTop: $('#roomConversation')[0].scrollHeight}, 200);
	}
	
	function receiveNewGameMessage(msg) {
		if (msg.id != player.id) { loadedAudios['message'].play(); }
		$('#gameConversation').append(convertToChat(msg.sender, msg.message));
		$('#gameConversation').stop().animate({ scrollTop: $('#gameConversation')[0].scrollHeight}, 200);
	}
	
	function convertToChat(sender, message) {
		var regex = new RegExp(Object.keys(chatMap).join('|'), 'g');
		var fixed = message.replace(/\(/g, '&lpar;').replace(/\)/g, '&rpar;').
			replace(/\./g, '&period;').replace(/\*/g, '&ast;').
			replace(regex, function(matched) { return chatMap[matched]; });
		return '<p><span class="chatName">' + sender + ':</span>' + fixed +'</p>';
	}
	
	function listAllRooms(rooms) {
		$('#rlPager ul').html('');
		rlPager(0, 11, rooms);
		var pages = Math.ceil(Object.keys(rooms).length / 11);
		if (!pages) { $('#rlPager ul').append('<li>Currently there are no rooms available :/</li>'); } else {
		for (var i = 0; i < pages; i++) {
			$('#rlPager ul').append('<li>' + (i + 1) + '</li>');
			$('#rlPager ul li').eq(i)[0].onclick = function() {
				var page = parseInt(this.innerHTML);
				rlPager(page * 11 - 11, page * 11, rooms);
			}
		}}
	}
	
	function appendRoom(id) {
		var line = '<li id="' + id + '">';
		line += '<span class="rlID">#' + id.slice(1) + '</span>';
		line += '<span class="rlName">' + id + '</span>';
		line += '<span class="rlPlayers">1 / 4</span>';
		line += '<span class="rlState">Waiting</span>';
		line += '<button class="joinToThisRoom">Join</button></li>';
		$('#rlPageContent ul').append(line);
		document.getElementById(id).lastChild.onclick = function() { joinToRoom(this.parentNode.id, false); };
	}
	
	function refreshRoomList(fresh) {
		var r = document.getElementById(fresh.id);
		if (fresh.key && r) {
			if (fresh.key == 'length') { r.childNodes.item(2).innerHTML = fresh.value + ' / 4'; }
			else if (fresh.key == 'name') { r.childNodes.item(1).innerHTML = fresh.value; }
			else if (fresh.key == 'onClass') { r.classList.add(fresh.value); r.childNodes.item(3).innerHTML = 'Running...'; }
			else if (fresh.key == 'pwClass') { fresh.value ? r.classList.add('locked') : r.classList.remove('locked'); }
		} else if (r) { r.parentNode.removeChild(r); }
	}
	
	function rlPager(from, to, rl) {
		$('#rlPageContent ul').html('');
		var roomKeys = Object.keys(rl);
		var limit = Math.min(roomKeys.length, to);
		for (var i = from, j = 0; i < limit; i++, j++) {
			var elem = rl[roomKeys[i]];
			var lnClass = '';
			if (elem.on) { var state = 'Running...'; lnClass = 'started'; } else { var state = 'Waiting'; }
			if (elem.pw) { lnClass += ' locked'; }
			var line = '<li id="' + elem.id + '" class="' + lnClass + '">';
			line += '<span class="rlID">#' + (elem.id).slice(1) + '</span>';
			line += '<span class="rlName">' + elem.name + '</span>';
			line += '<span class="rlPlayers">' + elem.length + ' / 4</span>';
			line += '<span class="rlState">' + state + '</span>';
			line += '<button class="joinToThisRoom">Join</button></li>';
			$('#rlPageContent ul').append(line);
			document.getElementById(elem.id).lastChild.onclick = function() { joinToRoom(this.parentNode.id, false); }
		}
	}

	function newRoomEnemy(enemies) {
		$('#roomEnemies ul li').html('');
		var playerKeys = Object.keys(enemies.players);
		for (var i = 0, j = 0; i < playerKeys.length; i++) {
			var a = enemies.players[playerKeys[i]];
			if (a.id == player.id) { player.turn = a.turn; continue; }
			$('#roomEnemies ul li').eq(j).html('Name: ' + a.name + ', Race: ' + a.race + ', Hero: ' + a.hero + ', Ready to fight: ' + (a.ready ? 'yes' : 'no'));
			j++;
		}
	}
	
	function resourceLoader(s, a) {
		if (loadedAllComponents) { socket.emit('iam ready'); }
		else {
			$('#playerReady').html('loading');
			var all = Object.keys(s).length + Object.keys(a).length, loaded = 0;
			for (var srcI in s) {
				loadedImages[srcI] = new Image();
				loadedImages[srcI].onload = function() {
					if (++loaded >= all && !loadedAllComponents) { socket.emit('iam ready'); loadedAllComponents = true; }
				};
				loadedImages[srcI].src = s[srcI];
			}
			for (var srcA in a) {
				loadedAudios[srcA] = new Audio();
				loadedAudios[srcA].addEventListener('canplaythrough', function() {
					if (++loaded >= all && !loadedAllComponents) { socket.emit('iam ready'); loadedAllComponents = true; } }, false);
				loadedAudios[srcA].src = a[srcA];
			}
		}
	}
	
	function gameStart(p) {
		$('#wrapper').hide();
		$('#game').css('visibility', 'visible');
		$('#game').animate({'top': 0}, 1000, function() { $(this).css('position', 'relative'); });
		$('#logFix').append('<p><span class="round">Round ' + room.turn + ':</span>' + room.players[p].name + '\'s turn</p>');
		if (p == player.id) { $('#mana span').html(room.players[p].mana); }
		grid(0.2);
		loadedAudios['gamestart'].play();
		drawFullContent(block);
	}
	
	function drawFullContent(s) {
		if (room.table) {
			tc.canvas.width = tc.canvas.width;
			for (var elem in room.table.content) {
				var i = room.table.content[elem];
				if (i.author) {
					tc.fillStyle = room.players[i.author].color;
					tc.fillRect(i.x * s + 1, i.y * s + 1, s - 2, s - 2);
				}
				tc.drawImage(loadedImages[i.bg], i.x * s, i.y * s, s, s);
			}
		}
	}
	
	function calcBrowserSize() {
		var blockSize = Math.floor($('#gameTable')[0].offsetWidth / 16);
		if (window.innerHeight > $('#wrapper').outerHeight() * 1.05) {
			$('#wrapper').css('margin-top', ((window.innerHeight - $('#wrapper').outerHeight()) / 2) + 'px');
		} else { $('#wrapper').css('margin-top', '10px'); }
		if ($('#tableContent')[0].width != blockSize * 16) {
			$('#tableContent')[0].width = $('#tableForeground')[0].width = $('#tableAnimations')[0].width = blockSize * 16;
			$('#tableContent')[0].height = $('#tableForeground')[0].height = $('#tableAnimations')[0].height = blockSize * 12;
			$('#game')[0].style.height = blockSize * 12 + 'px';
			drawFullContent(blockSize);
		}
		if (window.innerHeight > $('#game').outerHeight() * 1.05) {
			$('#game').css('margin-top', ((window.innerHeight - $('#game').outerHeight()) / 2) + 'px');
		} else { $('#game').css('margin-top', '10px'); }
		return blockSize;
	}
	
	function ifMyTurn() { return player.turn == room.actualPlayer; }
	
	$('#tableAnimations').click(function(e) {
		var x = Math.floor((e.offsetX || e.originalEvent.layerX) / block),
			y = Math.floor((e.offsetY || e.originalEvent.layerY) / block),
			actual = room.table.entries[room.table.rcIndex[x] + room.table.rcIndex[y]];
		if (activities.selected && activities.ability && ifMyTurn()) {
			socket.emit('my turn', {id: activities.selected.id, ability: activities.ability, target: {x:x, y:y}});
			$('#ability')[0].style.backgroundImage = ''; activities.ability = false;
		} else if (actual && room.table.content[actual].author == player.id) {
			if (!activities.ability) { activities.selected = room.table.content[actual]; initiatorSelect(); }
			else if (activities.selected && room.table.content[actual].id == activities.selected.id) { deselectAll(); }
		} else { deselectAll(); }
	});
	
	function initiatorSelect() {
		$('#selected')[0].style.backgroundImage = 'url(../' + sprites[activities.selected.bg] + ')';
		$('#abilities').html(''); var i = 0;
		loadedAudios['tableselect'].play();
		for (var elem in activities.selected.abilities) {
			$('#abilities').append('<li id="' + activities.selected.abilities[elem].id + '"><span>' + String.fromCharCode(keybinds[i]) + '</span></li>');
			var ai = $('#abilities')[0].childNodes.item(i);
			ai.style.backgroundImage = 'url(../' + sprites[activities.selected.abilities[elem].icon] + ')';
			ai.onclick = function() { abilitySelect(this.id) };
			ai.onmousemove = function(e) { showAbilityDescription(e.clientX, e.clientY, this.id); };
			ai.onmouseleave = function() { hideAbilityDescription(); }; i++;
		}
	}
	
	function abilitySelect(id) {
		if (activities.ability == id) {
			activities.ability = false;
			$('#ability')[0].style.backgroundImage = '';
		} else if (ifMyTurn()) {
			activities.ability = id;
			$('#ability')[0].style.backgroundImage = 'url(../' + sprites[activities.selected.abilities[id].icon] + ')';
			loadedAudios['abilityselect'].play();
		}
	}
	
	function deselectAll() {
		$('#abilities').html('');
		$('#ability')[0].style.backgroundImage = '';
		$('#selected')[0].style.backgroundImage = '';
		activities.ability = false;
		activities.selected = false;
	}
	
	function reDrawTable(initiator, sufferer, sound, abi, effect, additional) {
		loadedAudios[sound].play();
		var amount = typeof(effect) == 'number' ? ', value: ' + Math.abs(effect) : '';
		$('#logFix').append('<p><span class="round">Round ' + room.turn + ':</span>' +
			initiator.name + ' from ' + initiator.x + ', ' + initiator.y + ' ' +
			initiator.abilities[abi].log + ' to ' + sufferer.x + ', ' + sufferer.y + '' + amount + '</p>');
		$('#logFix').stop().animate({ scrollTop: $('#logFix')[0].scrollHeight}, 200);
		room.table.content[initiator.id] = initiator;
		if (sufferer.id) {
			if (!room.table.content[sufferer.id]) { room.table.content[sufferer.id] = sufferer; }
			else if (sufferer.hp <= 0) {
				delete room.table.content[sufferer.id];
				if (activities.selected) { if (activities.selected.id == sufferer.id) { deselectAll(); } }
			} else { room.table.content[sufferer.id] = sufferer; }
		} else if (sufferer.loot) { delete room.table.content[sufferer.boxId]; }
		if (additional) {
			for (var elem in additional) {
				if (additional[elem].id) { room.table.content[elem] = additional[elem]; }
				else { delete room.table.content[elem]; }
			}
		}
		drawFullContent(block);
		animateEffect(sufferer.x, sufferer.y, effect, initiator.abilities[abi].sprite);
	}
	
	function loadNewTurnData(recentData) {
		for (var elem in recentData.dead) {
			tc.clearRect(room.table.content[recentData.dead[elem]].x * block, room.table.content[recentData.dead[elem]].y * block, block, block);
			if (activities.selected) { if (activities.selected.id == recentData.dead[elem]) { deselectAll(); } }
		}
		overtimeAnimate(room.table.overTimes);
		room.turn = recentData.turn;
		room.actualPlayer = recentData.actualPlayer;
		room.table.authorList = recentData.authorList;
		room.table.entries = recentData.entries;
		room.table.content = recentData.content;
		room.table.overTimes = recentData.overTimes;
		if (recentData.treasure) { var b = room.table.content[recentData.treasure]; tc.drawImage(loadedImages[b.bg], b.x * block, b.y * block, block, block); }
		$('#logFix').append('<p><span class="round">Round ' + room.turn + ':</span>' + recentData.next + '\'s turn</p>');
		$('#logFix').stop().animate({ scrollTop: $('#logFix')[0].scrollHeight}, 200);
	}
	
	function showRoomWarning(warning) {
		$('#roomWarning').html(warning);
		$('#roomWarning').fadeIn(500).delay(1000).fadeOut(300);
	}
	
	function showGameWarning(warning, notice) {
		if (notice) { $('#gameWarning').css('background', 'rgba(70,70,255,0.8)'); }
		else { $('#gameWarning').css('background', 'rgba(255,70,70,0.8)'); }
		$('#gameWarning').html(warning);
		$('#gameWarning').fadeIn(600).delay(1200).fadeOut(400);
	}
	
	$('#tableAnimations').mousemove(function(e) {
		var r = Math.floor((e.offsetX || e.originalEvent.layerX) / block),
			c = Math.floor((e.offsetY || e.originalEvent.layerY) / block),
			boxTop = Math.min((document.documentElement.scrollTop || window.scrollY) + window.innerHeight - 300, (e.offsetY || e.originalEvent.layerY));
		$('#infoBox').css({'top': boxTop + 'px', 'left': (e.pageX + 70) + 'px'});
		if (r == coordX && c == coordY) { return false; }
		coordX = r; coordY = c;
		grid(0.6); highLight(r * block, c * block);
		if (room.table) {
			var actual = room.table.entries[room.table.rcIndex[r] + room.table.rcIndex[c]];
			if (actual && room.table.content[actual].id) {
				var t = room.table.content[actual],
					f = room.table.formulas;
				var tInfo = '<p class="tName">' + t.name + '</p>';
				tInfo += '<p class="tAuthor">' + 'author: ' + room.players[t.author].name + '</p>';
				tInfo += '<p class="tRace">race: ' + t.race + '</p>';
				tInfo += '<p class="tHp">hp: ' + t.hp + '/' + t.maxHp + '</p>';
				tInfo += '<p class="tPos">position: ' + t.x + ' : ' + t.y + '</p>';
				tInfo += '<p class="">defense: ' + t.defense + '</p>';
				if ('strength' in t) { tInfo += '<p class="">attack power: ' + (t.strength * f.strRate) + '</p>'; }
				if ('agility' in t) { tInfo += '<p class="">crit: ' + Math.round(t.agility / f.agiRate * 100, 2) + '%</p>'; }
				if ('hit' in t) { tInfo += '<p class="">hit: ' + Math.round(t.hit / f.hitRate * 100, 2) + '%</p>'; }
				if ('gold' in t) { tInfo += '<p class="">gold: ' + t.gold + '</p>'; }
				tInfo += '<p class="tAbilities">abilities: ';
				for (var a in t.abilities) { tInfo += t.abilities[a].name + ', '; }
				tInfo = tInfo.substring(0, tInfo.length - 2) + '</p>';
				if (t.overTimes.length) {
					tInfo += '<p class="tOvertimes">each turn: ';
					for (var o in t.overTimes) {
						var oo = room.table.overTimes[t.overTimes[o]];
						tInfo += oo.amount + ' health point (' + oo.times + ' turn(s) remaining), ';
					}
					tInfo = tInfo.substring(0, tInfo.length - 2);
					tInfo += '</p>';
				}
				$('#infoBox').html(tInfo);
				$('#infoBox').css('display', 'block');
			} else { $('#infoBox').css('display', 'none'); $('#infoBox').html(''); }
		}
	});
	
	$('#tableAnimations').mouseleave(function(e) { grid(0.2); coordX = coordY = -1; $('#infoBox').html(''); $('#infoBox').css('display', 'none'); });
	
	function showAbilityDescription(x, y, id) {
		$('#abilityDesc').css({'top': (y - 100) + 'px', 'left': (x - 200) + 'px'});
		if (activities.selected) {
			var a = activities.selected.abilities[id],
				dsc = a.cost ? a.description + ', cost: ' + a.cost : a.description;
			if (a) { $('#abilityDesc').html(dsc); $('#abilityDesc').css('display', 'block'); }
			else { hideAbilityDescription(); }
		}
	};
	
	function hideAbilityDescription() { $('#abilityDesc').css('display', 'none'); $('#abilityDesc').html(''); }
	
	function animateEffect(x, y, effect, sprite) {
		var color, text;
		if (effect === false) { color = 'rgba(255,255,255,'; text = ''; }
		else if (typeof(effect) == 'string') { color = 'rgba(255,255,255,'; text = effect; }
		else {
			if (effect < 0) { color = 'rgba(255,0,0,'; text = '-' + Math.abs(effect); }
			else if (effect > 0) { color = 'rgba(0,255,0,'; text = '+' + effect; }
			else { color = 'rgba(255,255,255,'; text = 'Miss'; }
		}
		ta.font = 'bold 20px Georgia';
		var textWidth = ta.measureText(text).width,
			xx = x * block, yy = y * block,
			tx = xx + (block - textWidth) / 2,
			ty = yy + block / 2;
		
		aeld = {
			tick: 0, frame: 0, tpf: 16, allFrame: 4, slice: 80,
			img: loadedImages[sprite], c: color, a: 1,
			tx: tx, ty: ty, t: text, run: false, xx: xx, yy: yy
		};
		if (!aeld.img) { aeld.img = loadedImages['wind']; }
		if (!aeld.run) { loop(); aeld.run = true; }
	}
	
	function loop() {
		requestId = window.requestAnimationFrame(loop);
		render();
	}
	
	function render() {
		if (++aeld.tick > aeld.tpf) {
			aeld.tick = 0;
			if (aeld.frame < aeld.allFrame - 1) { aeld.frame++; }
			else { aeld.frame = 0; }
		}
		ta.clearRect(0, 0, ta.canvas.width, ta.canvas.height);
		ta.fillStyle = aeld.c + aeld.a + ')'; ta.fillText(aeld.t, aeld.tx, aeld.ty);
		ta.drawImage(aeld.img, aeld.frame * aeld.slice, 0, aeld.slice, aeld.slice, aeld.xx, aeld.yy, block, block);
		if (aeld.a < 0) {
			window.cancelAnimationFrame(requestId);
			console.log('success');
			aeld.run = false;
			ta.clearRect(0, 0, ta.canvas.width, ta.canvas.height);
		}
		aeld.ty -= 1; aeld.a -= 0.05;
	}
	
	function overtimeAnimate(ots) {
		ta.font = 'bold 20px Georgia';
		var alpha = 1, a = [], c = [], x = [], y = [];
		for (var curse in ots) {
			var i = ots[curse],
				t = room.table.content[i.target];
			c.push(i.amount < 0 ? 'rgba(255,0,0,' : 'rgba(0,255,0,');
			x.push(t.x * block + (block - ta.measureText(i.amount).width) / 2);
			y.push(t.y * block + block / 2);
			if (i.amount > 0) { i.amount = '+' + i.amount; }
			a.push(i.amount);
		}
		var fadeOut = setInterval(function() {
			ta.clearRect(0, 0, ta.canvas.width, ta.canvas.height);
			for (var j = 0; j < c.length; j++) {
				ta.fillStyle = c[j] + alpha + ')';
				ta.fillText(a[j], x[j], y[j]);
				y[j] -= 1;
			}
			if (alpha < 0) {
				clearInterval(fadeOut);
				ta.clearRect(0, 0, ta.canvas.width, ta.canvas.height);
			}
			alpha -= 0.05;
		}, 50);
	}
	
	function grid(opacity) {
		var x = y = 0;
		tf.canvas.width = tf.canvas.width;
		tf.beginPath(); tf.lineWidth = 1; tf.strokeStyle = 'rgba(240,240,240,'+opacity+')';
		for (var i = 0; i < tf.canvas.width / 16; i++) { y += block; tf.moveTo(0, y); tf.lineTo(tf.canvas.width, y); }
		for (var i = 0; i < tf.canvas.height / 12; i++) { x += block; tf.moveTo(x, 0); tf.lineTo(x, tf.canvas.height); }
		tf.stroke();
	}
	
	function highLight(x, y) {
		tf.beginPath();
		tf.lineWidth = 2;
		tf.strokeStyle = '#0066dd';
		tf.strokeRect(x, y, block, block);
		tf.stroke();
	}

});