
import Link from 'next/link';

import { Fragment, startTransition, useEffect, useState } from 'react';

import { FaArrowRight } from 'react-icons/fa';
import { IoCloseOutline, IoCheckmark } from 'react-icons/io5';

import { Avatar, Button, Group, Select, Stack, Table, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { UserRole, Status } from '@prisma/client';

import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradientDanger, gradientWarning, notify } from '~/lib/utils';
import { getReportsReasons, reportSomeone, updateReportStatus } from '~/server/data/reports';
import { getPublicUsers, updateUserRole } from '~/server/data/user';

import type { SelectProps } from '@mantine/core';
import type { ReportReason, Report, User } from '@prisma/client';
import type { PublicUser } from '~/types';

export function UserReportsPanel({ user, self, reports }: { user: User, reports: Report[], self: boolean }) {
	const [users, setUsers] = useState<PublicUser[]>([]);
	const [reasons, setReasons] = useState<ReportReason[]>([]);

	const [localUser, setUser] = useState<User>(user);
	const [localReports, setReports] = useState<Report[]>(reports);

	useEffect(() => {
		setReports(reports);
		setUser(user);
	}, [reports, user]);

	const [windowWidth] = useDeviceSize();

	useEffectOnce(() => {
		getPublicUsers()
			.then((u) => {
				setUsers(u.filter((uu) => uu.id !== localUser.id));
			})
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch users', 'red');
			});

		getReportsReasons()
			.then(setReasons)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch report reasons', 'red');
			});
	});

	const form = useForm<{ reportedId: string, reasonId: string, additionalInfo: string }>({
		initialValues: { reportedId: '', reasonId: '', additionalInfo: '' },
		validate: {
			reportedId: (value) => !value && 'You must select a user to report',
			reasonId: (value) => !value && 'You must select a reason to report',
		},
		onValuesChange: () => {
			form.validate();
		},
	});

	const renderUserSelectOption: SelectProps['renderOption'] = ({ option }) => {
		const user = users.find((u) => u.id === option.value);

		return (
			<Group gap="sm" wrap="nowrap">
				<Avatar src={user?.image} size={30} radius="xl" />
				<div>
					<Text size="sm">{user?.name ?? option.label}</Text>
				</div>
			</Group>
		);
	};

	const renderReasonSelectOption: SelectProps['renderOption'] = ({ option }) => {
		const reason = reasons.find((r) => r.id === option.value)!;

		return (
			<Stack gap={0}>
				<Text size="sm" tt="capitalize">{reason.value}</Text>
				<Text size="xs" c="dimmed">{reason.description}</Text>
			</Stack>
		);
	};

	const report = () => {
		startTransition(() => {
			reportSomeone({
				reporterId: localUser.id,
				reportedId: form.values.reportedId,
				reasonId: form.values.reasonId,
				additionalInfo: form.values.additionalInfo,
			})
				.then(() => {
					form.setValues({ reportedId: '', reasonId: '', additionalInfo: '' });
					notify('Success', 'Report sent successfully', 'green');
				});
		});
	};

	const updateReport = (reportId: string, status: Status) => {
		startTransition(() => {
			updateReportStatus(reportId, status)
				.then(() => {
					notify('Success', 'Report dismissed!', 'green');
					setReports(localReports.map((r) => r.id === reportId ? { ...r, status: status } : r));
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	};

	const ban = () => {
		startTransition(() => {
			updateUserRole(localUser.id, UserRole.BANNED)
				.then(() => {
					notify('Success', 'User banned!', 'green');
					setUser({ ...localUser, role: UserRole.BANNED });
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	};

	const pardon = () => {
		startTransition(() => {
			updateUserRole(localUser.id, UserRole.USER)
				.then(() => {
					notify('Success', 'User pardoned!', 'green');
					setUser({ ...localUser, role: UserRole.USER });
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	};

	return (
		<Stack gap="sm">
			{self && (
				<Tile>
					<Stack gap="md">
						<Stack gap={0}>
							<Text size="md" fw={700}>Reports</Text>
							<Text size="sm">
								Here you can report someone for breaking our <Text component="a" href="/docs/tos" c="blue" target="_blank">ToS</Text>. If you have any issues, please report them here.
							</Text>
						</Stack>
						<Group gap="md">
							<Select
								style={{ width: windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc((100% - var(--mantine-spacing-md)) * .5)' }}
								limit={10}
								label="User to report"
								placeholder="Select or search a user..."
								data={users.map((u) => ({ value: u.id, label: u.name ?? 'Unknown' }))}
								renderOption={renderUserSelectOption}
								defaultValue={''}
								searchable
								clearable
								required
								{...form.getInputProps('reportedId')}
							/>
							<Select
								style={{ width: windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc((100% - var(--mantine-spacing-md)) * .5)' }}
								label="Reason"
								placeholder="Select a reason..."
								data={reasons.map((r) => ({ value: r.id, label: r.value }))}
								renderOption={renderReasonSelectOption}
								defaultValue={''}
								searchable
								clearable
								required
								{...form.getInputProps('reasonId')}
							/>
							<Textarea
								label="Additional information"
								description="Please provide as much information as possible."
								placeholder="Write here any additional information you think is relevant..."
								className="w-full"
								rows={5}
								{...form.getInputProps('additionalInfo')}
							/>
						</Group>
						<Group>
							<Button
								variant="gradient"
								gradient={gradientDanger}
								className={!form.isValid() ? 'button-disabled-with-bg' : ''}
								disabled={!form.isValid()}
								fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
								onClick={report}
							>
								Report
							</Button>
							{form.isValid() && (
								<Text size="sm" ta={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'center' : 'left'}>
									By reporting someone, you agree to our <Text component="a" href="/docs/tos" c="blue" target="_blank">Terms of Service</Text>.
								</Text>
							)}
						</Group>
					</Stack>
				</Tile>
			)}

			<Tile>
				<Stack gap="md">
					<Stack gap={0}>
						<Text size="md" fw={700}>Reports against {self ? 'you' : 'that user'}</Text>
						{localReports.length === 0 && (
							<Text size="sm">
								{self
									? 'You don\'t have any reports against you. Keep it up!'
									: 'This user doesn\'t have any reports against them.'
								}
							</Text>
						)}
						{localReports.length > 0 && (
							<Table striped highlightOnHover withColumnBorders withTableBorder mt="xs">
								<Table.Thead>
									{windowWidth > BREAKPOINT_MOBILE_LARGE && (
										<Table.Tr>
											{!self && <Table.Th>Reporter</Table.Th>}
											<Table.Th>Reason</Table.Th>
											<Table.Th>Reported</Table.Th>
											<Table.Th>Updated</Table.Th>
											<Table.Th>Status</Table.Th>
										</Table.Tr>
									)}
								</Table.Thead>
								<Table.Tbody>
									{localReports.map((report, i) => (
										<Fragment key={report.id}>
											{windowWidth > BREAKPOINT_MOBILE_LARGE && (
												<Table.Tr>
													{!self && (
														<Table.Td className="w-[200px]">
															<Group justify="space-between">
																{renderUserSelectOption({ option: { value: report.reporterId, label: '' } })}
																<Link href={'/user/' + report.reporterId}>
																	<Button
																		variant='transparent'
																		className="navbar-icon-fix"
																	>
																		<FaArrowRight />
																	</Button>
																</Link>
															</Group>
														</Table.Td>
													)}
													<Table.Td className="w-[160px]">{reasons.find((r) => r.id === report.reportReasonId)?.value}</Table.Td>
													<Table.Td align="center" className="w-[160px]">{report.createdAt.toLocaleString()}</Table.Td>
													<Table.Td align="center" className="w-[160px]">{report.updatedAt.toLocaleString()}</Table.Td>
													<Table.Td className="w-[160px]" align="center">
														{!self && report.status === Status.PENDING && (
															<Group gap="xs" justify="center">
																<Button size="xs" className="navbar-icon-fix" onClick={() => updateReport(report.id, Status.REJECTED)}><IoCloseOutline className="w-5 h-5" /></Button>
																<Button size="xs" className="navbar-icon-fix" onClick={() => updateReport(report.id, Status.ACCEPTED)}><IoCheckmark className="w-5 h-5" /></Button>
															</Group>
														)}
														{!self && report.status !== Status.PENDING && <Text c="dimmed">{report.status}</Text>}
														{self && <Text c="dimmed">{report.status}</Text>}
													</Table.Td>
												</Table.Tr>
											)}
											{windowWidth <= BREAKPOINT_MOBILE_LARGE && (
												<>
													<Table.Tr>
														<Table.Td colSpan={2}>
															<Group justify="space-between">
																<Stack gap={0}>
																	<Text c="dimmed" size="sm">Reason: </Text>
																	<Text size="sm">{reasons.find((r) => r.id === report.reportReasonId)?.value}</Text>
																</Stack>
																{!self && report.status === Status.PENDING && (
																	<Group gap="xs" justify="center">
																		<Button size="xs" className="navbar-icon-fix" onClick={() => updateReport(report.id, Status.REJECTED)}><IoCloseOutline className="w-5 h-5" /></Button>
																		<Button size="xs" className="navbar-icon-fix" onClick={() => updateReport(report.id, Status.ACCEPTED)}><IoCheckmark className="w-5 h-5" /></Button>
																	</Group>
																)}
																{!self && report.status !== Status.PENDING && <Text c="dimmed" size="sm">{report.status}</Text>}
																{self && <Text c="dimmed" size="sm">{report.status}</Text>}
															</Group>
														</Table.Td>
													</Table.Tr>
													{!self && (
														<Table.Tr>
															<Table.Td colSpan={2}>
																<Group justify="space-between">
																	{renderUserSelectOption({ option: { value: report.reporterId, label: '' } })}
																	<Link href={'/user/' + report.reporterId}>
																		<Button
																			variant='transparent'
																			className="navbar-icon-fix"
																		>
																			<FaArrowRight />
																		</Button>
																	</Link>
																</Group>
															</Table.Td>
														</Table.Tr>
													)}
													<Table.Tr>
														<Table.Td align="center">
															<Text c="dimmed" size="sm">Reported:</Text>
															<Text size="sm">{report.createdAt.toLocaleString()}</Text>
														</Table.Td>
														<Table.Td align="center">
															<Text c="dimmed" size="sm">Updated:</Text>
															<Text size="sm">{report.updatedAt.toLocaleString()}</Text>
														</Table.Td>
													</Table.Tr>
												</>
											)}
											{!self && (
												<Table.Tr>
													<Table.Td colSpan={5}>
														{report.context.length > 0
															? (
																<>
																	<Text size="sm" c="dimmed">Additional information:</Text>
																	<Text size="sm">{report.context}</Text>
																</>
															)
															: <Text size="sm" ta="center" c="dimmed">No additional information provided.</Text>}
													</Table.Td>
												</Table.Tr>
											)}
										</Fragment>
									))}
								</Table.Tbody>
							</Table>
						)}

						{!self && (
							<Group justify="end">
								{localUser.role !== UserRole.BANNED && (
									<Button
										mt="sm"
										variant="gradient"
										gradient={gradientDanger}
										disabled={localReports.length === 0}
										className={localReports.length === 0 ? 'button-disabled-with-bg' : ''}
										onClick={ban}
										w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'auto'}
									>
										Ban
									</Button>
								)}
								{localUser.role === UserRole.BANNED && (
									<Button
										mt="sm"
										variant="gradient"
										gradient={gradientWarning}
										disabled={localUser.role !== UserRole.BANNED}
										className={localUser.role !== UserRole.BANNED ? 'button-disabled-with-bg' : ''}
										onClick={pardon}
										w={windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'auto'}
									>
										Pardon
									</Button>
								)}
							</Group>
						)}
					</Stack>
				</Stack>
			</Tile>
		</Stack>
	);
}
