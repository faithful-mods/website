import { Modal as MantineModal, Title } from '@mantine/core';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

interface ModalProps {
	opened: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	popup?: boolean;
	forceFullScreen?: boolean;

	children?: React.ReactNode;
}

export function Modal({ opened, onClose, title, children, popup, forceFullScreen }: ModalProps) {
	const [windowWidth] = useDeviceSize();

	return (
		<MantineModal
			opened={opened}
			onClose={onClose}
			title={<Title order={4} component="span">{title}</Title>}
			size={popup ? 'auto': '100%'}
			centered
			trapFocus
			closeOnClickOutside={false}
			closeOnEscape={false}
			fullScreen={!popup && windowWidth <= BREAKPOINT_MOBILE_LARGE || forceFullScreen}
		>
			{children}
		</MantineModal>
	);
}
