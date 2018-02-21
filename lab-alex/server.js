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

ee.on('@dm', function(cleint, string) {
  var nickname = string.split(' ').shift().trim();
  var message = string.split(' ').splice(1).join(' ').trim();

  pool.forEach( c => {
    if(c.nickname === nickname) {
      c.socket.write(`@{client.nickname}: ${message}`);
    }
  });
});

ee.on('@nickname', function(client, string) {
  let nickname = string.split(' ').shift().trim();
  client.nickname = nickname;
  client.socket.write(`user nickname has been changed to ${client.nickname}\n`);
});

ee.on('default', function(client) {
  client.socket.write('not a command - please use an @ symbol\n');
});

ee.on('@help', function(client) {
  client.socket.write('Here is a helpful list of commands:\n @quit to disconnect\n @list to list all connected users\n @nickname <new-name> to change their nickname\n @dm <to-username> <message> to send a message directly to another user by their nickname\n @help shows list of commands\n @all <message> sends message to all connected users\n');
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
});

server.listen(PORT, () => {
  console.log('server up:', PORT);
});
