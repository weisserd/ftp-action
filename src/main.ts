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

    const exists = await client.exists(destPath)
    if (exists) {
      await client.delete(destPath)
    }
    await client.mkdir(destPath)

    for (const srcFolder of srcFolders) {
      const newRemoteDir = path.join(destPath, srcFolder)
      core.info(`Create dir: ${newRemoteDir}`)
      await client.mkdir(newRemoteDir)
      // List files
      for (const srcFile of readdirSync(srcFolder).filter(name =>
        statSync(path.join(srcFolder, name)).isFile()
      )) {
        core.info(`${srcFile} source file`)
        //const remotePath = '/documents/new file.txt';

        //const status = await client.upload(remotePath, createReadStream(localPath));
      }
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
