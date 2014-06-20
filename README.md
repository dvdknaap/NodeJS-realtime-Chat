# NodeJS realtime Chat #
* * *

My First NodeJS app an realtime ChatBox, username required to enter

**Requirements:**
  * Express:  `sudo npm install express`
  * Socket.io: `sudo npm install socket.io`

**How to start:**
  * sudo nodejs main.js

**How to start this chat as an service:**

  `sudo forever start -l forever.log -o out.log -e err.log -a main.js`
  
**Problems and fixes:**

1. When you got problems with ubuntu server because it can't find the node command execute the following line:

  `sudo update-alternatives --install /usr/sbin/node node /usr/bin/nodejs 99`


**Demo**
http://dutchprogrammer.nl:9001
