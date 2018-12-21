let snoowrap = require('snoowrap')
let pkg = require('./package.json')
let config = require('./config')
let secrets = require('./secrets')

const reddit = new snoowrap({
  userAgent: `${secrets.username}:${pkg.version} (by /u/${secrets.author})`,
  clientId: secrets.clientId,
  clientSecret: secrets.clientSecret,
  username: secrets.username,
  password: secrets.password,
})

reddit.config(config.redditApi)

const formatDate = (utc) => new Date(utc * 1000).toISOString()

const isAllowedIn = (item, blacklist) => {
  return blacklist.indexOf(item) === -1
}

const tempBlackList = []

const reduceNoise = (user) => {

  tempBlackList.push(user)

  if (tempBlackList.length > 100) {
    tempBlackList.shift()
  }
}

const isUserCool = (user) => {
  return user !== secrets.username
      && isAllowedIn(user, config.blacklist.users)
      && isAllowedIn(user, tempBlackList)
}

const isSubCool = (subreddit) => {
  return isAllowedIn(subreddit, config.blacklist.subs)
}

const isBot = (user) => {
  return /bot\b/i.test(user)
}

const replyTo = (comment) => {
  return comment
    .reply('Good Bot')
    .then(replied => {
      reduceNoise(comment.author.name)
      console.log('Good Bot: ', replied.permalink)
    })
    .catch(err => {
      console.error('Bad Bot: ', err)
    })
}

let last

module.exports = () => {

  let size = 0
  let min = +Infinity
  let max = -Infinity

  return reddit
    .getNewComments({ before: last, sort: 'new', limit: 100 })
    .then(comments => {
      size = comments.length
      console.log('comments', size)
      return comments.reverse()
    })
    .map(comment => {

      let hash = last = comment.name
      let link = comment.link_id
      let date = formatDate(comment.created_utc)
      let user = comment.author.name
      let subr = comment.subreddit.display_name

      min = Math.min(min, comment.created_utc)
      max = Math.max(min, comment.created_utc)

      if (isBot(user) && isSubCool(subr) && isUserCool(user)) {
        console.log(date, hash, link, user)
        return replyTo(comment)
      }

    })
    .then(replies => Promise.all(
      replies.filter(Boolean)
    ))
    .then(() => {

      // are we processing too old comments?
      let age = Date.now() - max * 1000
      if (age > 1000 * 60 * config.maxAgeInMinutes) {
        console.log('catch up!')
        last = null;
      }

      // delta between first and last comment
      return size > 1
         ? max - min
         : Infinity
    })
}
