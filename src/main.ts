import * as core from '@actions/core'
import {Client, IProtocol} from 'qusly-core'
import {URL} from 'url'
import {readdirSync, statSync, createReadStream} from 'fs'
import * as path from 'path'

async function run(): Promise<void> {
  try {
    const url: URL = new URL(core.getInput('host'))
    const user: string = core.getInput('user')
    const password: string = core.getInput('password')
    const localPath: string = core.getInput('local_path')
    let protocol: IProtocol = `sftp`
    switch (url.protocol.slice(0, -1)) {
      case 'sftp':
        protocol = `sftp`
        break
      case 'ftp':
        protocol = `ftp`
        break
    }

    const client = new Client()
    await client.connect({
      host: url.hostname,
      user,
      password,
      protocol
    })

    const srcFolders: string[] = []
    getAllSubFolders(localPath, srcFolders)

    core.debug(`Delete old folder: ${url.pathname}`)
    const exists = await client.exists(url.pathname)
    if (exists) {
      await client.delete(url.pathname)
    }
    await client.mkdir(url.pathname)
    core.debug(`Base dir created: ${url.pathname}`)

    for (const srcFolder of srcFolders) {
      core.debug(`localPath: ${localPath}`)
      core.debug(`srcFolder: ${srcFolder}`)
      core.debug(`url.pathname: ${url.pathname}`)
      core.debug(
        `path.relative(localPath, srcFolder): ${path.relative(
          localPath,
          srcFolder
        )}`
      )

      const newRemoteDir = path.join(
        url.pathname,
        path.relative(localPath, srcFolder)
      )
      core.debug(`Create new folder: ${newRemoteDir}`)
      await client.mkdir(newRemoteDir)

      // Copy files
      for (const srcFile of readdirSync(srcFolder).filter(name =>
        statSync(path.join(srcFolder, name)).isFile()
      )) {
        core.debug(`Copy file: ${srcFile}`)
        await client.upload(
          path.join(newRemoteDir, srcFile),
          createReadStream(path.join(srcFolder, srcFile))
        )
      }
    }
    await client.disconnect()
  } catch (error) {
    core.setFailed(error.message)
  }
}

// TODO Don't take baseFolder into account
function getAllSubFolders(baseFolder: string, folderList: string[]): void {
  const folders: string[] = readdirSync(baseFolder).filter(file =>
    statSync(path.join(baseFolder, file)).isDirectory()
  )
  for (const folder of folders) {
    folderList.push(path.join(baseFolder, folder))
    getAllSubFolders(path.join(baseFolder, folder), folderList)
  }
}

run()
