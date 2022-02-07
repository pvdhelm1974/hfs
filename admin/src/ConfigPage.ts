import { Button } from '@mui/material';
import { createElement as h, isValidElement } from 'react';
import { apiCall, useApiComp } from './api'
import { state, useSnapState } from './state'
import { Refresh } from '@mui/icons-material'
import { Dict } from './misc'
import { subscribeKey } from 'valtio/utils'
import { Form, ServerPort, BoolField, NumberField, StringField, SelectField } from './Form';
import StringStringField from './StringStringField'
import { alertDialog } from './dialog'

let loaded: Dict | undefined

subscribeKey(state, 'config', recalculateChanges)

export default function ConfigPage() {
    const [res, reload] = useApiComp('get_config', {
        omit: ['vfs', 'accounts']
    })
    let snap = useSnapState()
    if (isValidElement(res))
        return res
    const { changes } = snap
    const config = (loaded !== res) ? (state.config = loaded = res) : snap.config
    return h(Form, {
        sx: { maxWidth:'80em' },
        values: config,
        set(v, { k }) {
            if (v || config[k])
                state.config[k] = v
        },
        sticky: true,
        save: {
            onClick: save,
            disabled: !Object.keys(changes).length,
        },
        addToBar: [h(Button, {
            onClick: reload,
            startIcon: h(Refresh),
        }, 'Reload')],
        defaults({ comp }) {
            const shortField = comp === NumberField || comp === BoolField
            return { md: shortField ? 3 : 6 }
        },
        fields: [
            { k: 'admin_port', comp: ServerPort, label: 'Admin port' },
            { k: 'admin_network', comp: SelectField, label: 'Admin access',
                options:[
                    { value: '127.0.0.1', label: 'localhost only' },
                    { value: '0.0.0.0', label: 'any network' }
                ]
            },
            { k: 'port', comp: ServerPort, label:'HTTP port' },
            { k: 'https_port', comp: ServerPort, label: 'HTTPS port' },
            { k: 'cert', comp: StringField, label: 'HTTPS certificate file' },
            { k: 'private_key', comp: StringField, label: 'HTTPS private key file' },
            { k: 'max_kbps', comp: NumberField, label: 'Max KB/s' },
            { k: 'max_kbps_per_ip', comp: NumberField, label: 'Max KB/s per-ip' },
            { k: 'log', comp: StringField, label: 'Main log file' },
            { k: 'error_log', comp: StringField, label: 'Error log file' },
            { k: 'accounts', comp: StringField, label: 'Accounts file' },
            { k: 'open_browser_at_start', comp: BoolField },
            { k: 'zip_calculate_size_for_seconds', comp: NumberField, label: 'Calculate ZIP size for seconds' },
            { k: 'mime', comp: StringStringField,
                keyLabel: 'Files', keyWidth: 7,
                valueLabel: 'Mime type', valueWidth: 4
            },
        ]
    })

    async function save() {
        await apiCall('set_config', { values: state.changes })
        Object.assign(loaded, state.changes) // since changes are recalculated subscribing state.config, but it depends on 'loaded' to (which cannot be subscribed), be sure to update loaded first
        recalculateChanges()
        console.debug('saved')
        await alertDialog("Changes applied")
    }
}

function recalculateChanges() {
    const changes: Dict = {}
    if (state.config)
        for (const [k, v] of Object.entries(state.config))
            if (JSON.stringify(v) !== JSON.stringify(loaded?.[k]))
                changes[k] = v
    state.changes = changes
    console.debug('changes', Object.keys(changes))
}