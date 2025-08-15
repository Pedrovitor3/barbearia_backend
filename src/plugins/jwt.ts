// src\plugins\jwt.ts
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'supersecret'
    })

    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            return reply.status(401).send({ message: 'Token inválido ou ausente' });
        }
    });
})
