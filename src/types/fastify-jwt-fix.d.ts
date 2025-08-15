declare module '@fastify/jwt' {
    import { FastifyPluginCallback } from 'fastify'
    const fastifyJwt: FastifyPluginCallback<{ secret: string }>
    export default fastifyJwt
}
