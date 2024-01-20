import Fastify from "fastify";
import { join, resolve } from "path";
import fastifyWebsocket from "@fastify/websocket";
import { WebSocket } from "ws";

const fastify = Fastify();
const fastifyStatic = require('@fastify/static')
const datadir = './data';

const connections: WebSocket[] = [];

fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/',
})

fastify.register(fastifyStatic, {
  root: resolve(datadir),
  prefix: '/data',
  decorateReply: false
})

// fastify.addHook('preHandler', (request, reply, done) => {
//   if (request.url.includes('webm')) {
//     reply.headers({ 'content-type': 'video/webm' });
//   }
//   done();
// });

fastify.register(fastifyWebsocket);

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (conn) => {
    connections.push(conn.socket);

    conn.socket.on('message', message => {
      //@ts-ignore
      connections.filter(v => v !== conn.socket).forEach(v => v.send(new TextDecoder().decode(message)));
    })
  })
})

fastify.listen({ port: 4000, host: '0.0.0.0' }).then(() => {
  console.log("Fastify started on http://localhost:4000");
});
