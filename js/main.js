jQuery(function ($) {
	var socket 			= io.connect(),
		myChatUsername 	= false,
		privateChats	= {}
	;

	$(document).on('DOMNodeRemoved', function(e) {
		if (!myChatUsername) {
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

	$('body').delegate('.chatForm', 'submit', function (e) {
		e.preventDefault();

		var chatbox 	= $(e.target).closest('.activeChatBox'),
			newMessage  = {
			fromUsername  	: myChatUsername, 
			toUsername  	: chatbox.attr('username'), 
			message 		: $(e.target).find('input[name="message"]').val(),
			isPrivate		: chatbox.is('.privateChat')
		};

		if (newMessage.message === '') {
			return;
		}

		socket.emit('sendMessage', newMessage);

		if (newMessage.isPrivate) {

			var chatDate 	= new Date(),
				chatHours	= chatDate.getHours(),
				chatMinutes = chatDate.getMinutes()
			;

			newMessage['chatTime'] = (chatHours < 10 ? '0'+chatHours:chatHours)+':'+(chatMinutes < 10 ? '0'+chatMinutes:chatMinutes);
			newMessage['uniqueId'] = chatDate.getTime();
			setNewMessage(newMessage);
		}

		$(e.target).find('input[name="message"]').val('')
		$(e.target).closest('.chatForm').find('.sendMessage').focus();	
	});

	socket.on('setUsername', function (data) {

		if (data.status === 'ok') {
			myChatUsername = data.username.toString();
			$(document).trigger('DOMNodeRemoved');
			$('#message').focus();
			$('.usernameError').hide();
		} else {
			$('.usernameError').show();
		}
	});

	socket.on('updateUsernames', function (usernames) {
		if (!myChatUsername) return false;

		var userList 	   = $('.usersList ul').empty(),
			totalUsernames = usernames.length-1;

		$(usernames).each(function (k,v) {
			var liUsername = $('<li>').addClass(( v === myChatUsername ? 'active' : '')).attr('username', v).text(v).click(function () {

				if ($(this).attr('username') === myChatUsername) {
					return false;
				}

				var privateChat = $('.privateChat[username="'+v+'"]');

				if (privateChat.hasClass('activeChatBox')) {
					return false;
				}

				$('.activeChatBox').slideUp();

				if (privateChat.length === 0) {
					$('.mainChat').clone().attr('username', v).removeClass('mainChat').addClass('privateChat').appendTo('.privateChats');

					privateChat = $('.privateChat[username="'+v+'"]');

					privateChat.find('.chatBoxTitle').text('Private chat with '+v);
					privateChat.find('.chat').empty();
					$('<span>').addClass('backToMainChat pull-right').text('Back to main chatbox').appendTo(privateChat.find('.chatBoxTitle')).click(function () {

						$('.activeChatBox').slideUp().removeClass('activeChatBox');
						$('.mainChat').slideDown().addClass('activeChatBox');

					});
				}

				if (privateChats[v] !== undefined ) {

					$.each(privateChats[v].messages, function (key,value) {
						setNewMessage(value, v, key);
					});
				}

				$('.privateChat').hide();
				$('.activeChatBox').removeClass('activeChatBox');

				privateChat.show().addClass('activeChatBox').slideDown(function () {
					$(this).removeAttr('style').show();
				});
			});

			var privateMessages = $('<span>').addClass('privateMessages badge pull-right');

			privateMessages.appendTo(liUsername);
			liUsername.appendTo(userList);
		});

		//Check for unwanted private massages
		$('.privateChat[username]').each(function (k,v) {
			if (userList.find('li[username="'+$(this).attr('username')+'"]')) {

				if ($(this).hasClass('activeChatBox') ) {
					$('.mainChat').addClass('activeChatBox').slideUp();
				}

				$(this).remove();
			}
		});
	});

	socket.on('newMessage', setNewMessage);

	function setNewMessage(data, privateChatUsername, messageId) {

		var fromUsername 	 = data.fromUsername,
			toUsername 		 = data.toUsername,
			chatTime 		 = data.chatTime,
			chatMessage 	 = data.message,
			chatLi			 = '',
			appendToDiv		 = (data.isPrivate && $('.privateChat[username="'+(fromUsername === myChatUsername ? toUsername : fromUsername)+'"] .chat').length === 1 ? $('.privateChat[username="'+(fromUsername === myChatUsername ? toUsername : fromUsername)+'"] .chat') : '.mainChat .chat')
		;

		if (data.isPrivate && fromUsername === myChatUsername && $('.activeChatBox.privateChat[username="'+toUsername+'"]').length === 1) {
			//Just pass
		} else if (data.isPrivate && $('.activeChatBox.privateChat[username="'+fromUsername+'"]').length === 0) {

			if (privateChats[fromUsername] === undefined) {
				privateChats[fromUsername] = { 'messages' : [] };
			}

			privateChats[fromUsername]['messages'] = $.merge(privateChats[fromUsername]['messages'], [ data ] );

			if (privateChats[fromUsername]['interval'] === undefined ) {

				$('.usersList li[username="'+fromUsername+'"]').addClass('newMessage');
				privateChats[fromUsername]['interval'] = setInterval(function () {
					$('.usersList li[username="'+fromUsername+'"] .privateMessages').addClass('show').text(Object.keys(privateChats[fromUsername]['messages']).length);

					$('.usersList li[username="'+fromUsername+'"]').toggleClass('newMessage');

					if (Object.keys(privateChats[fromUsername]['messages']).length === 0 ) {
						clearInterval(privateChats[fromUsername]['interval']);
						$('.usersList li[username="'+fromUsername+'"]').removeClass('newMessage');
						delete privateChats[fromUsername];
						$('.usersList li[username="'+fromUsername+'"] .privateMessages').removeClass('show');
					}
				}, 2000);
			}
			return;
		}

		if (fromUsername === myChatUsername) {	
			chatLi = $('<li class="right ChatMessage clearfix">'+
				'<span class="chatImage pull-right">'+
				'	<span class="messageOwner">U</span>'+
		        '</span>'+
	            '<div class="chat-body clearfix">'+
	                '<div class="header">'+
	                    '<strong class="chatUsername pull-right">'+fromUsername+'</strong>'+
	                    '<small class="text-muted chatTime">'+
	                    '    <span class="glyphicon glyphicon-time"></span>'+
	                    chatTime+
	                    '</small>'+
	                '</div>'+
	                '<p class="chatMessage">'+chatMessage+'</p>'+
	            '</div>');
		} else {
			chatLi = $('<li class="left ChatMessage clearfix">'+
				'<span class="chatImage pull-left">'+
				'	<span class="messageOwner">Them</span>'+
		        '</span>'+
	            '<div class="chat-body clearfix">'+
	                '<div class="header">'+
	                    '<small class="text-muted chatTime pull-right">'+
	                    '    <span class="glyphicon glyphicon-time"></span>'+
	                    chatTime+
	                    '</small>'+
	                    '<strong class="chatUsername">'+fromUsername+'</strong>'+
	                '</div>'+
	                '<p class="chatMessage">'+chatMessage+'</p>'+
	            '</div>');
		}

		if (privateChatUsername !== undefined && messageId !== undefined && typeof privateChats[privateChatUsername].messages[messageId] === 'object') {
			delete privateChats[privateChatUsername].messages[messageId];
			
			if ($(privateChats[privateChatUsername].messages).length === 0) {
				delete privateChats[privateChatUsername];
			}
		}
        chatLi.appendTo(appendToDiv)

  		$('.activeChatBox .chat').animate({ scrollTop: $('.activeChatBox .chat')[0].scrollHeight }, 450);
	}
	
});