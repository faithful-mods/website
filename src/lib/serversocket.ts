import type { Server } from 'socket.io';

declare global {
	var socketIO: Server | undefined;
}

export const socket = globalThis.socketIO;

export const setServerSocket = (server: Server) => {
	globalThis.socketIO = server;
	return globalThis.socketIO;
};

if (process.env.NODE_ENV !== 'production') globalThis.socketIO = socket;
