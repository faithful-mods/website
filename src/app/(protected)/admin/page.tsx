'use client';

import { RoleGate } from "@/src/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { UsersPanel } from "./users-panel";

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
