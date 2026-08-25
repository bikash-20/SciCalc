/* Headless diagnostic: capture console errors + failed requests from a URL */
import puppeteer from 'puppeteer-core'

const url = process.argv[2] || 'https://sci-calc-eta.vercel.app/'

const browser = await puppeteer.launch({
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})

const page = await browser.newPage()
const problems = []

page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    problems.push(`[console.${msg.type()}] ${msg.text()}`)
  }
})
page.on('pageerror', (err) => {
  problems.push(`[pageerror] ${err.message}\n${(err.stack || '').split('\n').slice(0, 4).join('\n')}`)
})
page.on('requestfailed', (req) => {
  problems.push(`[requestfailed] ${req.url()} → ${req.failure()?.errorText}`)
})
page.on('response', (res) => {
  if (res.status() >= 400) problems.push(`[http ${res.status()}] ${res.url()}`)
})

await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise((r) => setTimeout(r, 3500)) // let banner timers fire

const rootChildren = await page.evaluate(
  () => document.getElementById('root')?.children.length ?? -1,
)
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
const title = await page.evaluate(() => document.title)

console.log(`URL: ${url}`)
console.log(`Title: ${title}`)
console.log(`#root children: ${rootChildren}`)
console.log(`body background: ${bodyBg}`)
console.log(`\n— problems (${problems.length}) —`)
problems.slice(0, 15).forEach((p) => console.log(p))

await page.screenshot({ path: '/tmp/scicalc-diag.png' })
await browser.close()
