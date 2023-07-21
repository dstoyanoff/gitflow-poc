import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOperation } from "./utils/inputs";
import { createRelease } from "./create-release";
import { updateRelease } from "./update-release";
import { publishRelease } from "./publish-release";
import { createHotfixRelease } from "./hotfix-release";

const run = async () => {
  try {
    console.dir(github.context, { depth: null });

    const operation = getOperation();

    if (operation === "create_release") {
      return createRelease();
    }

    if (operation === "update_release") {
      return updateRelease();
    }

    if (operation === "publish_release") {
      return publishRelease();
    }

    if (operation === "hotfix_release") {
      return createHotfixRelease();
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
};

run();
