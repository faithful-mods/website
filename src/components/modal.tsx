import { Modal as MantineModal, Title } from '@mantine/core';

import { useViewportSize } from '@mantine/hooks';
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
	const { width } = useViewportSize();

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
			fullScreen={!popup && width <= BREAKPOINT_MOBILE_LARGE || forceFullScreen}
		>
			{children}
		</MantineModal>
	);
}
