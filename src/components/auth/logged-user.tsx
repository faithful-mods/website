'use client';

import { Avatar, Tooltip } from '@mantine/core';

import { useCurrentUser } from '~/hooks/use-current-user';
import { logout } from '~/server/actions/logout';

export const LoggedUser = () => {
	const user = useCurrentUser();

	return (
		<Tooltip 
			label={<span className="text-white">Logout</span>}
			position="left"
			className="border shadow-md"
			style={{ background: 'linear-gradient(69deg, var(--mantine-color-red-filled) 0%, var(--mantine-color-pink-filled) 100%)' }}
		>
			<Avatar 
				className="cursor-pointer navbar-icon-fix image-background"
				variant="outline"
				radius={4}
				src={user?.image}
				onClick={() => logout()}
			>
				{ (user?.name ?? '?')[0] }
			</Avatar>
		</Tooltip>
	);
};
