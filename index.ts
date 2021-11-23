import * as github from '@actions/github'
import { IssueCommentEvent } from '@octokit/webhooks-definitions/schema'
import { info, getInput, setOutput } from '@actions/core'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { exit } from 'process'

const ctx = github.context.payload as IssueCommentEvent
const body = ctx.comment.body.trim()
if (!body.toLowerCase().startsWith('# weight')) {
  info('No `# Weight` title found, ignoring…')
  exit(0)
}
const match = body.match(/(\d+(\.\d+)?) lbs/)
const weight = parseFloat((match ?? [])[1])
if (!weight || Number.isNaN(weight)) throw new Error("Couldn’t extract weight data point")
const height = (() => {
  const value = getInput('height')
  const match = value.match(/(\d+)'(\d+)"/)
  if (match) {
    const cm = (parseInt(match[1]) * 12 + parseInt(match[2])) * 2.54
    return cm
  }
})()
const kg = weight * 0.453592

const bmi = (() => {
  if (!height || Number.isNaN(height)) return
  const bmi = kg / Math.pow(height / 100, 2)
  return bmi
})()

setOutput('bmi', bmi)

interface Datum {
  weight: { lb: number, kg: number }
  date: string
}

const data = (() => {
  try {
    const data = fs.readFileSync('./weight.json', 'utf-8')
    const json = JSON.parse(data)
    return json as Datum[]
  } catch {
    return []
  }
})()

data.push({
  weight: {
    lb: weight, kg
  },
  date: new Date().toISOString().substring(0,10)
})

const sum = (a: number, b: Datum) => b.weight.lb + a
const mean = data.reduce(sum, 0) / data.length
const mean7 = data.slice(-7).reduce(sum, 0) / data.length

fs.writeFileSync('./weight.json', JSON.stringify(data, null, 2))

execSync('git add weight.json')
execSync("git commit -m 'Add Weight'")
execSync("git push origin HEAD")

const slug = process.env.GITHUB_REPOSITORY!
const [owner, repo] = slug.split('/')
const token = getInput('token')!
const octokit = github.getOctokit(token)

await octokit.rest.reactions.createForIssueComment({
  repo, owner, comment_id: ctx.comment.id, content: "+1"
})

const bmiRender = bmi ? bmi.toFixed(1) : '-'

await octokit.rest.issues.updateComment({
  repo, owner, comment_id: ctx.comment.id, body: `
# Weight

| Key    | Value                     |
| :---   |                      ---: |
| Weight | *${weight.toFixed(1)}* lb |
| Weight | ${kg.toFixed(1)} kg       |
| BMI    | ${bmiRender}              |
| Mean   | ${mean.toFixed(1)} lbs    |
| Mean7  | ${mean7.toFixed(1)} lbs   |
`
})