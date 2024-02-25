'use client';

import { UserRole } from '@prisma/client';

import { RoleGate } from '@/components/auth/role-gate';

import { UsersPanel } from './users-panel';

const AdminPage = () => {
	return (
		<RoleGate allowedRole={UserRole.ADMIN}>
			<div className="flex flex-row flex-wrap gap-2 justify-center">
				<UsersPanel />
				{/* <ModpacksPanel /> */}
				{/* <ModsPanel /> */}
			</div>
		</RoleGate>
	);
};

export default AdminPage;
