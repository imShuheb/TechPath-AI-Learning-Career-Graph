import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.NEO4J_URI || '';
const user = process.env.NEO4J_USER || '';
const password = process.env.NEO4J_PASSWORD || '';

if (!uri || !user || !password) {
  console.error('Missing Neo4j credentials in environment variables.');
  process.exit(1);
}

export const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export const closeDriver = async () => {
  await driver.close();
};
