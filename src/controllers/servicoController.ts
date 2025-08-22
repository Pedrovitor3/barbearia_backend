import { Servico } from "@/entity/Servico";
import { In, IsNull } from "typeorm";
import { AppDataSource } from "@/data-source";
import { Empresa } from "@/entity/Empresa";
import { Administrador } from "@/entity/Administrador";
import { Funcionario } from "@/entity/Funcionario";
import { Cliente } from "@/entity/Cliente";

interface AuthenticatedUser {
  usuarioId: number;
  pessoaId: number;
}

export interface ServicoDetalhado {
  servico: Servico;
  empresa?: Empresa;
  isAdmin: boolean;
  isFuncionario: boolean;
  isCliente: boolean;
}

export class ServicoController {
  private static async verificarAcessoServico(
    servicoId: number,
    usuario: AuthenticatedUser
  ): Promise<boolean> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const servicoRepo = AppDataSource.getRepository(Servico);

    // Admin tem acesso a todos
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      return true;
    }

    // Buscar o serviço para verificar a empresa
    const servico = await servicoRepo.findOneBy({ servicoId });
    if (!servico) {
      return false;
    }

    // Verificar se é funcionário da mesma empresa
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });
    if (isFuncionario) {
      return true;
    }

    // Verificar se é cliente da empresa (pode visualizar serviços)
    const isCliente = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });
    if (isCliente) {
      return true;
    }

    return false;
  }

  private static async verificarAcessoEmpresa(
    empresaId: number,
    usuario: AuthenticatedUser
  ): Promise<boolean> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    // Admin tem acesso a todas
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      return true;
    }

    // Verificar se é funcionário da empresa
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    if (isFuncionario) {
      return true;
    }

    // Verificar se é cliente da empresa
    const isCliente = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });
    if (isCliente) {
      return true;
    }

    return false;
  }

  static async listarServico(
    servicoId: number,
    usuario: AuthenticatedUser,
    incluirRelacionamentos: boolean = false
  ): Promise<ServicoDetalhado | null> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const servicoRepo = AppDataSource.getRepository(Servico);
    const empresaRepo = AppDataSource.getRepository(Empresa);

    // Verificar se o usuário tem acesso ao serviço
    const temAcesso = await this.verificarAcessoServico(servicoId, usuario);
    if (!temAcesso) {
      return null;
    }

    // Buscar o serviço (apenas ativos para clientes)
    const servico = await servicoRepo.findOne({
      where: {
        servicoId,
        deletedAt: IsNull(),
      },
    });
    if (!servico) {
      return null;
    }

    // Verificar o tipo de usuário
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    const funcionarioUsuario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });
    const clienteUsuario = await clienteRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });

    // Preparar resposta básica
    const resultado: ServicoDetalhado = {
      servico,
      isAdmin: !!isAdmin,
      isFuncionario: !!funcionarioUsuario,
      isCliente: !!clienteUsuario,
    };

    // Incluir relacionamentos detalhados se solicitado
    if (incluirRelacionamentos) {
      // Buscar dados da empresa
      const empresa = await empresaRepo.findOneBy({
        empresaId: servico.empresaId,
      });
      resultado.empresa = empresa ?? undefined;
    }

    return resultado;
  }

  // Criação de serviço (admin ou funcionário da empresa)
  static async criarServico(
    data: {
      empresaId: number;
      nome: string;
      descricao?: string;
      duracaoMinutos?: number;
      preco: string;
      categoria?: string;
      ativo?: boolean;
    },
    usuario: AuthenticatedUser
  ) {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const servicoRepo = AppDataSource.getRepository(Servico);

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
          "Apenas administradores ou funcionários da empresa podem criar serviços.",
      };
    }

    const servico = servicoRepo.create({
      ...data,
      duracaoMinutos: data.duracaoMinutos || 60,
      ativo: data.ativo !== undefined ? data.ativo : true,
    });
    return await servicoRepo.save(servico);
  }

  // Edição de serviço (admin ou funcionário da empresa)
  static async editarServico(
    servicoId: number,
    data: Partial<{
      nome: string;
      descricao: string;
      duracaoMinutos: number;
      preco: string;
      categoria: string;
      ativo: boolean;
    }>,
    usuario: AuthenticatedUser
  ) {
    const servicoRepo = AppDataSource.getRepository(Servico);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Buscar serviço
    const servico = await servicoRepo.findOne({
      where: {
        servicoId,
        deletedAt: IsNull(),
      },
    });
    if (!servico) {
      throw { status: 404, message: "Serviço não encontrado." };
    }

    // Admin pode editar qualquer serviço
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      await servicoRepo.update(servicoId, { ...data, updatedAt: new Date() });
      return await servicoRepo.findOneByOrFail({ servicoId });
    }

    // Funcionário da empresa pode editar
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });
    if (funcionario) {
      await servicoRepo.update(servicoId, { ...data, updatedAt: new Date() });
      return await servicoRepo.findOneByOrFail({ servicoId });
    }

    throw { status: 403, message: "Usuário não autorizado." };
  }

  static async listarServicosPorEmpresa(
    empresaId: number,
    usuario: AuthenticatedUser
  ): Promise<Servico[]> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const servicoRepo = AppDataSource.getRepository(Servico);

    // Verificar acesso à empresa
    const temAcesso = await this.verificarAcessoEmpresa(empresaId, usuario);
    if (!temAcesso) {
      throw {
        status: 403,
        message: "Acesso negado.",
      };
    }

    // Verificar tipo de usuário para determinar filtros
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    const isFuncionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId,
    });

    // Definir condições de busca
    const whereConditions: any = {
      empresaId,
      deletedAt: IsNull(),
    };

    // Clientes só veem serviços ativos
    if (!isAdmin && !isFuncionario) {
      whereConditions.ativo = true;
    }

    return await servicoRepo.find({
      where: whereConditions,
      order: { nome: "ASC" },
    });
  }

  static async listarServicosVinculados(
    usuario: AuthenticatedUser,
    incluirInativos: boolean = false
  ): Promise<Servico[]> {
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const servicoRepo = AppDataSource.getRepository(Servico);

    // Se for admin, retorna todos
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });
    if (isAdmin) {
      const whereConditions: any = { deletedAt: IsNull() };
      if (!incluirInativos) {
        whereConditions.ativo = true;
      }
      return await servicoRepo.find({
        where: whereConditions,
        order: { nome: "ASC" },
      });
    }

    // Funcionário: serviços das empresas onde trabalha
    const funcionarios = await funcionarioRepo.find({
      where: { pessoaId: usuario.pessoaId },
    });
    const empresasFuncionarioIds = funcionarios.map((f) => f.empresaId);

    // Cliente: serviços das empresas onde é cliente
    const clientes = await clienteRepo.find({
      where: { pessoaId: usuario.pessoaId },
    });
    const empresasClienteIds = clientes.map((c) => c.empresaId);

    // Unir ids e buscar serviços
    const empresaIds = Array.from(
      new Set([...empresasFuncionarioIds, ...empresasClienteIds])
    );

    if (empresaIds.length === 0) {
      return [];
    }

    const whereConditions: any = {
      empresaId: In(empresaIds),
      deletedAt: IsNull(),
    };

    // Se é apenas cliente (não funcionário), só vê ativos
    if (empresasFuncionarioIds.length === 0) {
      whereConditions.ativo = true;
    } else if (!incluirInativos) {
      whereConditions.ativo = true;
    }

    return await servicoRepo.find({
      where: whereConditions,
      order: { nome: "ASC" },
    });
  }

  // Remover serviço (soft delete)
  static async removerServico(
    servicoId: number,
    usuario: AuthenticatedUser
  ): Promise<void> {
    const servicoRepo = AppDataSource.getRepository(Servico);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Buscar serviço
    const servico = await servicoRepo.findOne({
      where: {
        servicoId,
        deletedAt: IsNull(),
      },
    });
    if (!servico) {
      throw { status: 404, message: "Serviço não encontrado." };
    }

    // Admin pode remover qualquer serviço
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });

    // Funcionário da empresa pode remover
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });

    if (!isAdmin && !funcionario) {
      throw {
        status: 403,
        message:
          "Apenas administradores ou funcionários da empresa podem remover serviços.",
      };
    }

    // Soft delete
    await servicoRepo.update(servicoId, {
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Ativar/Desativar serviço
  static async toggleAtivoServico(
    servicoId: number,
    usuario: AuthenticatedUser
  ): Promise<Servico> {
    const servicoRepo = AppDataSource.getRepository(Servico);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const funcionarioRepo = AppDataSource.getRepository(Funcionario);

    // Buscar serviço
    const servico = await servicoRepo.findOne({
      where: {
        servicoId,
        deletedAt: IsNull(),
      },
    });
    if (!servico) {
      throw { status: 404, message: "Serviço não encontrado." };
    }

    // Admin pode ativar/desativar qualquer serviço
    const isAdmin = await adminRepo.findOneBy({ pessoaId: usuario.pessoaId });

    // Funcionário da empresa pode ativar/desativar
    const funcionario = await funcionarioRepo.findOneBy({
      pessoaId: usuario.pessoaId,
      empresaId: servico.empresaId,
    });

    if (!isAdmin && !funcionario) {
      throw {
        status: 403,
        message:
          "Apenas administradores ou funcionários da empresa podem ativar/desativar serviços.",
      };
    }

    // Toggle do status ativo
    await servicoRepo.update(servicoId, {
      ativo: !servico.ativo,
      updatedAt: new Date(),
    });

    return await servicoRepo.findOneByOrFail({ servicoId });
  }
}
