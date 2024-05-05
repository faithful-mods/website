'use server';
import 'server-only';


import { Status, UserRole } from '@prisma/client';

import { auth } from '~/auth';
import { canAccess } from '~/lib/auth';
import { db } from '~/lib/db';
import type { ReportWithReporter } from '~/types';

// GET

export async function getReportsOfUser(userId: string): Promise<ReportWithReporter[]> {
	await canAccess(UserRole.ADMIN, userId);

	const reports = await db.report.findMany({
		where: { reportedId: userId },
		include: {
			reporter: { select: { id: true, name: true, image: true } },
		},
	});

	const session = await auth();
	// Admin request
	if (session?.user.id !== userId) return reports;

	// User request, only return reports that are not yet resolved
	return reports
		.filter((r) => r.status === 'PENDING')
		.map((r) => ({ ...r, reporterId: 'hidden', context: 'hidden', reporter: { id: 'hidden', name: 'hidden', image: 'hidden' } }));
}

export async function getReportsReasons() {
	return db.reportReason.findMany({ include: { Report: { select: { reason: true  } } } });
}

// POST

export async function reportSomeone({
	reporterId,
	reportedId,
	reasonId,
	additionalInfo,
}: {
	reporterId: string;
	reportedId: string;
	reasonId: string;
	additionalInfo: string;
}) {
	await canAccess(UserRole.ADMIN, reporterId);

	return db.report.create({
		data: {
			reporterId,
			reportedId,
			reportReasonId: reasonId,
			context: additionalInfo,
		},
	});
}

export async function updateReportStatus(reportId: string, status: Status) {
	await canAccess(UserRole.ADMIN);

	return db.report.update({
		where: { id: reportId },
		data: { status },
	});
}
