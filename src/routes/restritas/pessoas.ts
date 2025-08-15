import { FastifyInstance } from 'fastify';
import { AppDataSource } from '@/data-source';
import { Pessoa } from '@/entity/Pessoa';

export default async function pessoaRoutes(fastify: FastifyInstance) {
    fastify.get('/pessoas', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
        const pessoaRepository = AppDataSource.getRepository(Pessoa);
        try {
            const pessoas = await pessoaRepository.find();
            return reply.status(200).send(pessoas);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: 'Erro ao buscar pessoas', error });
        }
    });
}
