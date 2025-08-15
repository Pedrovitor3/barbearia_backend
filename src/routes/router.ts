import { FastifyInstance } from 'fastify';

import rotasPublicas from '@/routes/publicas';
import rotasRestritas from '@/routes/restritas';

export default async function routes(fastify: FastifyInstance) {
    await fastify.register(rotasPublicas);
    await fastify.register(rotasRestritas);
}