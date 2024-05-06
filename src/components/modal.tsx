import { Modal as MantineModal, Title } from '@mantine/core';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

interface ModalProps {
	opened: boolean;
	onClose: () => void;
	title: React.ReactNode;
	popup?: boolean;

	children?: React.ReactNode;
}

export function Modal({ opened, onClose, title, children, popup }: ModalProps) {
	const [windowWidth, _] = useDeviceSize();

	return (
		<MantineModal
			opened={opened}
			onClose={onClose}
			title={<Title order={4} component="span">{title}</Title>}
			size="100%"
			centered
			trapFocus
			closeOnClickOutside={false}
			closeOnEscape={false}
			fullScreen={!popup && windowWidth <= BREAKPOINT_MOBILE_LARGE}
		>
			{children}
		</MantineModal>
	);
}
