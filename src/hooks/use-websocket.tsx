import { useState } from 'react';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { socket } from '~/lib/websocket';

export function useWebsocket(watchers: [string, (args: any) => void][]) {
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState('N/A');

	useEffectOnce(() => {
		if (socket.connected) onConnect();

		function onConnect() {
			setIsConnected(true);
			setTransport(socket.io.engine.transport.name);

			socket.io.engine.on('upgrade', (transport) => {
				setTransport(transport.name);
			});
		}

		function onDisconnect() {
			setIsConnected(false);
			setTransport('N/A');
		}

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);

		watchers.forEach(([key, callback]) => {
			socket.on(key, callback);
		});

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);

			watchers.forEach(([key, callback]) => {
				socket.off(key, callback);
			});
		};
	});

	return {
		isConnected,
		transport,
	};
}


