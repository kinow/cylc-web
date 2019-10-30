import i18n from '@/i18n'

/**
 * Define all of your application routes here
 * for more information on routes, see the
 * official documentation https://router.vuejs.org/en/
 */
export default [
  {
    path: '/',
    view: 'Dashboard',
    name: i18n.t('App.dashboard'),
    meta: {
      layout: 'default'
    }
  },
  {
    path: '/workflows',
    name: i18n.t('App.workflows'),
    view: 'GScan',
    meta: {
      layout: 'default'
    }
  },
  {
    path: '/workflows/:name',
    view: 'Tree',
    meta: {
      layout: 'default'
    }
  },
  {
    path: '/dot/:name',
    view: 'Dot',
    meta: {
      layout: 'default'
    },
    props: true
  },
  {
    path: '/user-profile',
    name: i18n.t('App.userProfile'),
    view: 'UserProfile',
    meta: {
      layout: 'default'
    }
  },
  {
    path: '/guide',
    name: 'Guide',
    view: 'Guide',
    meta: {
      layout: 'default'
    }
  },
  {
    path: '*',
    view: 'NotFound',
    meta: {
      layout: 'empty'
    }
  }
]
