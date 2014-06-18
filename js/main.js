jQuery(function ($) {
	var socket 			= io.connect(),
		chatUsername 	= false
	;

	$(document).on('DOMNodeRemoved', function(e) {
		if (!chatUsername) {
			setTimeout(function () {
				$('.fillInUsername').show();
				$('.chatbox').hide();
			}, 1);
		} else {
			setTimeout(function () {
				$('.fillInUsername').hide();
				$('.chatbox').show();
			}, 1);
		}
		return false;
	});	

	$('#fillInUsernameForm').submit(function (e) {
		e.preventDefault();
		socket.emit('checkUsername', $('#username').val());
		$('#username').val('')
	});

	$('#chatForm').submit(function (e) {
		e.preventDefault();
		socket.emit('sendMessage', $('#message').val());
		$('#message').val('')
	});

	socket.on('setUsername', function (data) {
		console.log(data, 'data');

		if (data.status === 'ok') {
			chatUsername = data.username.toString();
			$(document).trigger('DOMNodeRemoved');
			$('#message').focus();
		} else {
			console.error('Already in use');
		}
	});

	socket.on('updateUsernames', function (usernames) {
		if (!chatUsername) return false;

		var htmlUsers = '';
		for (var i = usernames.length-1; i >= 0; --i) {
			htmlUsers += '<div class="chatUser '+( usernames[i] === chatUsername ? 'chatUserMe' : '')+'">'+usernames[i]+'</div><br />';
		}

		$('.usersList').html(htmlUsers);
	});

	socket.on('newMessage', function (data) {
		$('.chat').append('<div class="textMessage">'+data.username+': '+data.message.toString().replace(/<[^>]*>/g, '')+'</div><br />');
	});

	
});