'use client';

import { UserRole } from '@prisma/client';

import { useCurrentRole } from '@/hooks/use-current-role';
import { notify } from '@/lib/utils';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
};

export const RoleGate = ({
	children,
	allowedRole,
}: RoleGateProps) => {
	const role = useCurrentRole();

	if (role !== allowedRole) {
		notify('Unauthorized', 'You are not authorized to view this page', 'red');
		return <></>
	}

	return (
		<>
			{children}
		</>
	);
};