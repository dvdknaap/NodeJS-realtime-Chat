var express 	= require('express'),
	app 		= express(),
	server 		= require('http').createServer(app),
	io   		= require('socket.io').listen(server),
	fs			= require('fs'),
	serverPort 	= 80,
	users		= {}
;

server.listen(serverPort);

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
		
		switch (url.split('.').pop()) {
			case 'css' :
				res.writeHead(200, {'Content-Type': 'text/css'});
			break;
			case 'js' :
				res.writeHead(200, {'Content-Type': 'text/js'});
			break;
			case 'html' :
				res.writeHead(200, {'Content-Type': 'text/html'});
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

	socket.on('sendMessage', function (message) {
		io.sockets.emit('newMessage', { 'username' : socketUser['username'], 'message' : message });
	});

	socket.on('checkUsername', function (username) {
		var response = {};

		if (username in users) {
			response = { 'status' : 'fail', 'username' : username };
		} else {
			users[username] = socket;
			socketUser['username'] = username;

			response        = { 'status' : 'ok', 'username' : username };
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

console.log('server is running on '+serverPort);