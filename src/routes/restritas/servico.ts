import { ServicoController } from "@/controllers/servicoController";
import { FastifyInstance } from "fastify";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}

interface ListarServicosEmpresaBody {
  empresaId: number;
}

export default async function servicoRoutes(fastify: FastifyInstance) {
  // Listar todos os serviços vinculados ao usuário
  fastify.get(
    "/servicos",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const { incluir_inativos } = request.query as {
          incluir_inativos?: string;
        };
        const incluirInativos = incluir_inativos === "true";

        const servicos = await ServicoController.listarServicosVinculados(
          usuario,
          incluirInativos
        );
        return reply.status(200).send(servicos);
      } catch (error: any) {
        return reply
          .status(error.status || 500)
          .send({ message: error.message || "Erro ao buscar serviços", error });
      }
    }
  );

  // Listar serviços por empresa
  fastify.post<{ Body: ListarServicosEmpresaBody }>(
    "/servicos",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const body = request.body;
        const empresaId = body.empresaId;

        const servicos = await ServicoController.listarServicosPorEmpresa(
          empresaId,
          usuario
        );
        return reply.status(200).send(servicos);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao buscar serviços da empresa",
          error,
        });
      }
    }
  );

  // Buscar serviço específico
  fastify.get(
    "/servico/:servico_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const servicoId = Number(
          (request.params as { servico_id: string }).servico_id
        );
        const servico = await ServicoController.listarServico(
          servicoId,
          usuario,
          true
        );

        if (!servico) {
          return reply
            .status(404)
            .send({ message: "Serviço não encontrado ou acesso negado" });
        }

        return reply.status(200).send(servico);
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao buscar serviço", error });
      }
    }
  );

  // Criar novo serviço
  fastify.post(
    "/servico",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const servico = await ServicoController.criarServico(
          request.body as any,
          usuario
        );
        return reply.status(201).send(servico);
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao criar serviço", error });
      }
    }
  );

  // Editar serviço
  fastify.put(
    "/servico/:servico_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const servicoId = Number(
          (request.params as { servico_id: string }).servico_id
        );
        const servico = await ServicoController.editarServico(
          servicoId,
          request.body as any,
          usuario
        );
        return reply.status(200).send(servico);
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao editar serviço", error });
      }
    }
  );

  // Ativar/Desativar serviço
  fastify.patch(
    "/servico/:servico_id/toggle-ativo",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const servicoId = Number(
          (request.params as { servico_id: string }).servico_id
        );
        const servico = await ServicoController.toggleAtivoServico(
          servicoId,
          usuario
        );
        return reply.status(200).send(servico);
      } catch (error: any) {
        return reply.status(error.status || 400).send({
          message: error.message || "Erro ao alterar status do serviço",
          error,
        });
      }
    }
  );

  // Remover serviço (soft delete)
  fastify.delete(
    "/servico/:servico_id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const usuario = request.user as AuthenticatedUser;
        const servicoId = Number(
          (request.params as { servico_id: string }).servico_id
        );
        await ServicoController.removerServico(servicoId, usuario);
        return reply.status(204).send();
      } catch (error: any) {
        return reply
          .status(error.status || 400)
          .send({ message: error.message || "Erro ao remover serviço", error });
      }
    }
  );
}
