// automatski lokalni backup 
// sacuvava samo tekst, slike se vec nalaze lokalno na uredjaju
// ne prolazi ni base64 korak za slike jer nije namijenjeno za prenos
import * as FileSystem from 'expo-file-system/legacy';
import { exportRawData, importRawData } from '../db/database';

const MAX_BACKUPS = 5;
const BACKUP_DIR = FileSystem.documentDirectory + 'auto_backups/';

export async function runAutoBackupIfNeeded(): Promise<void> {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true }).catch(() => { });

    const today = new Date().toISOString().slice(0, 10);
    const todayFile = BACKUP_DIR + `backup-${today}.json`;

    const info = await FileSystem.getInfoAsync(todayFile);
    if (info.exists)
        return;

    const data = exportRawData();
    await FileSystem.writeAsStringAsync(todayFile, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });

    await cleanupOldBackups();
}

async function cleanupOldBackups() {
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const sorted = files.filter(f => f.startsWith('backup-')).sort();
    if (sorted.length > MAX_BACKUPS) {
        const toDelete = sorted.slice(0, sorted.length - MAX_BACKUPS);
        for (const f of toDelete)
            await FileSystem.deleteAsync(BACKUP_DIR + f, { idempotent: true });
    }
}

export async function listAutoBackups(): Promise<string[]> {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true }).catch(() => { });
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    return files.filter(f => f.startsWith('backup-')).sort().reverse();
}

export async function restoreAutoBackup(filename: string): Promise<void> {
    const json = await FileSystem.readAsStringAsync(BACKUP_DIR + filename, { encoding: FileSystem.EncodingType.UTF8 });
    importRawData(JSON.parse(json));
}