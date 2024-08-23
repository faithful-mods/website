import { createServer } from 'node:http';

import next from 'next';
import { Server } from 'socket.io';

import { setServerSocket } from '~/lib/serversocket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = dev ? 3000 : 3264;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
	const httpServer = createServer(handler);
	const io = setServerSocket(new Server(httpServer));

	io.on('connection', (socket) => {
		console.log(` WEBSOCKET ${socket.id} connected`);

		socket.on('disconnect', () => {
			console.log(` WEBSOCKET ${socket.id} disconnected`);
		});
	});

	httpServer
		.once('error', (err) => {
			console.error(err);
			process.exit(1);
		})
		.listen(port, () => {
			console.log(`> Ready on http://${hostname}:${port}`);
		});
});
