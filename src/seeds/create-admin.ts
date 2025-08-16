import { AppDataSource } from '@/data-source';
import { Usuario } from '@/entity/Usuario';
import { Pessoa } from '@/entity/Pessoa';
import { Administrador } from '@/entity/Administrador';
import { Empresa } from '@/entity/Empresa';
import { PessoaEmpresa } from '@/entity/PessoaEmpresa';
import * as bcrypt from 'bcrypt';

// Dados fixos da empresa
const EMPRESA_DATA = {
    nomeFantasia: "Bigode Time",
    slug: "bigode-time",
    razaoSocial: "Bigode Time LTDA",
    cnpj: "00000000000001",
    telefone: "62998130462",
    email: "pedrovitorgouveia123@gmail.com",
    website: "https://bigodetime.com.br",
};

type AdminSeedData = {
    pessoa: {
        nome: string;
        sobrenome: string;
        cpf: string;
        dataNascimento?: string;
        sexo: string;
    };
    usuario: {
        username: string;
        senha: string;
    };
    admin: {
        nivel: string;
    };
};

async function createAdmin(data: AdminSeedData, empresaId: number) {
    const pessoaRepo = AppDataSource.getRepository(Pessoa);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const adminRepo = AppDataSource.getRepository(Administrador);
    const pessoaEmpresaRepo = AppDataSource.getRepository(PessoaEmpresa);

    // Verifica se usuário já existe
    const existingUser = await usuarioRepo.findOne({
        where: { username: data.usuario.username }
    });
    if (existingUser) {
        console.log(`Usuário admin '${data.usuario.username}' já existe, pulando criação.`);
        return;
    }

    // Cria pessoa
    const pessoa = pessoaRepo.create({
        nome: data.pessoa.nome,
        sobrenome: data.pessoa.sobrenome,
        cpf: data.pessoa.cpf,
        dataNascimento: data.pessoa.dataNascimento,
        sexo: data.pessoa.sexo
    });
    const savedPessoa = await pessoaRepo.save(pessoa);

    // Cria usuário
    const senhaHash = await bcrypt.hash(data.usuario.senha, 10);
    const usuario = usuarioRepo.create({
        pessoaId: savedPessoa.pessoaId,
        username: data.usuario.username,
        senhaHash: senhaHash,
        ativo: true
    });
    await usuarioRepo.save(usuario);

    // Cria administrador
    const admin = adminRepo.create({
        pessoaId: savedPessoa.pessoaId,
        nivel: data.admin?.nivel || 'super',
        ativo: true
    });
    await adminRepo.save(admin);

    // Vincula pessoa à empresa
    const vinculo = pessoaEmpresaRepo.create({
        pessoaId: savedPessoa.pessoaId,
        empresaId
    });
    await pessoaEmpresaRepo.save(vinculo);

    console.log(`Usuário admin '${data.usuario.username}' criado com sucesso e vinculado à empresa!`);
}

async function main() {
    await AppDataSource.initialize();

    // Cria ou obtém empresa
    const empresaRepo = AppDataSource.getRepository(Empresa);
    let empresa = await empresaRepo.findOne({ where: { cnpj: EMPRESA_DATA.cnpj } });

    if (!empresa) {
        const novaEmpresa = empresaRepo.create({
            ...EMPRESA_DATA,
            ativo: true
        });
        empresa = await empresaRepo.save(novaEmpresa);
        console.log(`Empresa '${EMPRESA_DATA.nomeFantasia}' criada com sucesso!`);
    } else {
        console.log(`Empresa '${EMPRESA_DATA.nomeFantasia}' já existe, usando existente.`);
    }

    // Cria admins
    await createAdmin({
        pessoa: {
            nome: 'Joanatas',
            sobrenome: 'Martins',
            cpf: '04472819171',
            dataNascimento: '1992-02-12',
            sexo: 'M'
        },
        usuario: {
            username: 'joanatasmartins@gmail.com',
            senha: '1602aj'
        },
        admin: {
            nivel: 'super'
        }
    }, empresa.empresaId);

    await createAdmin({
        pessoa: {
            nome: 'Pedro',
            sobrenome: 'Vitor Gouveia',
            cpf: '12345678900',
            dataNascimento: '1995-01-01',
            sexo: 'M'
        },
        usuario: {
            username: 'pedrovitorgouveia123@gmail.com',
            senha: 'alpha234'
        },
        admin: {
            nivel: 'super'
        }
    }, empresa.empresaId);

    process.exit(0);
}

main().catch(err => {
    console.error('Erro ao executar seed:', err);
    process.exit(1);
});
