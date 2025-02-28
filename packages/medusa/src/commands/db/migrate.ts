import { MEDUSA_CLI_PATH, MedusaAppLoader } from "@medusajs/framework"
import { LinkLoader } from "@medusajs/framework/links"
import { logger } from "@medusajs/framework/logger"
import {
  ContainerRegistrationKeys,
  mergePluginModules,
} from "@medusajs/framework/utils"
import { join } from "path"

import { fork } from "child_process"
import path from "path"
import { initializeContainer } from "../../loaders"
import { getResolvedPlugins } from "../../loaders/helpers/resolve-plugins"
import { ensureDbExists } from "../utils"
import { syncLinks } from "./sync-links"
const TERMINAL_SIZE = process.stdout.columns

const cliPath = path.resolve(MEDUSA_CLI_PATH, "..", "..", "cli.js")

/**
 * A low-level utility to migrate the database. This util should
 * never exit the process implicitly.
 */
export async function migrate({
  directory,
  skipLinks,
  skipScripts,
  executeAllLinks,
  executeSafeLinks,
}: {
  directory: string
  skipLinks: boolean
  skipScripts: boolean
  executeAllLinks: boolean
  executeSafeLinks: boolean
}): Promise<boolean> {
  /**
   * Setup
   */
  const container = await initializeContainer(directory)
  await ensureDbExists(container)

  const medusaAppLoader = new MedusaAppLoader()
  const configModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  const plugins = await getResolvedPlugins(directory, configModule, true)
  mergePluginModules(configModule, plugins)

  const linksSourcePaths = plugins.map((plugin) =>
    join(plugin.resolve, "links")
  )
  await new LinkLoader(linksSourcePaths).load()

  /**
   * Run migrations
   */
  logger.info("Running migrations...")
  await medusaAppLoader.runModulesMigrations({
    action: "run",
  })
  console.log(new Array(TERMINAL_SIZE).join("-"))
  logger.info("Migrations completed")

  /**
   * Sync links
   */
  if (!skipLinks) {
    console.log(new Array(TERMINAL_SIZE).join("-"))
    await syncLinks(medusaAppLoader, {
      executeAll: executeAllLinks,
      executeSafe: executeSafeLinks,
    })
  }

  if (!skipScripts) {
    /**
     * Run migration scripts
     */
    console.log(new Array(TERMINAL_SIZE).join("-"))
    const childProcess = fork(cliPath, ["db:migrate:scripts"], {
      cwd: directory,
      env: process.env,
    })

    await new Promise<void>((resolve, reject) => {
      childProcess.on("error", (error) => {
        reject(error)
      })
      childProcess.on("close", () => {
        resolve()
      })
    })
  }

  return true
}

const main = async function ({
  directory,
  skipLinks,
  skipScripts,
  executeAllLinks,
  executeSafeLinks,
}) {
  try {
    const migrated = await migrate({
      directory,
      skipLinks,
      skipScripts,
      executeAllLinks,
      executeSafeLinks,
    })
    process.exit(migrated ? 0 : 1)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

export default main
