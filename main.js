var express 	= require('express'),
	app 		= express(),
	server 		= require('http').createServer(app),
	io   		= require('socket.io').listen(server),
	fs			= require('fs'),
	serverPort 	= 9001,
	users		= {}
;

server.listen(serverPort, function () {

	console.log('server is running on '+serverPort);
});


/*
app.get('/', function (req, res) {
	res.sendfile(__dirname+'/index.html');
});
*/

app.get('*', function (req, res) {
	var url = (req.url === '/' ? '/index.html' : req.url);

	fs.readFile(__dirname + url, function (err, data) {
		if (err) {
			console.log(err, 'not found ');
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write('404 file not found');
			res.end();
			return;
		}
		

		//Dont let them read this file !!
		if (url === '/main.js') {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write('404 file not found');
			res.end();
			return;
		}

		switch (url.split('.').pop()) {
			case 'css' :
				res.writeHead(200, {'Content-Type': 'text/css'});
			break;
			case 'js' :
				res.writeHead(200, {'Content-Type': 'text/javascript'});
			break;
			case 'html' :
				res.writeHead(200, {'Content-Type': 'text/html'});
			break;
			case 'woff' :
				res.writeHead(200, {'Content-Type': 'application/x-font-woff'});
			break;
			case 'ttf' :
				res.writeHead(200, {'Content-Type': 'application/octet-stream'});
			break;
			case 'svg' :
				res.writeHead(200, {'Content-Type': 'image/svg+xml'});
			break;
			case 'eot' :
				res.writeHead(200, {'Content-Type': 'font/otf'});
			break;
			default:
			console.log('unkown file type');
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write('unkown file type');
			res.end();
			return;
		}

		res.write(data);
		res.end();
	});
});

io.sockets.on('connection', function (socket) {

	var socketUser = {};

	socket.on('sendMessage', function (data) {
		var chatDate 	= new Date(),
			chatHours	= chatDate.getHours(),
			chatMinutes = chatDate.getMinutes(),
			sendMessage = { 
				'fromUsername'  : data.fromUsername, 
				'toUsername'  	: data.toUsername, 
				'message'   	: data.message.toString().replace(/<[^>]*>/g, ''), 
				'chatTime'  	: (chatHours < 10 ? '0'+chatHours:chatHours)+':'+(chatMinutes < 10 ? '0'+chatMinutes:chatMinutes),
				'isPrivate' 	: data.isPrivate,
				'uniqueId'		: new Date().getTime()
			};

		if (data.isPrivate && users[data.toUsername] !== undefined) {
			users[data.toUsername].emit('newMessage', sendMessage);
		} else {
			io.sockets.emit('newMessage', sendMessage);
		}
	});

	socket.on('checkUsername', function (username) {
		var response = {};

		username = username.toString().replace(/<[^>]*>/g, '');

		if (username in users) {
			response = { 'status' : 'fail', 'username' : username };
		} else {
			users[username]        = socket;
			socketUser['username'] = username;

			response = { 'status' : 'ok', 'username' : username };
		}

		socket.emit('setUsername',  response);

		if (response.status === 'ok') {
			io.sockets.emit('updateUsernames',  Object.keys(users));
		}
	});

	socket.on('disconnect', function (data) {
		delete users[socketUser['username']];
		socketUser = {};
		io.sockets.emit('updateUsernames',  Object.keys(users));
	});
});
