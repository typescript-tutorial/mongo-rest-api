import {Collection, Db} from 'mongodb';

export interface AuditLogConfig {
  user: string;
  ip: string;
  resource: string;
  action: string;
  timestamp: string;
  status: string;
  remark: string;
}
export function initializeAuditLogConfig(conf?: AuditLogConfig): AuditLogConfig {
  if (conf) {
    return conf;
  } else {
    const c: AuditLogConfig = {
      user: 'user',
      ip: 'ip',
      resource: 'resource',
      action: 'action',
      timestamp: 'timestamp',
      status: 'status',
      remark: 'remark'
    };
    return c;
  }
}
export class AuditLogWriter {
  config: AuditLogConfig;
  collection: Collection;
  constructor(db: Db, collectionName: string, public generate?: () => string, config?: AuditLogConfig) {
    this.collection = db.collection(collectionName);
    this.config = initializeAuditLogConfig(config);
    this.write = this.write.bind(this);
  }
  write(user: string, ip: string, resource: string, action: string, success: boolean, remark?: string): Promise<number> {
    const log: any = {};
    if (this.generate) {
      log._id = this.generate();
    }
    const c = this.config;
    log[c.user] = user;
    log[c.ip] = ip;
    log[c.resource] = resource;
    log[c.action] = action;
    log[c.status] = success;
    if (remark && remark.length > 0) {
      log[c.remark] = remark;
    }
    return this.collection.insertOne(log).then(r => r.insertedCount);
  }
}
