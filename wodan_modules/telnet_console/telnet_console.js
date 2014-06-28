var     net             = require('net'),
        telnetSockets   = [],
        ioSockets       = {},
        async           = require('async')
        ;

function receiveData(data, id) {
    var command     = data.trim().split(' '),
        socket      = false
    ;

    console.log(command, 'command');

    if (telnetSockets[id] === undefined ) {
        console.log(telnetSockets, 'Unkown socket '+id);
        return;
    }

    switch(command[0].toLowerCase()) {
        case "exit":
            telnetSockets[id].write('Bye bye\n');
            telnetSockets[id].destroy();
            delete telnetSockets[id];
            return;
        break;

        case "chatusers":
            if(Object.keys(ioSockets).length > 0) {

                for(var index in ioSockets) {
                    telnetSockets[id].write(index + ' -> ' + (ioSockets[index]['username'] === undefined ? 'Not in chat yet' : ioSockets[index]['username'])+ '\n');
                }
            } else {
                telnetSockets[id].write('No chatusers online.\n');
            }
        break;
        case "kickuser":

            var userSocket = getUserIoSocket(command[1].trim().toString());

            if (!userSocket) {
                telnetSockets[id].write('This user doesnt exists');
            } else {
                telnetSockets[id].write('kickuser '+command[1]);
                userSocket.emit('telnetKickUser', command);
            }
        break;
        case "sendmessage":

            var userSocket = getUserIoSocket(command[1].trim().toString());

            if (!userSocket) {
                telnetSockets[id].write('This user doesnt exists');
            } else {
                userSocket.emit('telnetSetChatMessage', command);
                telnetSockets[id].write('sended message to '+command[1]);
            }
        break;



        default:
            if(data.trim() != "") {
                for(var index in telnetSockets) {
                    telnetSockets[index].write('Parrot ('+index+') -> ' +  data + '\n');
                }
            }
        break;
    }

    telnetSockets[id].write('\n> ');
}

function newSocket(socket) {
    /*
    if (!socket.connected) {
        removeIoSocket(socket);
        console.log('connection has been closed', socket);
        return false;
    }*/

    socket.setEncoding('utf8');
    var uniqueID = 'telnetID' + Math.random().toString(16).slice(2);//because socket.id doesnt exists

    telnetSockets[uniqueID] = socket;
    console.log('Connection from -> ' + socket.remoteAddress + ':' + socket.remotePort + '\n');
    socket.write('Welcome (' + socket.remoteAddress + ') to the Dyflexis telnet server!\n');
    socket.write('PASV send to port: ' + socket.remotePort + '\n\n> ');
    socket.on('data', function(data) {
        receiveData(data, uniqueID);
    });



    socket.on('end', function () {
        console.log('end')
    })

    socket.on('close', function () {
        console.log('close')
    });

    socket.on('drain', function () {
        console.log('drain')
    });

    socket.on('error', function (e) {
        console.log('error', e)
    });
}

function start(telnetPort) {
    var server = net.createServer(newSocket);
    server.listen(telnetPort);
    console.log('Telnet console is running on ' + telnetPort);
}

function addIoSocket(ioSocket) {
    ioSockets[ioSocket.id] = {
        socket: ioSocket
    };
}

function removeIoSocket(ioSocketId) {
    delete ioSockets[ioSocketId];
}

function getIoSockets() {
    return ioSockets;
}

function getUserIoSocket(username) {
    var userSocket = false;

    for (var socketID in ioSockets) {
        if (ioSockets[socketID]['username'] === username) {
            userSocket = ioSockets[socketID]['socket'];
        }
    }
    return userSocket;
}
module.exports.addUsername = function (socket, username) {    
    ioSockets[socket.id]['username'] = username;
    return true;
}

module.exports.start = function (telnetPort) {
    return start(telnetPort);
}

module.exports.addIoSocket = function (ioSocket) {
    return addIoSocket(ioSocket);
}

module.exports.removeIoSocket = function (ioSocketId) {
    return removeIoSocket(ioSocketId);
}