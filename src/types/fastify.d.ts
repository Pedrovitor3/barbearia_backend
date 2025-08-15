import 'fastify'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any
    }

    interface FastifyRequest {
        jwtVerify: () => Promise<any>
    }
}
