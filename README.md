Kurento RSTP - WebRTC connector for Node.js

============

Node.js gateway and signalling server which creates a pipeline from
Kurento Media Server 5 to WebRTC client.

Additionally built-in browser client.

Installation instructions
-------------------------

Kurento Media Server Installation for Ubuntu 14.04 LTS:
http://kurento.com/docs/current/installation_guide.html

Be sure to have installed [Node.js] and [Bower] on your system:

```bash
sudo apt-get install nodejs
sudo npm install -g bower
```

Install node modules and bower components

```bash
npm install
cd public
bower install
```

Run the application, pass URLs to Kurento Media Server and RTSP stream as Environmental Params

```bash
KURENTO=192.168.1.74:8888 RTSP=192.168.1.67:8086 node app.js
```

Browse to http://127.0.0.1:8080 click "Viewer" and have fun!
