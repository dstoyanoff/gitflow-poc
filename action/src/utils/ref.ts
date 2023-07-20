export const extractBranchFromRef = (ref: string) =>
  ref.split("refs/heads/")[1];

export const extractReleaseVersionFromRef = (ref: string) =>
  ref.split("refs/heads/release/")[1];
