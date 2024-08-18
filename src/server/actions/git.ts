'use server';
import 'server-only';

import { Octokit } from '@octokit/rest';
import { Resolution, UserRole } from '@prisma/client';

import { auth } from '~/auth';
import { canAccess } from '~/lib/auth';
import { gitRawUrl, GITHUB_DEFAULT_REPO_NAME, GITHUB_ORG_NAME } from '~/lib/constants';
import { db } from '~/lib/db';

import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { RawUrl } from '~/lib/constants';
import type { base64 } from '~/types';

// Singleton instance of octokit

declare global {
  var octokit: Octokit | undefined;
}

let octokit = globalThis.octokit || undefined;
if (process.env.NODE_ENV !== 'production') globalThis.octokit = octokit;

async function getOctokit() {
	if (octokit) return octokit;

	const session = await auth();
	const user = session?.user!; // We know the user is logged in because of the canAccess check

	// Authenticate with GitHub API using current logged user's access token
	const userToken = await db.account.findFirstOrThrow({ where: { userId: user.id }, select: { access_token: true } });
	octokit = new Octokit({
		auth: userToken.access_token,
	});

	return octokit;
}

// --- End singletons ---

/**
 * Check if the user has a fork of the default repository
 */
export async function getFork() {
	const octokit = await getOctokit();
	const username = await getUserGitHubUsername();

	let fork: RestEndpointMethodTypes['repos']['get']['response'];
	try {
		fork = await octokit.repos.get({
			owner: username,
			repo: GITHUB_DEFAULT_REPO_NAME,
		});
	} catch {
		return null;
	}

	return fork.data.html_url;
}

/**
 * Delete the forked repository from the logged user's account
 */
export async function deleteFork() {
	const octokit = await getOctokit();
	const username = await getUserGitHubUsername();

	await octokit.repos.delete({
		owner: username,
		repo: GITHUB_DEFAULT_REPO_NAME,
	});
}

/**
 * Fork the default textures repository to the user's account and wait for the fork to be ready
 */
export async function forkRepository() {
	const octokit = await getOctokit();

	// Fork the repository
	await octokit.repos.createFork({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
	});

	let forkReady = false;
	const username = await getUserGitHubUsername();

	// wait for the fork to be ready before doing anything else
	while (!forkReady) {
		const fork = await octokit.repos.get({
			owner: username,
			repo: GITHUB_DEFAULT_REPO_NAME,
		});

		if (fork.status === 200) forkReady = true;

		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	// create empty branches for each resolution
	const resolutions = Object.keys(Resolution) as Resolution[];
	const firstCommitSha = await getFirstCommit(username, GITHUB_DEFAULT_REPO_NAME);

	for (const resolution of resolutions) {
		await createBranchFromCommit(username, GITHUB_DEFAULT_REPO_NAME, resolution, firstCommitSha);
	}

	// rename the dev/main branch to x16 (if prod => main => x16 and DEL dev, if dev => dev => x16 and DEL main)
	if (process.env.NODE_ENV !== 'production') {
		await setDefaultBranch(username, GITHUB_DEFAULT_REPO_NAME, 'dev');
		await deleteBranch(username, GITHUB_DEFAULT_REPO_NAME, 'main');
		await renameBranch(username, GITHUB_DEFAULT_REPO_NAME, 'dev', 'x16');
	}
	else {
		await deleteBranch(username, GITHUB_DEFAULT_REPO_NAME, 'dev');
		await renameBranch(username, GITHUB_DEFAULT_REPO_NAME, 'main', 'x16');
	}
}

/**
 * Upload the given files to the default textures repository
 * @param files the files to upload as base64
 * @param filenames the names of the files (must match the order of the files)
 * @param commitMessage the commit message to use
 */
export async function uploadToRepository(files: base64[], filenames: string[], commitMessage: string): Promise<void> {
	await canAccess(UserRole.COUNCIL);

	const branch = process.env.NODE_ENV === 'production' ? 'main' : 'dev';

	// get latest commit
	const currentCommit = await getCurrentCommit(branch);

	// create blobs for each file
	const blobs = await Promise.all(files.map((file) => createBlobFile(file)));

	// create new tree with the blobs
	const newTree = await createNewTree({ filenames, blobs, parentTreeSha: currentCommit.tree_sha });

	// create a new commit with the new tree
	const newCommit = await createCommit({ message: commitMessage, treeSha: newTree.sha, parentCommitSha: currentCommit.commit_sha });

	// update the branch to point to the new commit
	await setBranchToCommit(newCommit.sha, branch);
}

export interface GitFile {
	url: RawUrl;
	path: string;
	mode: string;
	type: string;
	sha: string;
	size: number;
}

export async function getContributionsOfFork(resolution: Resolution): Promise<GitFile[]> {
	const username = await getUserGitHubUsername();
	const files = await listFilesInBranch(username, GITHUB_DEFAULT_REPO_NAME, resolution);
	console.log(files, resolution);

	return files as GitFile[];
}

async function listFilesInBranch(owner: string, repo: string, branch: string) {
	const octokit = await getOctokit();
	const { data } = await octokit.git.getRef({
		owner,
		repo,
		ref: `heads/${branch}`,
	});

	const commitSha = data.object.sha;

	// Get the tree structure of the commit
	try {
		const treeResponse = await octokit.git.getTree({
			owner,
			repo,
			tree_sha: commitSha,
			recursive: 'true', // Set to "true" to list all files recursively
		});

		return treeResponse.data.tree
			.filter((item) => item.type === 'blob')
			.map((item) => ({
				...item,
				url: gitRawUrl({ orgOrUser: owner, repository: repo, branchOrCommit: commitSha, path: item.path }),
			}));
	}
	catch {
		return [];
	}

}

/**
 * Get the GitHub username of the currently logged user
 */
async function getUserGitHubUsername() {
	const octokit = await getOctokit();
	const { data } = await octokit.users.getAuthenticated();
	return data.login;
}

async function setDefaultBranch(owner: string, repo: string, branch: string) {
	const octokit = await getOctokit();
	await octokit.repos.update({
		owner,
		repo,
		default_branch: branch,
	});
}

async function renameBranch(owner: string, repo: string, oldBranch: string, newBranch: string) {
	const octokit = await getOctokit();
	const { data } = await octokit.git.getRef({
		owner,
		repo,
		ref: `heads/${oldBranch}`,
	});

	await octokit.git.createRef({
		owner,
		repo,
		ref: `refs/heads/${newBranch}`,
		sha: data.object.sha,
	});

	await deleteBranch(owner, repo, oldBranch);
}

async function deleteBranch(owner: string, repo: string, branch: string) {
	const octokit = await getOctokit();
	await octokit.git.deleteRef({
		owner,
		repo,
		ref: `heads/${branch}`,
	});
}

async function createBranchFromCommit(owner: string, repo: string, branch: string, commitSha: string) {
	const octokit = await getOctokit();
	await octokit.git.createRef({
		owner,
		repo,
		ref: `refs/heads/${branch}`,
		sha: commitSha,
	});
}

async function getFirstCommit(owner: string, repo: string) {
	const octokit = await getOctokit();
	const { data } = await octokit.repos.listCommits({
		owner, repo,
		sha: 'main',
		per_page: 1,
		page: 1,
	});

	return data[0]!.sha;
}

async function setBranchToCommit(commitSha: string, branch: string) {
	const octokit = await getOctokit();
	await octokit.git.updateRef({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
		ref: `heads/${branch}`,
		sha: commitSha,
	});
}

interface CreateCommitOptions {
	message: string;
	treeSha: string;
	parentCommitSha?: string;
	owner?: string;
	repo?: string;
}

async function createCommit({ message, treeSha, parentCommitSha, owner, repo }: CreateCommitOptions) {
	const octokit = await getOctokit();
	const { data } = await octokit.git.createCommit({
		owner: owner ?? GITHUB_ORG_NAME,
		repo: repo ?? GITHUB_DEFAULT_REPO_NAME,
		message,
		tree: treeSha,
		parents: parentCommitSha ? [parentCommitSha] : [],
	});

	return data;
}

interface CreateNewTreeOptions {
	filenames: string[],
	blobs: { url: string, sha: string }[],
	parentTreeSha: string
	owner?: string;
	repo?: string;
}

/**
 * Create a new tree with the given blobs
 */
async function createNewTree({ filenames, blobs, parentTreeSha, owner, repo }: CreateNewTreeOptions) {
	const octokit = await getOctokit();
	const tree = blobs.map(({ sha }, index) => {
		return {
			path: filenames[index],
			mode: '100644',
			type: 'blob',
			sha,
		} as const;
	});

	const { data } = await octokit.git.createTree({
		owner: owner ?? GITHUB_ORG_NAME,
		repo: repo ?? GITHUB_DEFAULT_REPO_NAME,
		base_tree: parentTreeSha,
		tree,
	});

	return data;
}

/**
 * Prepare a github blob for a file
 */
async function createBlobFile(file: base64) {
	const octokit = await getOctokit();
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
async function getCurrentCommit(branch: string) {
	const octokit = await getOctokit();
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
