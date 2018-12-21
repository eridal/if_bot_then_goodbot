const secrets = require('./secrets')

module.exports = {

  redditApi: {
    debug: false,
    warnings: false,
    requestDelay: 25,
  },

  minDelayInSeconds: 10,
  maxDelayInSeconds: 120,
  maxAgeInMinutes: 10,

  blacklist: {
    users: secrets.blacklist.users,
    subs: secrets.blacklist.subs,
  }
}
