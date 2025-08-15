import '@fastify/jwt'
import 'fastify'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
        jwt: {
            sign: (payload: any, options?: any) => string
            verify: (token: string, options?: any) => any
            decode: (token: string, options?: any) => any
        }
    }

    interface FastifyRequest {
        user: { username: string }
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { username: string }
        user: { username: string }
    }
}
