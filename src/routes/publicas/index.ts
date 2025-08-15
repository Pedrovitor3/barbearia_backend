import { FastifyInstance } from 'fastify';
import authRoutes from './auth';
import statusRoutes from './status';

export default async function rotasPublicas(fastify: FastifyInstance) {
    await fastify.register(authRoutes);
    await fastify.register(statusRoutes);
}
