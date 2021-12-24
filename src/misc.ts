import fs from 'fs/promises'
import { objSameKeys } from './obj'

export function enforceFinal(sub:string, s:string) {
    return s.endsWith(sub) ? s : s+sub
}

export async function isDirectory(path: string) {
    try { return (await fs.stat(path)).isDirectory() }
    catch(e) { return false }
}

export async function isFile(path: string) {
    try { return (await fs.stat(path)).isFile() }
    catch(e) { return false }
}

export function complySlashes(path: string) {
    return path.replace(/\\/g,'/')
}

export function prefix(pre:string, v:string|number, post:string='') {
    return v ? pre+v+post : ''
}

export function setHidden(dest: object, src:object) {
    Object.defineProperties(dest, objSameKeys(src, value => ({ enumerable:false, value })))
}

export function wait(ms: number) {
    return new Promise(res=> setTimeout(res,ms))
}

export async function readFileBusy(path: string): Promise<string> {
    return fs.readFile(path, 'utf8').catch(e => {
        if ((e as any)?.code !== 'EBUSY')
            throw e
        console.debug('busy')
        return wait(100).then(()=> readFileBusy(path))
    })
}
