// This file is part of HFS - Copyright 2021-2022, Massimo Melina <a@rejetto.com> - License https://www.gnu.org/licenses/gpl-3.0.txt

import { changePasswordHelper, changeSrpHelper } from './api.helpers'
import { ApiError, ApiHandlers } from './apiMiddleware'
import {
    Account,
    accountCanLoginAdmin,
    accountHasPassword,
    accountsConfig,
    addAccount,
    delAccount,
    getAccount,
    getCurrentUsername,
    setAccount
} from './perm'
import _ from 'lodash'
import { FORBIDDEN } from './const'

function prepareAccount(ac: Account | undefined) {
    return ac && {
        ..._.omit(ac, ['password','hashed_password','srp']),
        username: ac.username, // omit won't copy it because it's a hidden prop
        hasPassword: accountHasPassword(ac),
        adminActualAccess: accountCanLoginAdmin(ac),
    }
}

const apis: ApiHandlers = {

    get_usernames() {
        return { list: Object.keys(accountsConfig.get()) }
    },

    get_account({ username }, ctx) {
        return prepareAccount(getAccount(username || getCurrentUsername(ctx)))
            || new ApiError(404)
    },

    get_accounts() {
        return { list: Object.values(accountsConfig.get()).map(prepareAccount) }
    },

    get_admins() {
        return { list: _.filter(accountsConfig.get(), accountCanLoginAdmin).map(ac => ac.username) }
    },

    set_account({ username, changes }) {
        const { admin } = changes
        if (admin === null)
            changes.admin = undefined
        else if (admin !== undefined && typeof admin !== 'boolean')
            return new ApiError(400, "invalid admin")
        const acc = setAccount(username, changes)
        return acc ? _.pick(acc, 'username') : new ApiError(400)
    },

    add_account({ username, ...rest }) {
        if (getAccount(username))
            return new ApiError(FORBIDDEN)
        const acc = addAccount(username, rest)
        return acc ? _.pick(acc, 'username') : new ApiError(400)
    },

    del_account({ username }) {
        return delAccount(username) ? {} : new ApiError(400)
    },

    async change_password_others({ username, newPassword }) {
        return changePasswordHelper(getAccount(username), newPassword)
    },

    async change_srp_others({ username, salt, verifier }) {
        return changeSrpHelper(getAccount(username), salt, verifier)
    }

}

export default apis