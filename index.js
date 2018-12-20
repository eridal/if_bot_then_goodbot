let config = require('./config')
let goodbot = require('./goodbot')

let delay = config.maxDelayInSeconds

const next = (delta) => {

  let elaps = Math.min(
    config.maxDelayInSeconds,
    delta || Infinity
  )

  delay = Math.max(
    config.minDelayInSeconds,
    Math.floor((delay + elaps) / 2)
  )

  console.log('delta', delta)
  console.log('elaps', elaps)
  console.log('delay', delay)

  setTimeout(execute, 1000 * delay)
}

const execute = () => {
  console.log('.')
  goodbot()
    .then(next)
    .catch(err => {
      console.error(err)
      next()
    })
}

console.log(config)
execute()
