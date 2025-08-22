import { Cliente } from "@/entity/Cliente";
import { In } from "typeorm";
import { AppDataSource } from "@/data-source";
import { Empresa } from "@/entity/Empresa";
import { Administrador } from "@/entity/Administrador";
import { Funcionario } from "@/entity/Funcionario";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}

export interface ClienteDetalhado {
  cliente: Cliente;
  empresa?: Empresa;
  isAdmin: boolean;
  isFuncionario: boolean;
  isProprioCliente: boolean;
}

export class ClienteController {
  private static async verificarAcessoCliente(
    clienteId: number,
    usuario: AuthenticatedUser
  ): Promise<boolean> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Admin tem acesso a todos
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      return true;
    }

    // Buscar o cliente para verificar a empresa
    const cliente = await clienteRepo.findOneBy({ clienteId });
    if (!cliente) {
      return false;
    }

    // Verificar se é funcionário da mesma empresa
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: cliente.empresaId,
    });
    if (isFuncionario) {
      return true;
    }

    // Verificar se é o próprio cliente
    if (cliente.pessoaId === usuario.pessoaId) {
      return true;
    }

    return false;
  }

  static async listarCliente(
    clienteId: number,
    usuario: AuthenticatedUser,
    incluirRelacionamentos: boolean = false
  ): Promise<ClienteDetalhado | null> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const empresaRepo = AppDataSource.getRepository(Empresa);

    // Verificar se o usuário tem acesso ao cliente
    const temAcesso = await this.verificarAcessoCliente(clienteId, usuario);
    if (!temAcesso) {
      return null;
    }

    // Buscar o cliente
    const cliente = await clienteRepo.findOneBy({ clienteId });
    if (!cliente) {
      return null;
    }

    // Verificar o tipo de usuário
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    const funcionarioUsuario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: cliente.empresaId,
    });
    const isProprioCliente = cliente.pessoaId === usuario.pessoaId;

    // Preparar resposta básica
    const resultado: ClienteDetalhado = {
      cliente,
      isAdmin: !!isAdmin,
      isFuncionario: !!funcionarioUsuario,
      isProprioCliente,
    };

    // Incluir relacionamentos detalhados se solicitado
    if (incluirRelacionamentos) {
      // Buscar dados da empresa
      const empresa = await empresaRepo.findOneBy({
        empresaId: cliente.empresaId,
      });
      resultado.empresa = empresa ?? undefined;

      // Incluir relacionamento com pessoa se necessário
      if (isAdmin || funcionarioUsuario || isProprioCliente) {
        const clienteCompleto = await clienteRepo.findOne({
          where: { clienteId },
          relations: ["pessoa", "empresa"],
        });
        if (clienteCompleto) {
          resultado.cliente = clienteCompleto;
        }
      }
    }

    return resultado;
  }

  // Criação de cliente (admin ou funcionário da empresa)
  static async criarCliente(
    data: {
      pessoaId: number;
      empresaId: number;
      preferencias?: object;
      observacoes?: string;
    },
    usuario: AuthenticatedUser
  ) {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Verifica se é admin
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });

    // Verifica se é funcionário da empresa
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: data.empresaId,
    });

    if (!isAdmin && !isFuncionario) {
      throw {
        status: 403,
        message:
          "Apenas administradores ou funcionários da empresa podem cadastrar clientes.",
      };
    }

    // Verificar se a pessoa já é cliente da empresa
    const clienteExistente = await clienteRepo.findOneBy({
      pessoaId: data.pessoaId,
      empresaId: data.empresaId,
    });

    if (clienteExistente) {
      throw {
        status: 409,
        message: "Esta pessoa já é cliente desta empresa.",
      };
    }

    const cliente = clienteRepo.create(data);
    return await clienteRepo.save(cliente);
  }

  // Edição de cliente (admin, funcionário da empresa ou próprio cliente)
  static async editarCliente(
    clienteId: number,
    data: Partial<{
      preferencias: object;
      observacoes: string;
    }>,
    usuario: AuthenticatedUser
  ) {
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Buscar cliente
    const cliente = await clienteRepo.findOneBy({ clienteId });
    if (!cliente) {
      throw { status: 404, message: "Cliente não encontrado." };
    }

    // Admin pode editar qualquer cliente
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      await clienteRepo.update(clienteId, data);
      return await clienteRepo.findOneByOrFail({ clienteId });
    }

    // Funcionário da empresa pode editar
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: cliente.empresaId,
    });
    if (funcionario) {
      await clienteRepo.update(clienteId, data);
      return await clienteRepo.findOneByOrFail({ clienteId });
    }

    // Próprio cliente pode editar apenas preferências
    if (cliente.pessoaId === usuario.pessoaId) {
      // Limitar campos que o próprio cliente pode editar
      const dadosPermitidos = {
        preferencias: data.preferencias,
      };
      await clienteRepo.update(clienteId, dadosPermitidos);
      return await clienteRepo.findOneByOrFail({ clienteId });
    }

    throw { status: 403, message: "Usuário não autorizado." };
  }

  static async listarClientesPorEmpresa(
    empresaId: number,
    usuario: AuthenticatedUser
  ): Promise<Cliente[]> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Admin pode ver clientes de qualquer empresa
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });

    // Funcionário pode ver clientes da própria empresa
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });

    if (!isAdmin && !isFuncionario) {
      throw {
        status: 403,
        message:
          "Acesso negado. Apenas administradores ou funcionários da empresa podem listar clientes.",
      };
    }

    return await clienteRepo.find({
      where: { empresaId },
      relations: ["pessoa"],
    });
  }

  static async listarClientesVinculados(
    usuario: AuthenticatedUser
  ): Promise<Cliente[]> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Se for admin, retorna todos
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      return await clienteRepo.find({
        relations: ["pessoa", "empresa"],
      });
    }

    // Funcionário: clientes das empresas onde trabalha
    const funcionarios = await funcionarioRepo.find({
      where: { pessoaId: usuario.pessoaId },
    });
    const empresaIds = funcionarios.map((f) => f.empresaId);

    // Cliente: apenas seus próprios registros
    const clientesProrios = await clienteRepo.find({
      where: { pessoaId: usuario.pessoaId },
      relations: ["pessoa", "empresa"],
    });

    if (empresaIds.length === 0) {
      return clientesProrios;
    }

    // Buscar clientes das empresas onde é funcionário
    const clientesEmpresa = await clienteRepo.find({
      where: { empresaId: In(empresaIds) },
      relations: ["pessoa", "empresa"],
    });

    // Unir e remover duplicatas
    const todosClientes = [...clientesEmpresa, ...clientesProrios];
    const clientesUnicos = todosClientes.filter(
      (cliente, index, arr) =>
        arr.findIndex((c) => c.clienteId === cliente.clienteId) === index
    );

    return clientesUnicos;
  }

  // Remover cliente (soft delete)
  static async removerCliente(
    clienteId: number,
    usuario: AuthenticatedUser
  ): Promise<void> {
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Buscar cliente
    const cliente = await clienteRepo.findOneBy({ clienteId });
    if (!cliente) {
      throw { status: 404, message: "Cliente não encontrado." };
    }

    // Admin pode remover qualquer cliente
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });

    // Funcionário da empresa pode remover
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: cliente.empresaId,
    });

    if (!isAdmin && !funcionario) {
      throw {
        status: 403,
        message:
          "Apenas administradores ou funcionários da empresa podem remover clientes.",
      };
    }

    // Soft delete
    await clienteRepo.update(clienteId, {
      deletedAt: new Date(),
    });
  }
}
