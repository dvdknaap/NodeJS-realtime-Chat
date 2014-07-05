NodeJS realtime Chat
=========

My First NodeJS app an realtime ChatBox

- Chatbox is realtime with socket.io
- Username to enter
- Flood protection
- Command line usage: /help
- RequireJS module
- Chat can customised by an settings array
- Private messaging
- On unreaded privated message(s), the sender in userlist blinks with the amount of unreaded messages
- On unreaded privated message(s) the document title change to total unreaded message (animated)
- Super user mode with telnet
- Send an messag through telnet to an specific chat member
- Kick an specific chat user through telnet

Requirements
----
  - async
  - bootstrap
  - express
  - jquery
  - requirejs
  - socket.io
  

Install requirements
----

 ```sh
 sudo npm install
 ```

How to start
----
  
 ```sh
 sudo node main.js
 ```

How to start this chat as an service:
----

  
 ```sh
 sudo forever start -l forever.log -o out.log -e err.log -a main.js
  ```
  
Problems and fixes
----

1. When you got problems with ubuntu server because it can't find the node command execute the following line:

  
 ```sh
 sudo update-alternatives --install /usr/sbin/node node /usr/bin/nodejs 99
  ```


Demo
----
[Realtime Chatbox demo](http://dutchprogrammer.nl:9001)

Telnet
----
 ```sh
telnet dutchprogrammer.nl 9102
  ```
