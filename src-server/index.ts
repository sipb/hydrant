import api from './server';

const port = +(process.env.API_PORT || '6873')

api.listen({ port }).then(address => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
}, err => {
  console.error('Failed to start server:', err);
  process.exit(1);
})