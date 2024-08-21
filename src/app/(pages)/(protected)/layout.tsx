import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/base/role-gate';

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
	return (
		<RoleGate allowedRoles={[UserRole.USER]}>
			{children}
		</RoleGate>
	);
};

export default ProtectedLayout;
