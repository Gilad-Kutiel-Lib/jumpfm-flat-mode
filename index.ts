import { JumpFm, Panel, File } from 'jumpfm-api'

import * as fs from 'fs-extra';
import * as path from 'path';

const flat = (dir: string, maxSize: number): File[] => {
    const flatDir = (rootDir: string, res: File[]) => {
        if (res.length > maxSize) return

        fs.readdirSync(rootDir)
            .map(name => path.join(rootDir, name))
            .filter(fullPath => fs.existsSync(fullPath))
            .forEach(fullPath => {
                const stat = fs.statSync(fullPath)
                if (stat.isDirectory()) flatDir(fullPath, res)
                else res.length <= maxSize && res.push({
                    name: fullPath
                    , path: fullPath
                })
            })
    }

    const res = []
    flatDir(dir, res)
    return res
}

export const load = (jumpFm: JumpFm) => {
    const maxSize = jumpFm.settings.getNum('flatModeMaxSize', 5000)

    jumpFm.panels.forEach(panel => {
        panel.onCd(() => {
            const url = panel.getUrl()
            if (url.protocol != 'flat') return

            const items = flat(url.path, maxSize)
            panel.setItems(items)
            if (items.length <= maxSize) return

            jumpFm.statusBar
                .msg('flat')
                .setType('err')
                .setText('Flat Err')
                .setTooltip('Too many files to show, not showing all files')
                .setClearTimeout(5000)
        })
        panel.bind('flatMode', ['r'], () => {
            const url = panel.getUrl()
            if (url.protocol == 'flat') url.protocol = ''
            else url.protocol = 'flat'
            panel.cd(url)
        })
    })
}