'use strict';

const net = require('net');
const EE = require('events');
const Client = require('./lib/client.js');
const PORT = process.env.PORT || 3000;
const server = net.createServer();
const ee = new EE();

const pool = [];

ee.on('@all', function(client, string) {
  pool.forEach( c => {
    c.socket.write(`${client.nickname}: ${string}`);
  });
});

ee.on('@list', function(client) {
  var conUsers = [];
  pool.forEach( c => {
    console.log(c);
    conUsers.push(c.nickname + '\n' );
  });
  var joinedUsers = conUsers.join(' ');
  client.socket.write(`List of connected users:\n ${joinedUsers}\n`);
});

ee.on('@dm', function(client, string) {
  var nickname = string.split(' ').shift().trim();
  var message = string.split(' ').splice(1).join(' ').trim();
  pool.forEach( c => {
    if(c.nickname === nickname) {
      client.socket.write(`[you] -> [${c.nickname}]: ${message}\n`);
      c.socket.write(`[${client.nickname}] -> [you]: ${message}\n`);
    }
  });
});

ee.on('@nickname', function(client, string) {
  let nickname = string.split(' ').shift().trim();
  client.nickname = nickname;
  client.socket.write(`Your nickname has been changed to ${client.nickname}\n`);
});

ee.on('default', function(client) {
  client.socket.write('not a command - please use an @ symbol\n');
});

ee.on('@help', function(client) {
  client.socket.write('Here is a helpful list of commands:\n @quit to disconnect\n @list to list all connected users\n @nickname <new-name> to change their nickname\n @dm <to-username> <message> to send a message directly to another user by their nickname\n @help shows list of commands\n @all <message> sends message to all connected users\n');
});

ee.on('@quit', function(client) {
  client.socket.end();
});

server.on('connection', function(socket){
  var client = new Client(socket);
  pool.push(client);
  socket.on('data', function(data) {
    const command = data.toString().split(' ').shift().trim();
    if(command.startsWith('@')) {
      ee.emit(command, client, data.toString().split(' ').splice(1).join(' '));
      return;
    }
    ee.emit('default', client, data.toString());
  });
  socket.on('close', function() {
    var index = pool.indexOf(client);
    console.log(index);
    pool.splice(index, 1);
    pool.forEach( c => {
      c.socket.write(`user ${client.nickname} has left the chatroom\n`);
    });
  });
  socket.on('error', function() {
    console.log(err);
  });
});

server.listen(PORT, () => {
  console.log('server up:', PORT);
});
