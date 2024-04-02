'use client';

import { Stack, Title, Text } from '@mantine/core';
import { UserRole } from '@prisma/client';

import { useCurrentRole } from '~/hooks/use-current-role';
import { notify } from '~/lib/utils';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
};

export const RoleGate = ({
	children,
	allowedRole,
}: RoleGateProps) => {
	const role = useCurrentRole();

	if (role !== allowedRole && role !== UserRole.ADMIN) {
		return (
			<Stack 
				align="center" 
				justify="center" 
				gap="md"
				style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
			>
				<Title>{allowedRole === UserRole.USER && role !== UserRole.BANNED ? '401' : '403'}</Title>
				<Text size="lg">
					{allowedRole === UserRole.USER && role !== UserRole.BANNED 
						? 'Unauthorized, please log in'
						: 'Forbidden, you are not allowed to access this page'
					}
				</Text>
			</Stack>
		)
	}

	return children;
};
