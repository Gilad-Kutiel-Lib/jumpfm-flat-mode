import { JumpFm, Panel, File } from 'jumpfm-api'

import * as fs from 'fs-extra';
import * as path from 'path';

export const load = (jumpFm: JumpFm) => {
    const maxSize = jumpFm.settings.getNum('flatModeMaxSize', 5000)

    const flat = (dir: string): File[] => {
        const flatDir = (rootDir: string, res: File[]) => {
            if (res.length > maxSize) return

            fs.readdirSync(rootDir)
                .map(name => path.join(rootDir, name))
                .filter(fullPath => fs.existsSync(fullPath))
                .forEach(fullPath => {
                    const stat = fs.statSync(fullPath)
                    if (stat.isDirectory()) flatDir(fullPath, res)
                    else res.length <= maxSize && res.push({
                        name: path.relative(dir, fullPath)
                        , path: fullPath
                    })
                })
        }

        const res = []
        flatDir(dir, res)
        return res
    }

    jumpFm.panels.forEach(panel => {
        const flatAndSet = () => {
            const items = flat(panel.getUrl().path)
            panel.setItems(items)
            if (items.length <= maxSize) return

            jumpFm.statusBar
                .msg('flat')
                .setType('err')
                .setText('Flat Err')
                .setTooltip('Too many files to show, not showing all files')
                .setClearTimeout(5000)
        }

        panel.onCd(() => {
            jumpFm.watchStop('flat-mode')
            if (panel.getUrl().protocol != 'flat') return

            jumpFm.watchStart('flat-mode', panel.getUrl().path, flatAndSet, true)
            flatAndSet()
        })

        panel.bind('flatMode', ['r'], () => {
            const url = panel.getUrl()
            if (url.protocol == 'flat') url.protocol = ''
            else url.protocol = 'flat'
            panel.cd(url)
        })
    })
}