import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/auth/role-gate';

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
	return (
		<RoleGate allowedRole={UserRole.USER}>
			{children}
		</RoleGate>
	);
}
 
export default ProtectedLayout;