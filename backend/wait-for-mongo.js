// Simple Node script to wait for MongoDB to be reachable before starting the app
import net from 'net';
import { spawn } from 'child_process';

const host = process.env.MONGODB_HOST || 'mongo';
const port = parseInt(process.env.MONGODB_PORT || '27017', 10);
const timeout = parseInt(process.env.WAIT_TIMEOUT || '30000', 10);

function waitForMongo(host, port, timeout) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tryConnect() {
      const socket = net.createConnection(port, host);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error('Timed out waiting for MongoDB'));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
    }
    tryConnect();
  });
}

async function main() {
  try {
    console.log(`Waiting for MongoDB at ${host}:${port}...`);
    await waitForMongo(host, port, timeout);
    console.log('MongoDB is reachable; starting server');
    const child = spawn('node', process.argv.slice(2), { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code));
  } catch (err) {
    console.error('Error waiting for MongoDB:', err.message);
    process.exit(1);
  }
}

main();
