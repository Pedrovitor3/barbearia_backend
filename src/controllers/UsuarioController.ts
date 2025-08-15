import { AppDataSource } from '@/data-source';
import { Usuario } from '@/entity/Usuario';
import { Pessoa } from '@/entity/Pessoa';
import * as bcrypt from 'bcrypt';

export class UsuarioController {
    static async criarUsuario(data: {
        nome: string;
        sobrenome: string;
        cpf?: string;
        dataNascimento?: string;
        sexo?: string;
        username: string;
        senha: string;
    }) {
        const pessoaRepo = AppDataSource.getRepository(Pessoa);
        const usuarioRepo = AppDataSource.getRepository(Usuario);

        // Cria pessoa
        const pessoa = pessoaRepo.create({
            nome: data.nome,
            sobrenome: data.sobrenome,
            cpf: data.cpf,
            dataNascimento: data.dataNascimento,
            sexo: data.sexo,
        });
        const savedPessoa = await pessoaRepo.save(pessoa);

        // Cria usuário
        const senhaHash = await bcrypt.hash(data.senha, 10);
        const usuario = usuarioRepo.create({
            pessoaId: savedPessoa.pessoaId,
            username: data.username,
            senhaHash,
            ativo: true,
        });
        return await usuarioRepo.save(usuario);
    }
}