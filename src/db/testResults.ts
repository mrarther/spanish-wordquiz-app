import { db as defaultDb, type AppDB, type TestResultRow } from './db'

export async function addTestResult(row: TestResultRow, db: AppDB = defaultDb): Promise<number> {
  return (await db.testResults.add(row)) as number
}

/** 新しい順。limit を省略するとすべて */
export async function listTestResults(
  limit?: number,
  db: AppDB = defaultDb,
): Promise<TestResultRow[]> {
  const query = db.testResults.orderBy('at').reverse()
  return (limit ? query.limit(limit) : query).toArray()
}
