import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOctokit } from "../utils/octokit";

/**
 * Creates a branch with a given name
 * @param branchName name of the branch to create
 * @param sha the sha to create the branch from. @default the current context sha
 */
export const createBranch = async (branchName: string, sha?: string) => {
  const shaFrom = sha ?? github.context.sha;
  core.info(`Creating branch ${branchName} from ${shaFrom}`);

  const { data: result } = await getOctokit().git.createRef({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    ref: `refs/heads/${branchName}`,
    sha: shaFrom,
  });

  return result;
};

/**
 * Updates the branch protection rules to ensure we follow the rules
 * @param branch name of the branch
 * @param options protection options
 */
export const updateBranchProtection = async (
  branch: string,
  options: {
    lockBranch?: boolean;
    requiredApprovals?: number;
    requireCodeOwnerReviews?: boolean;
    linearHistory?: boolean;
  }
) => {
  return getOctokit().repos.updateBranchProtection({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch,
    lock_branch: options.lockBranch,
    required_status_checks: null,
    enforce_admins: null,
    required_pull_request_reviews: {
      required_approving_review_count: options.requiredApprovals,
      require_code_owner_reviews: options.requireCodeOwnerReviews,
      bypass_pull_request_allowances: {
        apps: ["github-actions"],
      },
    },
    required_linear_history: options.linearHistory,
    restrictions: null,
  });
};

export const merge = async (
  branch: string,
  into: string,
  message?: string | null
) => {
  core.info(`Merging ${branch} into ${into}`);

  const { data: result } = await getOctokit().repos.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base: into,
    head: branch,
    ...(message && {
      commit_message: message,
    }),
  });

  return result;
};

export const getBranch = async (name: string) => {
  core.info(`Retrieving branch ${name}`);

  try {
    const { data: result } = await getOctokit().repos.getBranch({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      branch: name,
    });
    return result;
  } catch {
    return null;
  }
};

export const updateBranchSha = (branch: string, sha: string) => {
  return getOctokit().git.updateRef({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    sha,
    force: true,
    ref: `heads/${branch}`,
  });
};
