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

    core.debug(`Recreate base folder: ${url.pathname}`)
    if (await client.exists(url.pathname)) {
      await client.delete(url.pathname)
    }
    await client.mkdir(url.pathname)

    await copyFilesRecursively(localPath, url.pathname, client)
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
      core.debug(`Create dir and go into dir: ${curSource}`)
      await client.mkdir(curTarget)
      copyFilesRecursively(curSource, curTarget, client)
    } else {
      try {
        core.debug(`Copy file: ${curSource} -> ${curTarget}`)
        await client.upload(curTarget, createReadStream(curSource))
      } catch (error) {
        core.error(error.message)
      }
    }
  }
}

run()
