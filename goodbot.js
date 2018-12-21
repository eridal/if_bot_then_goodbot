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

const shouldReply = (comment) => {
  return isBot(comment) && canReplyTo(comment)
}

const isBot = (comment) => {
  return /bot\b/i.test(comment.author.name)
}

const canReplyTo = (comment) => {
  return canReplyMsg(comment)
      && canReplyToBot(comment)
      && canReplyInSub(comment)
}

const canReplyMsg = (comment) => {
  return comment.send_replies
      && comment.distinguished !== 'moderator'
}

const canReplyToBot = (comment) => {
  let user = comment.author.name
  return user !== secrets.username
      && isAllowedIn(user, config.blacklist.users)
      && isAllowedIn(user, tempBlackList)
}

const canReplyInSub = (comment) => {
  return isAllowedIn(comment.subreddit.display_name, config.blacklist.subs)
}

const replyTo = (comment) => {

  let hash = last = comment.name
  let date = formatDate(comment.created_utc)
  let user = comment.author.name

  return comment
    .reply('Good Bot')
    .then(replied => {
      reduceNoise(user)
      console.log(date, hash, 'Good Bot:', user, replied.permalink)
    })
    .catch(err => {
      console.error(date, hash, 'Bad Bot:', user, err)
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
      return comments.reverse()
    })
    .map(comment => {

      min = Math.min(min, comment.created_utc)
      max = Math.max(min, comment.created_utc)

      if (shouldReply(comment)) {
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
