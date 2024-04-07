'use client';

import { Stack, Title, Text } from '@mantine/core';
import { UserRole } from '@prisma/client';

import { useCurrentRole } from '~/hooks/use-current-role';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

export const RoleGate = ({
	children,
	allowedRoles,
}: RoleGateProps) => {
	const role = useCurrentRole();

	if (!allowedRoles.length) return children;

	if (allowedRoles.includes(UserRole.USER) && allowedRoles.length === 1) {
		allowedRoles = Object.values(UserRole).filter(role => role !== UserRole.BANNED);
	}

	if (!process.env.PRODUCTION && !allowedRoles.includes(UserRole.ADMIN)) allowedRoles.push(UserRole.ADMIN);

	if ((!role || !allowedRoles.includes(role))) {
		return (
			<Stack 
				align="center" 
				justify="center" 
				gap="md"
				style={{ height: 'calc(81% - (2 * var(--mantine-spacing-sm) - 62px))' }}
			>
				{!role 
					? <Title>401&nbsp;<Text component="span" fw={300} inherit>Unauthorized</Text></Title>
					: <Title>403&nbsp;<Text component="span" fw={300} inherit>Forbidden</Text></Title>
				}
				<Text size="lg">
					{!role
						? 'Please log in to access this page'
						: 'You are not allowed to access this page'
					}
				</Text>
			</Stack>
		)
	}

	return children;
};
