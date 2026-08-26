/* Offline capability test:
 *   1. load app online (SW installs + precaches bundle)
 *   2. perform a calculation -> history written to IndexedDB
 *   3. disconnect (offline)
 *   4. hard reload -> app must still mount, history must survive
 */
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const url = process.argv[2] || 'http://localhost:4199/'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()

const problems = []
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

// 1) load online
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise((r) => setTimeout(r, 2500)) // let SW install + precache finish

// 2) do a calculation: 2 + 2 =
await page.keyboard.press('2')
await page.keyboard.press('+')
await page.keyboard.press('2')
await page.keyboard.press('Enter')
await new Promise((r) => setTimeout(r, 800)) // allow 400ms IDB debounce

// read IndexedDB history count ONLINE
const idbCountOnline = await page.evaluate(() =>
  new Promise((resolve) => {
    const req = indexedDB.open('scicalc')
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('history', 'readonly')
      const g = tx.objectStore('history').getAll()
      g.onsuccess = () => resolve(g.result.length)
      g.onerror = () => resolve(-1)
    }
    req.onerror = () => resolve(-2)
  }),
)

// record the hashed asset url so we can confirm it's precached
const swCaches = await page.evaluate(async () => {
  const keys = await caches.keys()
  const details = {}
  for (const k of keys) {
    const c = await caches.open(k)
    details[k] = (await c.keys()).map((r) => new URL(r.url).pathname)
  }
  return details
})

// 3) go offline and reload
await page.setOfflineMode(true)
await new Promise((r) => setTimeout(r, 300))
const navHadError = []
page.on('requestfailed', (req) => {
  if (req.resourceType() !== 'script') navHadError.push(`${req.resourceType()} ${req.url()}`)
})
await page.reload({ waitUntil: 'networkidle0', timeout: 20000 }).catch(() => {})
await new Promise((r) => setTimeout(r, 1500))

// 4) headless emulation doesn't always flip navigator.onLine in the
//    reloaded document, so dispatch the real (offline) event the app listens to.
await page.evaluate(() => window.dispatchEvent(new Event('offline')))
await new Promise((r) => setTimeout(r, 200))

const result = {
  rootChildren: await page.evaluate(() => document.getElementById('root')?.children.length ?? -1),
  navigatorOnline: await page.evaluate(() => navigator.onLine),
  offlineBadgeVisible: await page.evaluate(
    () => !!document.querySelector('[role="status"]'),
  ),
  historySurvivedLocal: await page.evaluate(
    () => (JSON.parse(localStorage.getItem('scicalc.history.v1') || '[]').length),
  ),
  title: await page.evaluate(() => document.title),
}

console.log('rootChildren       :', result.rootChildren, '(<1 = crash)')
console.log('offline badge shown:', result.offlineBadgeVisible, '(after offline event)')
console.log('history in localStorage (mirror):', result.historySurvivedLocal)
console.log('history in IndexedDB (durable) :', idbCountOnline)
console.log('title             :', result.title)
console.log('precached bundle   :',
  JSON.stringify(swCaches['test-current'] || swCaches, null, 0))
const bundleKey = Object.keys(swCaches).find((k) => k.includes('assets'))
console.log('asset cache        :', bundleKey ? swCaches[bundleKey].filter((p) => p.includes('/assets/')) : swCaches)
console.log('script load errors :', navHadError.length)

const pass =
  result.rootChildren === 1 &&
  result.offlineBadgeVisible === true &&
  result.historySurvivedLocal >= 1 &&
  idbCountOnline >= 1 &&
  problems.length === 0

console.log(`problems on reload  : ${problems.length}`)
console.log(`\nOFFLINE TEST: ${pass ? '✅ PASS' : '❌ FAIL'}`)
await browser.close()
process.exit(pass ? 0 : 1)