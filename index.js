// Express.js application
import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';

import {
	createMessage,
	getLastTenMessages,
} from './database.js';

// configuration
const cfg = {
	title: 'WebSocket Chat',
	port: process.env.PORT || 3000,
	wsPort: process.env.WSPORT || 3001,
	nameLen: 15,
	msgLen: 200,
};

// --------------------------
// Express server
const app = express();

// EJS templates
app.set('view engine', 'ejs');
app.set('views', 'views');

// CORS header
app.use((req, res, next) => {
	res.append('Access-Control-Allow-Origin', '*');
	next();
});

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// home page
app.get('/', (req, res) => {
	res.render('chat', cfg);
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something went wrong!');
})

// static assets
app.use(express.static('static'));

// start server
app.listen(cfg.port, () => {
	console.log(`Express server at: http://localhost:${cfg.port}`);
	console.log(`Web Socket server: ws://localhost:${cfg.wsPort}`);
});

// --------------------------
// WebSocket server
const ws = new WebSocketServer({ port: cfg.wsPort });

// client connection
ws.on('connection', async (socket, req) => {
	console.log(`connection from ${req.socket.remoteAddress}`);

	// retrieve the last 10 messages from the db
	const recentMessages = await getLastTenMessages();
	socket.send(JSON.stringify(recentMessages));

	// received message
	socket.on('message', async (msg, binary) => {

		// store the message in the db
		const { name, msg: message } = JSON.parse(msg);
		await createMessage(name, message);

		// broadcast to all clients
		ws.clients.forEach((client) => {
			client.readyState === WebSocket.OPEN && client.send(msg, { binary });
		});
	});

	// closed
	socket.on('close', () => {
		console.log(`disconnection from ${req.socket.remoteAddress}`);
	});
});
