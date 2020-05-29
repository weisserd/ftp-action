import * as core from '@actions/core'
import {Client} from 'qusly-core'

async function run(): Promise<void> {
  try {
    const host: string = core.getInput('host')
    const user: string = core.getInput('user')
    const password: string = core.getInput('password')
    // const protocol: string = core.getInput('protocol')
    core.info(new Date().toTimeString())
    const client = new Client()

    await client.connect({
      host,
      user,
      password,
      protocol: 'sftp'
    })

    const files = await client.readDir('/www')
    core.info(new Date().toTimeString())
    core.info(`${files.length} Files`)
    for (const file of files) {
      core.info(`Name: ${file.name}`)
    }
    core.info(new Date().toTimeString())
    await client.disconnect()
  } catch (error) {
    core.setFailed(error.message)
  }
}

// import {wait} from './wait'

// async function run(): Promise<void> {
//   try {
//     const ms: string = core.getInput('milliseconds')
//     core.debug(`Waiting ${ms} milliseconds ...`)

//     core.debug(new Date().toTimeString())
//     await wait(parseInt(ms, 10))
//     core.debug(new Date().toTimeString())

//     core.setOutput('time', new Date().toTimeString())
//   } catch (error) {
//     core.setFailed(error.message)
//   }
// }

run()
