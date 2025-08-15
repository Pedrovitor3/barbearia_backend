import { FastifyInstance } from 'fastify';

import { AppDataSource } from '@/data-source'; // seu data-source TypeORM configurado
import { Usuario } from '@/entity/Usuario';
import { UsuarioController } from '@/controllers/UsuarioController';
import { EmpresaController } from '@/controllers/EmpresaController';

interface AuthenticatedUser {
    usuarioId: number;
    pessoaId: number;
}

export default async function protectedRoutes(fastify: FastifyInstance) {
    fastify.get('/profile', { preHandler: [fastify.authenticate] }, async (request, _reply) => {
        return { message: 'Rota protegida', user: request.user }
    })

    fastify.get('/usuarios', { preHandler: [fastify.authenticate] }, async (_request, reply) => {
        const usuarioRepository = AppDataSource.getRepository(Usuario);
        try {
            // const usuarios = await usuarioRepository.find();
            const usuarios = await usuarioRepository.find({ relations: ['pessoa'] });
            return reply.status(200).send(usuarios);
        } catch (error) {
            console.log(error);
            return reply.status(500).send({ message: 'Erro ao buscar usuários', error });
        }
    });

    fastify.post('/usuarios', async (request, reply) => {
        try {
            const usuario = await UsuarioController.criarUsuario(request.body as any);
            return reply.status(201).send(usuario);
        } catch (error) {
            return reply.status(400).send({ message: 'Erro ao criar usuário', error });
        }
    });

    // Listar empresas vinculadas ao usuário logado (todas para admin)
    fastify.get('/empresas', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const empresas = await EmpresaController.listarEmpresasVinculadas(usuario);
            return reply.status(200).send(empresas);
        } catch (error) {
            return reply.status(500).send({ message: 'Erro ao buscar empresas', error });
        }
    });

    // Criar empresa (apenas admin)
    fastify.post('/empresa', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            // request.user deve conter usuarioId e pessoaId (do JWT)
            const usuario = request.user as { usuarioId: number; pessoaId: number };
            const empresa = await EmpresaController.criarEmpresa(request.body as any, usuario);
            return reply.status(201).send(empresa);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao criar empresa', error });
        }
    });

    // Editar empresa (admin ou funcionario dono)
    fastify.put('/empresa/:empresa_id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const empresaId = Number((request.params as { empresa_id: string }).empresa_id);
            const empresa = await EmpresaController.editarEmpresa(empresaId, request.body as any, usuario);
            return reply.status(200).send(empresa);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao editar empresa', error });
        }
    });

    // Criar funcionário (admin ou dono)
    fastify.post('/funcionario', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const funcionario = await EmpresaController.criarFuncionario(request.body as any, usuario);
            return reply.status(201).send(funcionario);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao criar funcionário', error });
        }
    });

    // Editar funcionário (admin ou dono)
    fastify.put('/funcionario/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const funcionarioId = Number((request.params as { id: string }).id);
            const funcionario = await EmpresaController.editarFuncionario(funcionarioId, request.body as any, usuario);
            return reply.status(200).send(funcionario);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao editar funcionário', error });
        }
    });

    // Listar funcionários de uma empresa (admin ou dono)
    fastify.get('/empresa/:empresa_id/funcionarios', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const usuario = request.user as AuthenticatedUser;
            const empresaId = Number((request.params as { empresa_id: string }).empresa_id);
            const funcionarios = await EmpresaController.listarFuncionariosDaEmpresa(empresaId, usuario);
            return reply.status(200).send(funcionarios);
        } catch (error: any) {
            return reply.status(error.status || 400).send({ message: error.message || 'Erro ao listar funcionários', error });
        }
    });
}
