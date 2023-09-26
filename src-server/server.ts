import fastify from 'fastify';
import cors from '@fastify/cors'
import data from './data/*';

const api = fastify();
api.register(cors)

api.get('/', (req, res) => {
  return 'Hello world!';
})

for (const file in data) {
  api.get('/' + file, (req, res) => {
    return data[file];
  })
}

export default api;