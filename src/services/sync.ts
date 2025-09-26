import { ChildRecord } from '../types';
import { db } from './database';

export class SyncService {
  private static isOnline = navigator.onLine;
  private static syncInProgress = false;

  static init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingRecords();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  static async syncPendingRecords(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      const records = await db.getChildRecords();
      const pendingRecords = records.filter(r => !r.isUploaded);
      
      for (const record of pendingRecords) {
        await this.uploadRecord(record);
        await db.markRecordAsUploaded(record.id);
      }
      
      // Trigger custom event for UI updates
      window.dispatchEvent(new CustomEvent('syncComplete', {
        detail: { uploadedCount: pendingRecords.length }
      }));
      
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async uploadRecord(record: ChildRecord): Promise<void> {
    // Mock API upload - in real implementation, this would call your backend API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate upload to server
    console.log(`Uploading record for ${record.childName} (Health ID: ${record.healthId})`);
    
    // In real implementation:
    // const response = await fetch('/api/child-records', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //   },
    //   body: JSON.stringify(record)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Upload failed: ${response.statusText}`);
    // }
  }

  static async getPendingRecordsCount(): Promise<number> {
    const records = await db.getChildRecords();
    return records.filter(r => !r.isUploaded).length;
  }
}