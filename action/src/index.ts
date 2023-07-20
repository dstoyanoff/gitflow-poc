import * as core from "@actions/core";
import { getOperation } from "./utils/inputs";
import { createRelease } from "./create-release";
import { updateRelease } from "./update-release";
import { publishRelease } from "./publish-release";

const run = async () => {
  try {
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
  } catch (error) {
    core.setFailed((error as Error).message);
  }
};

run();