import User from '@/model/User.model'
import store from '@/store/index'

export const UserService = {

  getUserProfile () {
    const user = new User(process.env.USER, ['cylc-developers', 'linux-users'], new Date(), true, `/user/${process.env.USER}/`)
    return store.dispatch('user/setUser', user)
  }

}
