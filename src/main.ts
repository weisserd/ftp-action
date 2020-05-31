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

    core.debug(`Delete old folder: ${url.pathname}`)
    const exists = await client.exists(url.pathname)
    if (exists) {
      await client.delete(url.pathname)
    }
    await client.mkdir(url.pathname)
    core.debug(`Base dir created: ${url.pathname}`)

    copyFilesRecursively(localPath, url.pathname, client)

    await client.disconnect()
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function copyFilesRecursively(
  localPath: string,
  targetPath: string,
  client: Client
): Promise<void> {
  for (const srcEntry of readdirSync(localPath)) {
    const curSource = path.join(localPath, srcEntry)
    const curTarget = path.join(targetPath, srcEntry)
    if (statSync(curSource).isDirectory()) {
      core.debug(`Create dir and go into dir: ${curSource}/${curTarget}`)
      await client.mkdir(curTarget)
      copyFilesRecursively(curSource, curTarget, client)
    } else {
      core.debug(`Copy file: ${curSource} -> ${curTarget}`)
      await client.upload(curSource, createReadStream(curTarget))
    }
  }
}

run()
