var     net             = require('net'),
        telnetSockets   = [],
        ioSockets       = [],
        async           = require('async')
        ;

function receiveData(data, id) {
    switch(data.trim()) {
        case "exit":
            telnetSockets[id].write('Bye bye\n');
            telnetSockets[id].destroy();
        break;

        case "chatusers":
            if(Object.keys(ioSockets).length > 0) {
                for(var index in ioSockets) {
                    telnetSockets[id].write(index + ' -> ' + 'bla' + '\n');
                }
                telnetSockets[id].write('> ');
            } else {
                telnetSockets[id].write('No chatusers online.\n> ');
            }
        break;

        default:
            if(data.trim() != ""){
                for(var index in telnetSockets) {
                    telnetSockets[index].write('Parrot -> ' +  data + '> ');
                }
            }else{
                telnetSockets[id].write('> ');
            }
        break;
    }
}

function newSocket(socket) {
    socket.setEncoding('utf8');
    telnetSockets[socket.id] = socket;
    console.log('Connection from -> ' + socket.remoteAddress + ':' + socket.remotePort + '\n');
    socket.write('Welcome (' + socket.remoteAddress + ') to the Dyflexis telnet server!\n');
    socket.write('PASV send to port: ' + socket.remotePort + '\n\n> ');
    socket.on('data', function(data) {
        receiveData(data, socket.id);
    })
}

function start(telnetPort) {
    var server = net.createServer(newSocket);
    server.listen(telnetPort);
    console.log('Telnet console is running on ' + telnetPort);
}

function addIoSocket(ioSocket) {
    ioSockets[ioSocket.id] = ioSocket;
}

function removeIoSocket(ioSocket) {
    delete ioSockets[ioSocket.id];
}

function getIoSockets() {
    return ioSockets;
}

module.exports.start = function (telnetPort) {
    return start(telnetPort);
}

module.exports.addIoSocket = function (ioSocket) {
    return addIoSocket(ioSocket);
}

module.exports.removeIoSocket = function (ioSocket) {
    return removeIoSocket(ioSocket);
}