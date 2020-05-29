import * as core from '@actions/core'
import {Client} from 'qusly-core'
import {URL} from 'url'

async function run(): Promise<void> {
  try {
    const url: URL = new URL(core.getInput('host'))
    const user: string = core.getInput('user')
    const password: string = core.getInput('password')
    const localPath: string = core.getInput('local_path')

    core.debug(`Protocol: ${url.protocol}`)
    core.debug(`Target Path: ${url.pathname}`)
    core.debug(`Local Path: ${localPath}`)

    const client = new Client()
    await client.connect({
      host: url.hostname,
      user,
      password,
      protocol: 'sftp'
    })

    const path = url.pathname

    const files = await client.readDir(path)
    core.info(new Date().toTimeString())
    core.info(`${files.length} Files`)
    for (const file of files) {
      core.info(`Name: ${file.name}`)
    }
    await client.disconnect()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
