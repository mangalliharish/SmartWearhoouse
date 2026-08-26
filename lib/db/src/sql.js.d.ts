declare module "sql.js" {
  export interface Database {
    run(sql: string, params?: any[] | Record<string, any>): Database;
    exec(sql: string, params?: any[] | Record<string, any>): Array<{ columns: string[]; values: any[][] }>;
    export(): Uint8Array;
    close(): void;
    prepare(sql: string, params?: any[]): any;
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer) => Database;
  }

  export default function initSqlJs(config?: {
    locateFile?: (url: string, scriptDirectory: string) => string;
  }): Promise<SqlJsStatic>;
}
