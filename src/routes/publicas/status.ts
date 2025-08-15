import { FastifyInstance } from 'fastify';

export default async function statusRoutes(fastify: FastifyInstance) {
    fastify.get('/', async (_request, reply) => {
        return reply.status(200).send({ message: 'API Online' });
    });
}