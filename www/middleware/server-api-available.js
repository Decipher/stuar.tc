// Check if server is up before loading page
// import axios from 'axios'
// import Waterwheel from 'waterwheel'

export default function ({app, redirect}) {
  app.$waterwheel.jsonapi.get('', {}).catch(() => {
    redirect('/server-unreachable')
  })
}
