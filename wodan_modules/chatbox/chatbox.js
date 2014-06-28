
define( ['socketio'], function (io) {
	"use strict";

	function chatbox() {

		//variables
		var socket          = io.connect(),
			myChatUsername  = false,
			privateChats    = {},
			settings	    = {
				mainChat: '.mainChat',
				chatForm: '.chatForm',
				chatbox: '.chatbox',
				username: '#username',
				privateChats: '.privateChats',
				privateChat: '.privateChat',
				fillInUsername: '.fillInUsername',
				fillInUsernameForm: '#fillInUsernameForm',
				activeChatBox: '.activeChatBox',
				chatField: '.chat',
				privateMessages: '.privateMessages',
				message: '#message',
				sendMessage: '.sendMessage',
				usernameError: '.usernameError',
				usersList: '.usersList',
				floodingMessage: 'You are flooding',
				maxFlooding: 5,
				minimalFloodingTime: 2,
				commandStart: '/',
				commands: {
					listSettings: {
						helpText: 'Return all settings',
						callBack: function () {
							var allSettings = '';

							for (var mySetting in settings) {
								allSettings += 'settings.'+mySetting+' = '+(typeof settings[mySetting] === 'string' ? settings[mySetting] : 'an function')+'<br />';
							}

							return allSettings;
						}
					},
					setting: {
						helpText: 'Return a setting by /setting settingName (only string settings)',
						callBack: function (settingName) {
							var setting = 'unkown setting';

							if (settings[settingName] !== undefined && typeof settings[settingName] === 'string') {
								setting = settings[settingName];
							}

							return setting;
						}
					}
				}
			},
			lastMessageTime = 0,
			lastMessage		= '',
			floodTimes		= 0,
			ctx 			= this
		;

		//Main function
		this.init = function (newSettings) {
			if (typeof newSettings === 'object') {
				// Merge newSettings into settings
				$.extend(settings, newSettings);
			}

			$(document).on('DOMNodeRemoved', function(e) {
				if (!myChatUsername) {
					setTimeout(function () {
						$(settings.fillInUsername).show();
						$(settings.chatbox).hide();
					}, 1);
				} else {
					setTimeout(function () {
						$(settings.fillInUsername).hide();
						$(settings.chatbox).show();
					}, 1);
				}
				return false;
			});	

			$(settings.fillInUsernameForm).submit(function (e) {
				e.preventDefault();
				socket.emit('checkUsername', $(settings.username).val());
				$(settings.username).val('')

			});

			$('body').delegate(settings.chatForm, 'submit', function (e) {
				e.preventDefault();

				var now = Math.round(+new Date()/1000);

				var chatbox 		 = $(e.target).closest(settings.activeChatBox),
					chatMessage 	 = $(e.target).find('input[name="message"]').val(),

					renderMessage	 = messageRender(chatMessage),				
					newMessage  	 = {
						fromUsername  	: myChatUsername, 
						toUsername  	: chatbox.attr('username'), 
						message 		: renderMessage.msg,
						isPrivate		: chatbox.is(settings.privateChat)
					}
				;

				if (chatMessage === '') {
					setErrorChatMessage('Type an message');
					return;
				}

				if (renderMessage.type === 'error') {
					setErrorChatMessage(renderMessage.msg);
					return false;
				}

				if (newMessage.message === lastMessage) {
					++floodTimes;
				} else {
					floodTimes  = 0;
				}

				if (lastMessageTime > 0 && (now-lastMessageTime) < settings.minimalFloodingTime) {
					$(e.target).find('input[name="message"]').val('')
					$(e.target).closest(settings.chatForm).find(settings.sendMessage).focus();

					setErrorChatMessage('to fast !');//settings.floodingMessage
					return;
				} else if (floodTimes >= settings.maxFlooding) {

					$(e.target).find('input[name="message"]').val('')
					$(e.target).closest(settings.chatForm).find(settings.sendMessage).focus();	

					setErrorChatMessage('Duplicate messages');//settings.floodingMessage);
					return;
				} else {
					lastMessageTime = now;
					lastMessage     = newMessage.message;
				}

				if (newMessage.message === '') {
					return;
				}

				if (renderMessage.type === 'public') {
					socket.emit('sendMessage', newMessage);
				} else { 

					var chatDate 	= new Date(),
						chatHours	= chatDate.getHours(),
						chatMinutes = chatDate.getMinutes()
					;

					newMessage['chatTime'] = (chatHours < 10 ? '0'+chatHours:chatHours)+':'+(chatMinutes < 10 ? '0'+chatMinutes:chatMinutes);
					newMessage['uniqueId'] = chatDate.getTime();

					if (renderMessage.type === 'private' || renderMessage.type === 'error') {
						ctx.setNewMessage(newMessage);
					} else if (newMessage.isPrivate) {
						ctx.setNewMessage(newMessage);
					}
				}

				$(e.target).find('input[name="message"]').val('')
				$(e.target).closest(settings.chatForm).find(settings.sendMessage).focus();	
			});

			socket.on('setUsername', setUsername);
			socket.on('updateUsernames', updateUsernames);
			socket.on('newMessage', this.setNewMessage);
		};

		var setErrorChatMessage = function (errorMessage) {
			var errorMessage = $('<li>').addClass('alert alert-warning').text(errorMessage);
			$(errorMessage).appendTo(settings.activeChatBox+' '+settings.chatField);

	  		$(settings.activeChatBox+' '+settings.chatField).stop().animate({ scrollTop: $(settings.activeChatBox+' '+settings.chatField)[0].scrollHeight }, 1);
		};

		var setChatMessage = function (msg) {
			var chatMessage = $('<li>').addClass('alert alert-info').text(msg);
			$(msg).appendTo(settings.activeChatBox+' '+settings.chatField);

	  		$(settings.activeChatBox+' '+settings.chatField).stop().animate({ scrollTop: $(settings.activeChatBox+' '+settings.chatField)[0].scrollHeight }, 1);
		};

		var updateUsernames = function (usernames) {

			if (!myChatUsername) return false;

			var userList 	   = $(settings.usersList+' ul').empty();

			$(usernames).each(function (k,v) {

				var liUsername = $('<li>').addClass(( v === myChatUsername ? 'active' : '')).attr('username', v).text(v).click(function () {

					if ($(this).attr('username') === myChatUsername) {
						return false;
					}

					var privateChat = $(settings.privateChat+'[username="'+v+'"]');

					if (privateChat.hasClass(getClassName(settings.activeChatBox))) {
						return false;
					}

					$(settings.activeChatBox).slideUp();

					if (privateChat.length === 0) {
						$(settings.mainChat).clone().attr('username', v).removeClass(getClassName(settings.mainChat)).addClass(getClassName(settings.privateChat)).appendTo(settings.privateChats);

						privateChat = $(settings.privateChat+'[username="'+v+'"]');

						privateChat.find('.chatBoxTitle').text('Private chat with '+v);
						privateChat.find(settings.chatField).empty();
						$('<span>').addClass('backToMainChat pull-right').text('Back to main chatbox').appendTo(privateChat.find('.chatBoxTitle')).click(function () {

							$(settings.activeChatBox).slideUp().removeClass(getClassName(settings.activeChatBox));
							$(settings.mainChat).slideDown().addClass(getClassName(settings.activeChatBox));

						});
					}

					if (privateChats[v] !== undefined ) {

						$.each(privateChats[v].messages, function (key,value) {
							ctx.setNewMessage(value, v, key);
						});
					}

					$(settings.privateMessages).hide();
					$(settings.activeChatBox).removeClass(getClassName(settings.activeChatBox));

					privateChat.addClass(getClassName(settings.activeChatBox)).slideDown(function () {
						$(this).removeAttr('style');
					});
				});

				var privateMessages = $('<span>').addClass(getClassName(settings.privateMessages)+' badge pull-right');

				privateMessages.appendTo(liUsername);
				liUsername.appendTo(userList);
			});

			//Check for unwanted private massages
			$(settings.privateChat+'[username]').each(function (k,v) {
				if (userList.find('li[username="'+$(this).attr('username')+'"]')) {

					if ($(this).hasClass(getClassName(settings.activeChatBox)) ) {
						$(settings.mainChat).addClass(getClassName(settings.activeChatBox)).slideUp();
					}

					$(this).remove();
				}
			});
		};

		var messageCommandos = function (commandName, params) {
			var commandOut = 'Unkown command try help';

			if (settings.commands !== undefined ) {
				if (commandName === 'help') {
					commandOut = '<span class="shortLine" style="border:1px solid #333;">Help commands</span><br />';

					for (var index in settings.commands) { 
   						if (settings.commands.hasOwnProperty(index)) {  							

							commandOut += '/'+index+'<br />';
							commandOut += settings.commands[index]['helpText']+'<br />';
							commandOut += '<br />';
						}
					}

				} else if (settings.commands[commandName] !== undefined) {
					commandOut = (typeof settings.commands[commandName].callBack === 'function' ? settings.commands[commandName].callBack(params) : settings.commands.callBack[commandName]);
				}
			}

			return commandOut;
		};

		var messageRender = function (msg) {

			if (msg.substr(0,1) === settings.commandStart) {
				var command = msg.substr(1,msg.length-1).split(' ');

				return { type: 'private', msg: messageCommandos(command[0], command[1]) };
			}

			return { type: 'public', msg: msg };
		};

		var getClassName = function(className) {
			return className.replace('.', '').replace('.', '');
		};

		//Private function set Username
		var setUsername = function (data) {

			if (data.status === 'ok') {
				myChatUsername = data.username.toString();
				$(document).trigger('DOMNodeRemoved');
				$(settings.message).focus();
				$(settings.usernameError).hide();

				return true;
			} else {
				$(settings.usernameError).show();
				return false;
			}
		};

		//Animate document Title
		var animateDocumentTitle = function () {
			if (typeof privateChats['chatBoxanimateDocumentTitle']['running'] === 'undefined') {
				return false;
			}

			//Set animate running
			privateChats['chatBoxanimateDocumentTitle']['running'] = true;

			var originalTitle = document.title,
				animStep 	  = true
			;

			var getTotalMessages = function () {
				
				var amount 		  = 0;
				$.each(privateChats, function (k,v) {
					amount += $(v['messages']).length;
				});

				return amount;
			}

			var	animateTitle  = function() {
				var totalMessages = getTotalMessages();

				if (totalMessages === 0) {
					delete privateChats['chatBoxanimateDocumentTitle'];
					return false;
				}

		        if (animStep) {
		            document.title = totalMessages+' new messages - '+origTitle;
		        } else {
		            document.title = origTitle;
		        }
		        animStep = !animStep;
			    setTimeout(animateTitle, 1000);
			};

			animateTitle();
		};

		//Pubic set NewMessage function
		this.setNewMessage = function (data, privateChatUsername, messageId) {
			var fromUsername 	 = data.fromUsername,
				toUsername 		 = data.toUsername,
				chatTime 		 = data.chatTime,
				chatMessage 	 = data.message,
				chatLi			 = '',
				appendToDiv		 = (data.isPrivate && $(settings.privateChat+'[username="'+(fromUsername === myChatUsername ? toUsername : fromUsername)+'"] '+settings.chatField).length === 1 ? $(settings.privateChat+'[username="'+(fromUsername === myChatUsername ? toUsername : fromUsername)+'"] '+settings.chatField) : settings.mainChat+' '+settings.chatField)
			;

			if (data.isPrivate && fromUsername === myChatUsername && $(settings.activeChatBox+settings.privateChat+'[username="'+toUsername+'"]').length === 1) {
				//Just pass
			} else if (data.isPrivate && $(settings.activeChatBox+settings.privateChat+'[username="'+fromUsername+'"]').length === 0) {

				if (privateChats[fromUsername] === undefined) {
					privateChats[fromUsername] = { 'messages' : [] };
				}

				privateChats[fromUsername]['messages'] = $.merge(privateChats[fromUsername]['messages'], [ data ] );

				if (privateChats[fromUsername]['interval'] === undefined ) {
					animateDocumentTitle();

					$(settings.usersList+' li[username="'+fromUsername+'"]').addClass('newMessage');
					privateChats[fromUsername]['interval'] = setInterval(function () {
						$(settings.usersList+' li[username="'+fromUsername+'"] '+settings.privateMessages).addClass('show').text(Object.keys(privateChats[fromUsername]['messages']).length);

						$(settings.usersList+' li[username="'+fromUsername+'"]').toggleClass('newMessage');

						if (Object.keys(privateChats[fromUsername]['messages']).length === 0 ) {
							clearInterval(privateChats[fromUsername]['interval']);
							$(settings.usersList+' li[username="'+fromUsername+'"]').removeClass('newMessage');
							delete privateChats[fromUsername];
							$(settings.usersList+' li[username="'+fromUsername+'"] '+settings.privateMessages).removeClass('show');
						}
					}, 2000);
				}
				return;
			}

			if (fromUsername === myChatUsername) {	
				chatLi = $('<li class="right ChatMessage clearfix">'+
					'<span class="chatImage pull-right">'+
					'	<span class="messageOwner">YOU</span>'+
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

	        chatLi.appendTo(appendToDiv);

	  		$(settings.activeChatBox+' '+settings.chatField).stop().animate({ scrollTop: $(settings.activeChatBox+' '+settings.chatField)[0].scrollHeight }, 1);
		}

		//Receive chat socket
		this.getSocket = function() {
			return socket;
		}

		//Receive chatUsername
		this.getChatUsername = function() {
			return myChatUsername;
		}
	};

	return (new chatbox());
});