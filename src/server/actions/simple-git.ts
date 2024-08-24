'use server';
import 'server-only';

import { existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import simpleGit from 'simple-git';

import { auth } from '~/auth';
import { GITHUB_DEFAULT_REPO_NAME, GITHUB_ORG_NAME } from '~/lib/constants';
import { db } from '~/lib/db';

import { getOctokit, getUserGitHubUsername } from './octokit';

const REMOTE_REPOSITORY_URL = `https://github.com/${GITHUB_ORG_NAME}/${GITHUB_DEFAULT_REPO_NAME}.git` as const;
const LOCAL_REPOSITORY_PATH = process.env.NODE_ENV === 'production'
	? '/var/www/html/data.faithfulmods.net/textures/'
	: process.env.DEV_LOCAL_REPOSITORY_PATH!;

const git = simpleGit(LOCAL_REPOSITORY_PATH);

/**
 * Get the default-textures(-dev) repository URL with the user's access token
 */
async function remoteUrl() {
	const session = await auth();
	const user = session?.user;
	if (!user) throw new Error('No user logged in');

	// Get user token using current logged user
	const userAccount = await db.account.findFirstOrThrow({ where: { userId: user.id }, select: { access_token: true } });

	const octokit = await getOctokit();
	const username = await getUserGitHubUsername(octokit);

	return `https://${username}:${userAccount.access_token}@github.com/${GITHUB_ORG_NAME}/${GITHUB_DEFAULT_REPO_NAME}.git`;
};

/**
 * Add a file to the local repository
 * @param file the file to add
 * @param filename the name of the file
 */
export async function addFile(file: Buffer, filename: string) {
	if (readdirSync(LOCAL_REPOSITORY_PATH).length === 0) {
		await git.clone(REMOTE_REPOSITORY_URL, LOCAL_REPOSITORY_PATH);
		await git.pull();
	}

	const filepath = join(LOCAL_REPOSITORY_PATH, filename);
	writeFileSync(filepath, file);

	await git.add(filepath);
}

/**
 * Delete a file from the local repository
 * @param filename the name of the file
 */
export async function deleteFile(filename: string) {
	if (readdirSync(LOCAL_REPOSITORY_PATH).length === 0) {
		await git.clone(REMOTE_REPOSITORY_URL, LOCAL_REPOSITORY_PATH);
		await git.pull();
	}

	const filepath = join(LOCAL_REPOSITORY_PATH, filename);
	if (existsSync(filepath)) await git.rm(filepath);
}

/**
 * Commit and push the changes to the remote repository
 * @param message the commit message
 */
export async function commitAndPush(message: string) {
	const remote = await remoteUrl();

	await git.commit(message);
	await git.push(remote, 'main');
}
