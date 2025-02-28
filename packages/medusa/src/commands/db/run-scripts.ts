import { MedusaAppLoader } from "@medusajs/framework"
import { LinkLoader } from "@medusajs/framework/links"
import { logger } from "@medusajs/framework/logger"
import { MigrationScriptsMigrator } from "@medusajs/framework/migrations"
import {
  ContainerRegistrationKeys,
  mergePluginModules,
} from "@medusajs/framework/utils"
import { dirname, join } from "path"

import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { MedusaContainer, PluginDetails } from "@medusajs/types"
import { initializeContainer } from "../../loaders"
import { getResolvedPlugins } from "../../loaders/helpers/resolve-plugins"
import { ensureDbExists } from "../utils"

const TERMINAL_SIZE = process.stdout.columns

/**
 * A low-level utility to migrate the migration scripts. This util should
 * never exit the process implicitly.
 */
export async function runMigrationScripts({
  directory,
}: {
  directory: string
}): Promise<boolean> {
  let onApplicationPrepareShutdown: () => Promise<void> = async () =>
    Promise.resolve()
  let onApplicationShutdown: () => Promise<void> = async () => Promise.resolve()
  let container_: MedusaContainer
  let plugins: PluginDetails[]

  try {
    container_ = await initializeContainer(directory)
    await ensureDbExists(container_)

    const configModule = container_.resolve(
      ContainerRegistrationKeys.CONFIG_MODULE
    )

    plugins = await getResolvedPlugins(directory, configModule, true)

    mergePluginModules(configModule, plugins)

    const resources = await loadResources(plugins)
    onApplicationPrepareShutdown = resources.onApplicationPrepareShutdown
    onApplicationShutdown = resources.onApplicationShutdown

    const scriptsSourcePaths = [
      join(dirname(require.resolve("@medusajs/medusa")), "migration-scripts"),
      ...plugins.map((plugin) => join(plugin.resolve, "migration-scripts")),
    ]

    const migrator = new MigrationScriptsMigrator({ container: container_ })
    await migrator.ensureMigrationsTable()
    const pendingScripts = await migrator.getPendingMigrations(
      scriptsSourcePaths
    )

    if (!pendingScripts?.length) {
      logger.info("No pending migration scripts to execute")
      return true
    }

    console.log(new Array(TERMINAL_SIZE).join("-"))
    logger.info("Pending migration scripts to execute")
    logger.info(`${pendingScripts.join("\n")}`)

    console.log(new Array(TERMINAL_SIZE).join("-"))
    logger.info("Running migration scripts...")
    await migrator.run(scriptsSourcePaths)

    console.log(new Array(TERMINAL_SIZE).join("-"))
    logger.info("Migration scripts completed")

    return true
  } finally {
    await onApplicationPrepareShutdown()
    await onApplicationShutdown()
  }
}

async function loadResources(plugins: any): Promise<{
  onApplicationPrepareShutdown: () => Promise<void>
  onApplicationShutdown: () => Promise<void>
}> {
  /**
   * Clear all module instances to prevent cache from kicking in
   */
  MedusaModule.clearInstances()

  /**
   * Setup
   */

  const linksSourcePaths = plugins.map((plugin) =>
    join(plugin.resolve, "links")
  )
  await new LinkLoader(linksSourcePaths).load()

  const medusaAppResources = await new MedusaAppLoader().load()
  const onApplicationPrepareShutdown =
    medusaAppResources.onApplicationPrepareShutdown
  const onApplicationShutdown = medusaAppResources.onApplicationShutdown
  await medusaAppResources.onApplicationStart()

  return {
    onApplicationPrepareShutdown,
    onApplicationShutdown,
  }
}

const main = async function ({
  directory,
}: {
  directory: string
  container?: MedusaContainer
}) {
  try {
    const migrated = await runMigrationScripts({
      directory,
    })
    process.exit(migrated ? 0 : 1)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

export default main
