import * as core from '@actions/core'
import {Client, IProtocol} from 'qusly-core'
import {URL} from 'url'
import {readdirSync, statSync} from 'fs'
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

    core.debug(`Protocol: ${url.protocol.slice(0, -1)}`)
    core.debug(`Target Path: ${url.pathname}`)
    core.debug(`Local Path: ${localPath}`)

    const client = new Client()
    await client.connect({
      host: url.hostname,
      user,
      password,
      protocol
    })

    const destPath = url.pathname
    const srcFolders: string[] = []
    getAllSubFolders(localPath, srcFolders)

    // const files = await client.readDir(destPath)
    core.info(`${srcFolders.length} Files`)
    for (const file of srcFolders) {
      core.info(`Name: ${file}`)
      await client.mkdir(path.join(destPath, file))
    }
    await client.disconnect()
  } catch (error) {
    core.setFailed(error.message)
  }
}

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
