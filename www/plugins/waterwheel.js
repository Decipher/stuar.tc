import Waterwheel from 'waterwheel'

const waterwheel = new Waterwheel({
  base: process.env.API_URL,
  oauth: {
    grant_type: 'password',
    client_id: process.env.API_CONSUMER_CLIENT_ID,
    client_secret: process.env.API_CONSUMER_CLIENT_SECRET,
    username: process.env.API_CONSUMER_USERNAME,
    password: process.env.API_CONSUMER_PASSWORD
  },
  timeout: 2500,
  jsonapiPrefix: 'api'
})

export default (ctx) => {
  const { app, store } = ctx

  app.$waterwheel = waterwheel
  ctx.$waterwheel = waterwheel
  if (store) {
    store.$waterwheel = waterwheel
  }
}
