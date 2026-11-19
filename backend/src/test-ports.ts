import net from 'net';

const hosts = ['smtpout.secureserver.net'];
const ports = [3535, 80, 2525, 587, 465];

for (const p of ports) {
  const socket = new net.Socket();
  socket.setTimeout(3000);
  socket.on('connect', () => {
    console.log(`Port ${p} CONNECTED`);
    socket.destroy();
  });
  socket.on('timeout', () => {
    console.log(`Port ${p} TIMEOUT`);
    socket.destroy();
  });
  socket.on('error', (err) => {
    console.log(`Port ${p} ERROR:`, err.message);
  });
  socket.connect(p, 'smtpout.secureserver.net');
}
