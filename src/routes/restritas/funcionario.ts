import { FastifyInstance } from "fastify";
import { AppDataSource } from "@/data-source";
import { Funcionario } from "@/entity/Funcionario";
import { FuncionarioController } from "@/controllers/FuncionarioController";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}

export default async function funcionarioRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/funcionarios",
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const funcionarioRepository = AppDataSource.getRepository(Funcionario);
      try {
        const funcionarios = await funcionarioRepository.find({
          relations: ["pessoa"],
        });
        return reply.status(201).send(funcionarios);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message:
            error.message || "Erro ao buscar todos os funcionários do sistema",
          error,
        });
      }
    }
  );
  fastify.post(
    "/funcionario",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const funcionario = await FuncionarioController.criarFuncionario(
          request.body as any,
          usuario
        );
        return reply.status(201).send(funcionario);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao criar funcionário",
          error,
        });
      }
    }
  );

  fastify.put(
    "/funcionario/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const funcionarioId = Number((request.params as { id: string }).id);
        const funcionario = await FuncionarioController.editarFuncionario(
          funcionarioId,
          request.body as any,
          usuario
        );
        return reply.status(200).send(funcionario);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao editar funcionário",
          error,
        });
      }
    }
  );

  fastify.get(
    "/empresa/:empresa_id/funcionarios",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const empresaId = Number(
          (request.params as { empresa_id: string }).empresa_id
        );
        const funcionarios =
          await FuncionarioController.listarFuncionariosDaEmpresa(
            empresaId,
            usuario
          );
        return reply.status(200).send(funcionarios);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao listar funcionários",
          error,
        });
      }
    }
  );
}
