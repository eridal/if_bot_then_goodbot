let config = require('./config')
let goodbot = require('./goodbot')


const avg = (a, b) => Math.floor((a + b) / 2)

let delay = avg(
  config.maxDelayInSeconds,
  config.minDelayInSeconds
)

const next = (delta) => {

  let elaps = Math.min(
    config.maxDelayInSeconds,
    delta || Infinity
  )

  delay = Math.max(
    config.minDelayInSeconds,
    avg(delay, elaps)
  )

  console.log(`delta:${delta} elaps:${elaps} delay:${delay}`)
  setTimeout(execute, 1000 * delay)
}

const execute = () => {
  goodbot()
    .then(next)
    .catch(err => {
      console.error(err)
      next()
    })
}

console.log(config)
execute()
