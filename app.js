/**
 * Server startup
 */
var kurento = require('kurento-client');
var express = require('express');
var path = require('path');
var wsm = require('ws');
var app = express();
var activePipeline;

const ws_uri = "ws://"+ (process.env.KURENTO || "127.0.0.1:8888") +"/kurento";
const rtsp_uri = "rtsp://" + (process.env.RTSP || "127.0.0.1:8086");

app.set('port', process.env.PORT || 8080);

var port = app.get('port');
var server = app.listen(port, function() {
	console.log('Express server started');
	console.log('Kurento URL: ' + ws_uri);
	console.log('RTSP URL: ' + rtsp_uri);
	console.log('Connect to http://<host_name>:' + port + '/');
});

var WebSocketServer = wsm.Server, wss = new WebSocketServer({
	server : server,
	path : '/call'
});

function wsError(ws, error) {
	console.error(error);
	ws.send(JSON.stringify({
		id : 'viewerResponse',
		response : 'rejected',
		message : error
	}));
	return false;
}

/*
 * Management of WebSocket messages
 */
wss.on('connection', function(ws) {

	console.log('WS Connection received');

	ws.on('error', function(error) {
		console.log('WS Connection error: ' + error);
	});

	ws.on('close', function() {
		console.log('WS Connection closed');
	});

	ws.on('message', function(_message) {
		var message = JSON.parse(_message);
		console.log('WS Connection received message ', message);

		switch (message.id) {

		case 'viewer':

			console.log('Creating kurentoClient');
			kurento(ws_uri, function(error, kurentoClient) {
				if (error) return wsError(ws, "ERROR 1: Could not find media server at address" + ws_uri + ". Exiting with error " + error);

				// Create pipline
				console.log('Creating MediaPipline');
				kurentoClient.create('MediaPipeline', function(error, pipeline) {
					if (error) return wsError(ws, "ERROR 2: " + error);

					activePipeline = pipeline;

					// Create player
					console.log('Creating PlayerEndpoint');
					pipeline.create('PlayerEndpoint', {uri: rtsp_uri, useEncodedMedia: false}, function(error, playerEndpoint) {
						if (error) return wsError(ws, "ERROR 3: " + error);

						playerEndpoint.on('EndOfStream', function() {
							console.log('END OF STREAM');
							pipeline.release();
						});

						console.log('Now Playing');
						playerEndpoint.play(function(error) {
							if (error) return wsError(ws, "ERROR 4: " + error);

							// Create WebRtc
							console.log('Creating WebRTCEndpoint');
							pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
								if (error) return wsError(ws, "ERROR 5: " + error);

								console.log('Processing SDP offer');
								webRtcEndpoint.processOffer(message.sdpOffer, function(error, sdpAnswer) {
									if (error) return wsError(ws, "ERROR 6: " + error);

									console.log('Connecting to endpoint');
									playerEndpoint.connect(webRtcEndpoint, function(error) {
										if (error) return wsError(ws, "ERROR 7: " + error);

										console.log('Connected!');
										ws.send(JSON.stringify({
											id : 'viewerResponse',
											response : 'accepted',
											sdpAnswer : sdpAnswer
										}));
									});
								});
							});
						});
					});
				});
			});
			break;

		case 'stop':
			if (activePipeline) {
				activePipeline.release();
			}
			break;

		default:
			ws.send(JSON.stringify({
				id : 'error',
				message : 'Invalid message ' + message
			}));
			break;
		}
	});
});

app.use(express.static(path.join(__dirname, 'static')));
