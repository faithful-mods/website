'use client';

import { Avatar, Tooltip } from '@mantine/core';

import { logout } from '@/src/server/actions/logout';
import { useCurrentUser } from '@/src/hooks/use-current-user';

export const LoggedUser = () => {
	const user = useCurrentUser();

	return (
		<Tooltip 
			label={<span className="text-red-500">Click to logout</span>}
			position="left"
			className="border"
		>
			<Avatar 
				className="cursor-pointer navbar-icon-fix"
				variant="outline"
				src={user?.image}
				onClick={() => logout()}
			>
				{ (user?.name ?? '?')[0] }
			</Avatar>
		</Tooltip>
	);
};
