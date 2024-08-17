'use server';
import 'server-only';

import { Octokit } from '@octokit/rest';
import { UserRole } from '@prisma/client';

import { auth } from '~/auth';
import { canAccess } from '~/lib/auth';
import { GITHUB_DEFAULT_REPO_NAME, GITHUB_ORG_NAME } from '~/lib/constants';
import { db } from '~/lib/db';

import type { base64 } from '~/types';

export async function uploadToRepository(files: base64[], filenames: string[], commitMessage: string): Promise<void> {
	await canAccess(UserRole.COUNCIL);

	const session = await auth();
	const user = session?.user!; // We know the user is logged in because of the canAccess check

	// Authenticate with GitHub API using current logged user's access token
	const userToken = await db.account.findFirstOrThrow({ where: { userId: user.id }, select: { access_token: true } });
	const octokit = new Octokit({
		auth: userToken.access_token,
	});

	const branch = process.env.NODE_ENV === 'production' ? 'main' : 'dev';

	// get latest commit
	const currentCommit = await getCurrentCommit(octokit, branch);

	// create blobs for each file
	const filesBlobs = await Promise.all(files.map((file) => createBlobFile(octokit, file)));

	// create new tree with the blobs
	const newTree = await createNewTree(octokit, filenames, filesBlobs, currentCommit.tree_sha);

	// create a new commit with the new tree
	const newCommit = await createCommit(octokit, commitMessage, newTree.sha, currentCommit.commit_sha);

	// update the branch to point to the new commit
	await setBranchToCommit(octokit, newCommit.sha, branch);
}

async function setBranchToCommit(octokit: Octokit, commitSha: string, branch: string) {
	await octokit.git.updateRef({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		ref: `heads/${branch}`,
		sha: commitSha,
	});
}

async function createCommit(octokit: Octokit, message: string, treeSha: string, parentCommitSha: string) {
	const { data } = await octokit.git.createCommit({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		message,
		tree: treeSha,
		parents: [parentCommitSha],
	});

	return data;
}

/**
 * Create a new tree with the given blobs
 */
async function createNewTree(octokit: Octokit, filenames: string[], blobs: { url: string, sha: string }[], parentTreeSha: string) {
	const tree = blobs.map(({ sha }, index) => {
		return {
			path: filenames[index],
			mode: '100644',
			type: 'blob',
			sha,
		} as const;
	});

	const { data } = await octokit.git.createTree({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		base_tree: parentTreeSha,
		tree,
	});

	return data;
}

/**
 * Prepare a github blob for a file
 */
async function createBlobFile(octokit: Octokit, file: base64) {
	const blobData = await octokit.git.createBlob({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		content: file,
		encoding: 'base64',
	});

	return blobData.data;
}

/**
 * Fetch the current commit of the given repository and branch
 */
async function getCurrentCommit(octokit: Octokit, branch: string) {
	const { data: refData } = await octokit.git.getRef({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		ref: `heads/${branch}`,
	});

	const { data: commitData } = await octokit.git.getCommit({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		commit_sha: refData.object.sha,
	});

	return {
		commit_sha: commitData.sha,
		tree_sha: commitData.tree.sha,
	};
}
