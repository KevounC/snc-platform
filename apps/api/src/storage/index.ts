import type { StorageProvider } from "@snc/shared";
import { AppError } from "@snc/shared";
import type { Config } from "../config.js";

import { config } from "../config.js";
import { createLocalStorage } from "./local-storage.js";

// ── Public API ──

export const createStorageProvider = (cfg: Config): StorageProvider => {
  switch (cfg.STORAGE_TYPE) {
    case "local":
      return createLocalStorage({ baseDir: cfg.STORAGE_LOCAL_DIR });
    default: {
      const exhaustive: never = cfg.STORAGE_TYPE;
      throw new AppError("STORAGE_CONFIG_ERROR", `Unknown storage type: ${exhaustive}`, 500);
    }
  }
};

export const storage: StorageProvider = createStorageProvider(config);
