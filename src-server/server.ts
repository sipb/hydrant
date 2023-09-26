import fastify from 'fastify';

const api = fastify();

api.get('/', async (req, res) => {
  return 'Hello world!';
})

export default api;